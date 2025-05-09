import {
  Body,
  Controller,
  Post,
  ValidationPipe,
  Get,
  Query,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { User } from '../users/entities/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  async signUp(
    @Body(ValidationPipe) signUpDto: SignUpDto,
  ): Promise<{ message: string }> {
    await this.authService.signUp(signUpDto);
    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  @Post('/login')
  async signIn(
    @Body(ValidationPipe) loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    return this.authService.signIn(loginDto);
  }

  @UseGuards(JwtAuthGuard) // Protect this route
  @Get('profile')
  getProfile(@Request() req) {
    // req.user is populated by JwtAuthGuard after validating the token
    // It contains the payload that was stored in the JWT (e.g., userId, username)
    // Ensure your JWT strategy's validate method returns the necessary user info
    console.log('GET /auth/profile - User from token:', req.user);
    // You might want to remove sensitive data like password hash if it's included
    // Or fetch the full user entity if the JWT payload is minimal:
    // return this.usersService.findOne(req.user.userId); // If UsersService is injected
    return req.user; // Return the user payload from the validated token
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
