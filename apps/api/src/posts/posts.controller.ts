import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '@dekat/types';

@Controller('posts')
@UseGuards(JwtGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.sub, dto);
  }

  @Get('feed')
  getFeed(@CurrentUser() user: JwtPayload, @Query('cursor') cursor?: string) {
    return this.postsService.findFeed(user.sub, cursor);
  }

  @Get('trending')
  getTrending(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: string,
  ) {
    return this.postsService.findTrending(user.sub, page, limit, type);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.postsService.findAll(page, limit, type, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Delete(':id')
  delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.postsService.delete(user.sub, id);
  }

  @Post(':id/like')
  toggleLike(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('type') type = 'love',
  ) {
    return this.postsService.toggleReact(user.sub, id, type);
  }

  @Post(':id/comment')
  addComment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.postsService.addComment(user.sub, id, content);
  }

  @Post(':id/bookmark')
  toggleBookmark(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.postsService.toggleBookmark(user.sub, id);
  }

  @Post(':id/poll/vote')
  votePoll(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('optionId') optionId: string,
  ) {
    return this.postsService.votePoll(user.sub, id, optionId);
  }

  @Get('bookmarks/me')
  getBookmarks(@CurrentUser() user: JwtPayload) {
    return this.postsService.getBookmarks(user.sub);
  }
}
