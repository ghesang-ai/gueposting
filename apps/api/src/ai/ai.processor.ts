import { Process, Processor } from '@nestjs/bull';
import * as Bull from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Processor('ai-compare')
export class AiProcessor {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  @Process('process-comparison')
  async handleComparison(job: Bull.Job<{ comparisonId: string }>) {
    const { comparisonId } = job.data;

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

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Kamu adalah ahli gadget Indonesia yang membantu user membandingkan device secara objektif.
Gunakan data spesifikasi dan review komunitas yang diberikan.
Selalu jawab dalam Bahasa Indonesia yang natural dan mudah dipahami.
Output HARUS berupa JSON valid sesuai schema yang diminta.`,
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content ?? '{}');

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
      await this.prisma.aiComparison.update({
        where: { id: comparisonId },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  private buildPrompt(
    gadgets: Array<{ id: string; name: string; brand: string; specs: any; communityReviews: string[] }>,
    budget?: number | null,
    usecase?: string | null,
  ): string {
    const gadgetList = gadgets.map((g) => `
Device: ${g.name} (${g.brand})
ID: ${g.id}
Spesifikasi: ${JSON.stringify(g.specs, null, 2)}
Review Komunitas DEKAT (${g.communityReviews.length} review):
${g.communityReviews.slice(0, 10).join('\n') || 'Belum ada review'}
`).join('\n---\n');

    return `Bandingkan device-device berikut:

${gadgetList}

${budget ? `Budget user: Rp ${budget.toLocaleString('id-ID')}` : ''}
${usecase ? `Kebutuhan utama: ${usecase}` : ''}

Berikan analisis dalam format JSON berikut:
{
  "scores": {
    "<gadget_id>": {
      "overall": <0-10>,
      "camera": { "score": <0-10>, "justification": "<alasan 1-2 kalimat>" },
      "battery": { "score": <0-10>, "justification": "<alasan 1-2 kalimat>" },
      "performance": { "score": <0-10>, "justification": "<alasan 1-2 kalimat>" },
      "display": { "score": <0-10>, "justification": "<alasan 1-2 kalimat>" },
      "ecosystem": { "score": <0-10>, "justification": "<alasan 1-2 kalimat>" },
      "sentimentScore": <0-10 dari review komunitas>,
      "topComplaints": ["<keluhan 1>", "<keluhan 2>", "<keluhan 3>"],
      "topPraises": ["<pujian 1>", "<pujian 2>", "<pujian 3>"]
    }
  },
  "summary": "<ringkasan perbandingan 2-3 kalimat>",
  "recommendation": "<rekomendasi spesifik berdasarkan kebutuhan user, sebutkan nama device>"
}`;
  }
}
