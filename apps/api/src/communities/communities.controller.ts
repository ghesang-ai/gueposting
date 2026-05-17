import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '@gueposting/types';

@Controller('communities')
@UseGuards(JwtGuard)
export class CommunitiesController {
  constructor(private communitiesService: CommunitiesService) {}

  @Get()
  findAll() {
    return this.communitiesService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {
    return this.communitiesService.findOne(slug, user.sub);
  }

  @Post(':id/join')
  toggleMember(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.communitiesService.toggleMember(user.sub, id);
  }
}
