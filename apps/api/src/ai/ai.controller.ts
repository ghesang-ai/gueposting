import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { CompareRequestDto } from './dto/compare-request.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '@gueposting/types';

@Controller('ai')
@UseGuards(JwtGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('compare')
  createComparison(@CurrentUser() user: JwtPayload, @Body() dto: CompareRequestDto) {
    return this.aiService.createComparison(user.sub, dto);
  }

  @Get('compare/:id')
  getComparison(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.aiService.getComparison(id, user.sub);
  }

  @Get('gadgets/:gadgetId/sentiment')
  getSentiment(@Param('gadgetId') gadgetId: string) {
    return this.aiService.getGadgetSentiment(gadgetId);
  }
}
