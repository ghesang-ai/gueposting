import { Controller, Get, Post, Delete, Patch, Param, Query, Body, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SetMetadata } from '@nestjs/common';
import type { JwtPayload } from '@dekat/types';

const Admin = () => SetMetadata('role', 'admin');

@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Admin()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('posts')
  getPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getPosts(page, limit);
  }

  @Delete('posts/:id')
  deletePost(@Param('id') id: string) {
    return this.adminService.deletePost(id);
  }

  @Get('users/pending')
  getPendingUsers() {
    return this.adminService.getPendingUsers();
  }

  @Patch('users/:id/approve')
  approveUser(@Param('id') id: string) {
    return this.adminService.approveUser(id);
  }

  @Delete('users/:id/reject')
  rejectUser(@Param('id') id: string) {
    return this.adminService.rejectUser(id);
  }

  @Get('users')
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search = '',
  ) {
    return this.adminService.getUsers(page, limit, search);
  }

  @Patch('users/:id/trust-score')
  updateTrustScore(
    @Param('id') id: string,
    @Body('trustScore') trustScore: number,
  ) {
    return this.adminService.updateTrustScore(id, trustScore);
  }

  @Patch('users/:id/role')
  updateRole(
    @Param('id') id: string,
    @Body('role') role: 'user' | 'admin',
  ) {
    return this.adminService.updateUserRole(id, role);
  }

  @Get('invites')
  getInvites(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getInvites(page, limit);
  }

  @Get('gadgets')
  getGadgets(@Query('search') search = '') {
    return this.adminService.getGadgets(search);
  }

  @Post('gadgets')
  createGadget(@Body() body: { name: string; brand: string; category: string; imageUrl?: string; specs?: object }) {
    return this.adminService.createGadget(body);
  }

  @Patch('gadgets/:id')
  updateGadget(
    @Param('id') id: string,
    @Body() body: { name?: string; brand?: string; category?: string; imageUrl?: string; specs?: object },
  ) {
    return this.adminService.updateGadget(id, body);
  }

  @Delete('gadgets/:id')
  deleteGadget(@Param('id') id: string) {
    return this.adminService.deleteGadget(id);
  }

  @Patch('gadgets/:id/trending')
  setGadgetTrending(
    @Param('id') id: string,
    @Body('isTrending') isTrending: boolean,
  ) {
    return this.adminService.setGadgetTrending(id, isTrending);
  }

  @Post('invites')
  createInvites(
    @CurrentUser() user: JwtPayload,
    @Body('count', new DefaultValuePipe(1), ParseIntPipe) count: number,
  ) {
    return this.adminService.createInvite(user.sub, Math.min(count, 20));
  }

  @Get('activity')
  getActivityStats() {
    return this.adminService.getActivityStats();
  }
}
