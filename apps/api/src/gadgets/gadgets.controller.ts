import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { GadgetsService } from './gadgets.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '@dekat/types';
import { GadgetCategory } from '@prisma/client';
import { IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';

class CreateGadgetDto {
  @IsString() @MinLength(2) @MaxLength(100) name: string;
  @IsString() @MinLength(1) @MaxLength(50) brand: string;
  @IsEnum(GadgetCategory) category: GadgetCategory;
  @IsOptional() @IsString() imageUrl?: string;
}

@Controller('gadgets')
@UseGuards(JwtGuard)
export class GadgetsController {
  constructor(private gadgetsService: GadgetsService) {}

  @Get('trending')
  findTrending() {
    return this.gadgetsService.findTrending();
  }

  @Get()
  findAll(
    @Query('search') search = '',
    @Query('category') category?: GadgetCategory,
    @Query('sort') sort?: 'trending' | 'default',
    @Query('limit') limit?: string,
  ) {
    return this.gadgetsService.findAll({ search, category, sort, limit: limit ? parseInt(limit) : 50 });
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateGadgetDto) {
    return this.gadgetsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gadgetsService.findOne(id);
  }
}
