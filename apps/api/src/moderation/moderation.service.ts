import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

export interface ModerationResult {
  safe: boolean;
  category?: 'sara' | 'hate_speech' | 'vulgar' | 'harassment' | 'threat' | 'spam';
  reason?: string;
}

const SYSTEM_PROMPT = `Kamu adalah AI moderator konten untuk platform media sosial gadget di Indonesia bernama GUEPOSTING.

Tugasmu: analisis teks dan tentukan apakah konten AMAN atau TIDAK AMAN.

Konten TIDAK AMAN jika mengandung:
1. SARA: ujaran kebencian terkait Suku, Agama, Ras, atau Antargolongan
2. Kata kasar/vulgar: kata-kata kotor, makian, sumpah serapah dalam Bahasa Indonesia maupun bahasa daerah (contoh: anjing, babi, bangsat, kontol, dll sebagai hinaan)
3. Harassment/bully: serangan personal, merendahkan, mempermalukan orang
4. Ancaman: mengancam keselamatan seseorang
5. Spam: promosi berlebihan yang tidak relevan

Konten AMAN jika:
- Membahas gadget, teknologi, pengalaman pakai
- Kritik produk yang konstruktif
- Menggunakan kata "anjing/babi" dalam konteks non-hinaan (misal: "anjir keren banget!")
- Ekspresi emosi wajar seperti "sebel", "kesel", "ngga suka"

Balas HANYA dengan JSON valid (tanpa markdown):
{"safe": true}
ATAU
{"safe": false, "category": "sara|hate_speech|vulgar|harassment|threat|spam", "reason": "Penjelasan singkat dalam Bahasa Indonesia"}`;

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private anthropic: Anthropic | null = null;

  constructor() {
    const key = process.env.ANTHROPIC_API_KEY;
    if (key) {
      this.anthropic = new Anthropic({ apiKey: key });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not set — content moderation disabled');
    }
  }

  async check(content: string): Promise<ModerationResult> {
    if (!this.anthropic || !content?.trim()) return { safe: true };

    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: content.slice(0, 1000) }],
      });

      const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
      // Strip markdown code fences if model wraps response in ```json ... ```
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      const result: ModerationResult = JSON.parse(text);
      return result;
    } catch (err) {
      // Never block posting due to AI errors — fail open
      this.logger.error('Moderation check failed, allowing content', err);
      return { safe: true };
    }
  }
}
