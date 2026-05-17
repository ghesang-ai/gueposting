import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

@Injectable()
export class MediaService {
  private supabase;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_KEY')!,
    );
    this.bucket = config.get<string>('SUPABASE_STORAGE_BUCKET')!;
  }

  generateFilePath(userId: string, originalName: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase() ?? 'bin';
    return `${userId}/${nanoid(16)}.${ext}`;
  }

  async upload(userId: string, file: Express.Multer.File): Promise<string> {
    const path = this.generateFilePath(userId, file.originalname);
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new Error(`Upload gagal: ${error.message}`);
    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async deleteByUrl(publicUrl: string): Promise<void> {
    const bucketPath = publicUrl.split(`/${this.bucket}/`)[1];
    if (!bucketPath) return;
    await this.supabase.storage.from(this.bucket).remove([bucketPath]);
  }
}
