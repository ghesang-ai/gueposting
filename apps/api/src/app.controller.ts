import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get()
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('db')
  async dbCheck() {
    try {
      const count = await this.prisma.user.count();
      return { status: 'ok', userCount: count };
    } catch (e: any) {
      return { status: 'error', message: e.message, code: e.code };
    }
  }
}
