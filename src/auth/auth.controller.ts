import {
  Body,
  Controller,
  Post,
  ValidationPipe,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { User } from '../users/entities/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async signUp(
    @Body(ValidationPipe) signUpDto: SignUpDto,
  ): Promise<Omit<User, 'password'>> {
    return await this.authService.signUp(signUpDto);
  }

  @Post('/signin')
  async signIn(
    @Body(ValidationPipe) loginDto: LoginDto,
  ): Promise<{ accessToken: string }> {
    return await this.authService.signIn(loginDto);
  }

  @Get('/verify-email')
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }

  @Post('/resend-verification')
  async resendVerification(@Body('email') email: string) {
    await this.authService.resendVerificationEmail(email);
    return { message: 'Verification email has been resent' };
  }

  @Post('/forgot-password')
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/reset-password')
  async resetPassword(
    @Query('token') token: string,
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
  ) {
    await this.authService.resetPassword(token, resetPasswordDto.newPassword);
    return { message: 'Password has been reset successfully' };
  }
}
