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

  async askAI(question: string) {
    // Search gadgets by keywords from the question
    const keywords = question
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    const gadgets = await this.prisma.gadget.findMany({
      where: {
        OR: keywords.flatMap(k => [
          { name: { contains: k, mode: 'insensitive' as const } },
          { brand: { contains: k, mode: 'insensitive' as const } },
          { category: { contains: k, mode: 'insensitive' as const } },
        ]),
      },
      take: 6,
      orderBy: { avgScore: 'desc' },
    });

    // Also get recent discussion posts mentioning keywords
    const posts = await this.prisma.post.findMany({
      where: {
        OR: keywords.map(k => ({ content: { contains: k, mode: 'insensitive' as const } })),
        type: { in: ['review', 'discussion'] },
      },
      select: { content: true, type: true, rating: true, user: { select: { username: true } } },
      take: 10,
      orderBy: { likeCount: 'desc' },
    });

    const gadgetContext = gadgets.map(g => ({
      id: g.id,
      name: g.name,
      brand: g.brand,
      category: g.category,
      avgScore: g.avgScore,
      reviewCount: g.reviewCount,
      imageUrl: g.imageUrl,
    }));

    const communityInsight = posts
      .map(p => `[${p.type}${p.rating ? ` ${p.rating}/10` : ''}] @${p.user.username}: ${p.content.slice(0, 120)}`)
      .join('\n');

    const prompt = `Kamu adalah GUE AI Assistant, asisten gadget komunitas GUEPOSTING Indonesia.
User bertanya: "${question}"

Data gadget yang relevan dari database GUEPOSTING:
${JSON.stringify(gadgetContext, null, 2)}

Insight dari komunitas GUEPOSTING:
${communityInsight || '(belum ada review spesifik)'}

Jawab pertanyaan user secara natural, singkat, dan informatif dalam Bahasa Indonesia.
Rekomendasikan 1-3 gadget terbaik dari data di atas yang paling cocok.

Output HARUS berupa JSON valid ini saja (tanpa teks lain):
{
  "answer": "<jawaban natural 2-3 kalimat, langsung ke intinya>",
  "recommendations": [
    { "gadgetId": "<id dari data di atas>", "reason": "<alasan singkat 1 kalimat>" }
  ]
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      const result = JSON.parse(text);

      const recommendedIds: string[] = (result.recommendations ?? []).map((r: any) => r.gadgetId);
      const recommendedGadgets = gadgets.filter(g => recommendedIds.includes(g.id));
      // Preserve recommendation order + attach reason
      const recommendedWithReason = recommendedIds
        .map(id => {
          const g = gadgets.find(x => x.id === id);
          const rec = result.recommendations.find((r: any) => r.gadgetId === id);
          return g ? { ...g, reason: rec?.reason ?? '' } : null;
        })
        .filter(Boolean);

      return {
        answer: result.answer ?? 'Maaf, saya tidak dapat menemukan rekomendasi yang tepat.',
        gadgets: recommendedWithReason,
        allGadgets: gadgetContext,
      };
    } catch {
      return {
        answer: 'Maaf, GUE AI sedang sibuk. Coba lagi sebentar lagi.',
        gadgets: gadgets.slice(0, 3).map(g => ({ ...g, reason: '' })),
        allGadgets: gadgetContext,
      };
    }
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
