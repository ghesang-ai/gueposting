import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompareRequestDto } from './dto/compare-request.dto';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiService {
  private anthropic: Anthropic;

  constructor(private prisma: PrismaService) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async createComparison(userId: string, dto: CompareRequestDto) {
    const comparison = await this.prisma.aiComparison.create({
      data: {
        userId,
        gadgetIds: dto.gadgetIds,
        userBudget: dto.userBudget,
        userUsecase: dto.userUsecase,
        status: 'pending',
      },
    });

    // Fire and forget — no queue/Redis needed
    void this.processComparison(comparison.id);

    return comparison;
  }

  private async processComparison(comparisonId: string) {
    await this.prisma.aiComparison.update({
      where: { id: comparisonId },
      data: { status: 'processing' },
    });

    try {
      const comparison = await this.prisma.aiComparison.findUnique({ where: { id: comparisonId } });
      if (!comparison) throw new Error('Comparison not found');

      const gadgets = await this.prisma.gadget.findMany({
        where: { id: { in: comparison.gadgetIds } },
      });

      const reviewsPerGadget: Record<string, string[]> = {};
      for (const gadget of gadgets) {
        const reviews = await this.prisma.post.findMany({
          where: { gadgetId: gadget.id, type: 'review' },
          select: { content: true, rating: true },
          take: 20,
          orderBy: { createdAt: 'desc' },
        });
        reviewsPerGadget[gadget.id] = reviews.map(
          (r) => `[Rating: ${r.rating ?? 'N/A'}] ${r.content}`,
        );
      }

      const gadgetContext = gadgets.map((g) => ({
        id: g.id,
        name: g.name,
        brand: g.brand,
        specs: g.specs,
        communityReviews: reviewsPerGadget[g.id],
      }));

      const prompt = this.buildPrompt(gadgetContext, comparison.userBudget, comparison.userUsecase);

      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: `Kamu adalah ahli gadget Indonesia yang membantu user membandingkan device secara objektif.
Gunakan data spesifikasi dan review komunitas yang diberikan.
Selalu jawab dalam Bahasa Indonesia yang natural dan mudah dipahami.
Output HARUS berupa JSON valid sesuai schema yang diminta. Jangan tambahkan teks apapun di luar JSON.`,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const text = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const result = JSON.parse(text);

      await this.prisma.aiComparison.update({
        where: { id: comparisonId },
        data: {
          scores: result.scores as any,
          summary: result.summary,
          recommendation: result.recommendation,
          status: 'done',
        },
      });
    } catch (error) {
      console.error('AI comparison failed:', error);
      await this.prisma.aiComparison.update({
        where: { id: comparisonId },
        data: { status: 'failed' },
      });
    }
  }

  private buildPrompt(
    gadgets: Array<{ id: string; name: string; brand: string; specs: any; communityReviews: string[] }>,
    budget?: number | null,
    usecase?: string | null,
  ): string {
    const gadgetList = gadgets
      .map(
        (g) => `
Device: ${g.name} (${g.brand})
ID: ${g.id}
Spesifikasi: ${JSON.stringify(g.specs, null, 2)}
Review Komunitas (${g.communityReviews.length} review):
${g.communityReviews.slice(0, 10).join('\n') || 'Belum ada review'}
`,
      )
      .join('\n---\n');

    return `Bandingkan device-device berikut:

${gadgetList}

${budget ? `Budget user: Rp ${budget.toLocaleString('id-ID')}` : ''}
${usecase ? `Kebutuhan utama: ${usecase}` : ''}

Berikan analisis dalam format JSON berikut (semua nilai score adalah angka 0-10):
{
  "scores": {
    "<gadget_id>": {
      "overall": <0-10>,
      "camera": <0-10>,
      "battery": <0-10>,
      "performance": <0-10>,
      "display": <0-10>,
      "ecosystem": <0-10>,
      "nilai_uang": <0-10>
    }
  },
  "summary": "<ringkasan perbandingan 2-3 kalimat dalam Bahasa Indonesia>",
  "recommendation": "<rekomendasi spesifik berdasarkan kebutuhan user, sebutkan nama device>"
}`;
  }

  async getComparison(id: string, userId: string) {
    const comparison = await this.prisma.aiComparison.findUnique({ where: { id } });
    if (!comparison) throw new NotFoundException('Comparison tidak ditemukan');
    if (comparison.userId !== userId) throw new NotFoundException('Comparison tidak ditemukan');
    return comparison;
  }

  async getGadgetSentiment(gadgetId: string) {
    const reviews = await this.prisma.post.findMany({
      where: { gadgetId, type: { in: ['review'] } },
      select: { content: true, rating: true },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    if (reviews.length === 0) {
      return { gadgetId, reviewCount: 0, avgRating: null, sentiment: null };
    }

    const avgRating = reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length;
    return { gadgetId, reviewCount: reviews.length, avgRating: Math.round(avgRating * 10) / 10 };
  }
}
