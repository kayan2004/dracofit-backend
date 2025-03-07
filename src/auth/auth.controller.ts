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
  ): Promise<{ message: string }> {
    await this.authService.signUp(signUpDto);
    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  @Post('/signin')
  async signIn(
    @Body(ValidationPipe) loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    return this.authService.signIn(loginDto);
  }

  @Get('/verify-email')
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }

  @Post('/resend-verification')
  async resendVerification(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    await this.authService.resendVerificationEmail(email);
    return { message: 'Verification email has been resent' };
  }

  @Post('/forgot-password')
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      message: 'Password reset instructions have been sent to your email',
    };
  }

  @Post('/reset-password')
  async resetPassword(
    @Query('token') token: string,
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    await this.authService.resetPassword(token, resetPasswordDto);
    return { message: 'Password has been reset successfully' };
  }
}
