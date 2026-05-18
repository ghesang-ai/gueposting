import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '@gueposting/types';

@Controller()
@UseGuards(JwtGuard)
export class SocialController {
  constructor(private socialService: SocialService) {}

  @Post('users/:username/follow')
  async toggleFollow(@CurrentUser() user: JwtPayload, @Param('username') username: string) {
    const target = await this.socialService.findByUsername(username);
    return this.socialService.toggleFollow(user.sub, target.id);
  }

  @Get('users')
  searchUsers(@Query('search') search = '', @Query('limit') limit = '10') {
    return this.socialService.searchUsers(search, parseInt(limit));
  }

  @Get('users/:username')
  getProfile(@Param('username') username: string, @CurrentUser() user: JwtPayload) {
    return this.socialService.getProfile(username, user.sub);
  }

  @Get('users/:username/posts')
  getUserPosts(@Param('username') username: string, @Query('limit') limit = '20') {
    return this.socialService.getUserPosts(username, parseInt(limit));
  }

  @Get('users/:username/followers')
  getFollowers(@Param('username') username: string, @CurrentUser() user: JwtPayload) {
    return this.socialService.getFollowers(username, user.sub);
  }

  @Get('users/:username/following')
  getFollowing(@Param('username') username: string, @CurrentUser() user: JwtPayload) {
    return this.socialService.getFollowing(username, user.sub);
  }

  @Get('feed/trending')
  getTrending(@Query('limit') limit = '10') {
    return this.socialService.getTrending(parseInt(limit));
  }
}
