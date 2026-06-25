import { Controller, Post, Get, Patch, Body, UseGuards, UploadedFile, UseInterceptors, Req, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from '@gueposting/types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('setup')
  setup(@Body() dto: { email: string; username: string; displayName: string; password: string }) {
    return this.authService.setupAdmin(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  @Patch('onboarding')
  @UseGuards(JwtGuard)
  completeOnboarding(@CurrentUser() user: JwtPayload, @Body() body: { gadgetId: string }) {
    return this.authService.completeOnboarding(user.sub, body.gadgetId);
  }

  @Patch('profile')
  @UseGuards(JwtGuard)
  updateProfile(@CurrentUser() user: JwtPayload, @Body() body: { displayName?: string; bio?: string; avatarUrl?: string; avatarPositionX?: number; avatarPositionY?: number; coverUrl?: string | null; coverPositionY?: number; location?: string | null; website?: string | null }) {
    return this.authService.updateProfile(user.sub, body);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() { /* redirects to Google */ }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    const { token } = req.user;
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    res.redirect(`${webUrl}/auth/callback?token=${token}`);
  }
}
