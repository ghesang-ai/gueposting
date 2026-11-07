import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface ModerationResult {
  safe: boolean;
  category?: 'sara' | 'hate_speech' | 'vulgar' | 'harassment' | 'threat' | 'spam';
  reason?: string;
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private openai: OpenAI | null = null;

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (key) {
      this.openai = new OpenAI({ apiKey: key });
    } else {
      this.logger.warn('OPENAI_API_KEY not set — content moderation disabled');
    }
  }

  async check(content: string): Promise<ModerationResult> {
    if (!this.openai || !content?.trim()) return { safe: true };

    try {
      const result = await this.openai.moderations.create({
        input: content.slice(0, 1000),
        model: 'omni-moderation-latest',
      });

      const flagged = result.results[0]?.flagged ?? false;
      if (!flagged) return { safe: true };

      const cats = result.results[0]?.categories as Record<string, boolean>;
      const category = Object.keys(cats).find(k => cats[k]) as ModerationResult['category'];
      return { safe: false, category, reason: `Konten terdeteksi melanggar kategori: ${category}` };
    } catch (err) {
      this.logger.error('Moderation check failed, allowing content', err);
      return { safe: true };
    }
  }
}
