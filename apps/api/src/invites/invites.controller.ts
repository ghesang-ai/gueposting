import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '@gueposting/types';

@Controller('invites')
@UseGuards(JwtGuard)
export class InvitesController {
  constructor(private invitesService: InvitesService) {}

  @Post('generate')
  create(@CurrentUser() user: JwtPayload) {
    return this.invitesService.create(user.sub);
  }

  @Post('redeem')
  redeem(@CurrentUser() user: JwtPayload, @Body('code') code: string) {
    return this.invitesService.redeem(code, user.sub);
  }

  @Get('mine')
  getMine(@CurrentUser() user: JwtPayload) {
    return this.invitesService.findByUser(user.sub);
  }
}
