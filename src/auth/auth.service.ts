import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<Omit<User, 'password'>> {
    const { username, password, fullname, email, dob, gender } = signUpDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      fullname,
      email,
      dob,
      gender,
      created_at: new Date(),
      is_admin: false,
      isEmailVerified: false,
      verificationToken,
      verificationTokenExpires: tokenExpires,
    });

    try {
      const savedUser = await this.userRepository.save(user);
      await this.emailService.sendVerificationEmail(email, verificationToken);

      const { password: _, ...result } = savedUser;
      return result;
    } catch (error) {
      if (error.code === '23505') {
        // PostgreSQL unique violation code
        if (error.detail.includes('username')) {
          throw new UnauthorizedException('Username already exists');
        }
        if (error.detail.includes('email')) {
          throw new UnauthorizedException('Email already exists');
        }
      }
      throw new UnauthorizedException('Error creating user');
    }
  }

  async verifyEmail(token: string): Promise<void> {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (!user.verificationTokenExpires) {
      throw new BadRequestException('Token has no expiration date');
    }

    const currentTime = new Date();
    if (user.verificationTokenExpires < currentTime) {
      throw new BadRequestException('Verification token has expired');
    }

    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await this.userRepository.save(user);
  }

  async signIn(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { username, password } = loginDto;
    const user = await this.userRepository.findOneBy({ username });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Login attempt:', { username, isPasswordValid });

    if (isPasswordValid) {
      const payload = { username: user.username };
      const accessToken = this.jwtService.sign(payload);
      console.log('Token generated:', accessToken);
      return { accessToken };
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async resendVerificationEmail(email: string): Promise<void> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('No user found with this email');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24);

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = tokenExpires;
    await this.userRepository.save(user);

    await this.emailService.sendVerificationEmail(email, verificationToken);
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('No user found with this email');
    }
    // Generate token valid for 1 hour
    const resetToken = randomBytes(32).toString('hex');
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 1);

    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpires = tokenExpires;
    await this.userRepository.save(user);

    // Send the reset token via email
    await this.emailService.sendResetPasswordEmail(email, resetToken);

    return { message: 'Reset password email has been sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token) {
      throw new BadRequestException('Reset token is required');
    }

    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }

    if (
      !user.resetPasswordTokenExpires ||
      user.resetPasswordTokenExpires < new Date()
    ) {
      throw new BadRequestException('Reset token has expired');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset token fields
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpires = null;

    await this.userRepository.save(user);
  }
}
