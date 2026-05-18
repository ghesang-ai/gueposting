import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '@gueposting/types';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'image/heic', 'image/heif', 'image/avif', 'image/bmp',
  'video/mp4', 'video/quicktime',
];
const MAX_SIZE = 50 * 1024 * 1024;

@Controller('media')
@UseGuards(JwtGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('File type tidak didukung. Gunakan JPG, PNG, WebP, atau MP4') as any, false);
      },
    }),
  )
  async upload(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File tidak ditemukan');
    const url = await this.mediaService.upload(user.sub, file);
    return { url };
  }
}
