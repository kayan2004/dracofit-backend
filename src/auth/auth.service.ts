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
import {
  UserTokens,
  TokenType,
} from '../user-tokens/entities/user-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserTokens)
    private userTokensRepository: Repository<UserTokens>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private async createToken(user: User, type: TokenType): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(
      expires.getHours() + (type === TokenType.EMAIL_VERIFICATION ? 24 : 1),
    );

    await this.userTokensRepository.save({
      user,
      token,
      tokenType: type,
      expiresAt: expires,
    });

    return token;
  }

  async signUp(signUpDto: SignUpDto): Promise<Omit<User, 'password'>> {
    const { username, password, firstName, lastName, email } = signUpDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      firstName,
      lastName,
      email,
      isAdmin: false,
      isEmailVerified: false,
    });

    try {
      const savedUser = await this.userRepository.save(user);
      const verificationToken = await this.createToken(
        savedUser,
        TokenType.EMAIL_VERIFICATION,
      );
      await this.emailService.sendVerificationEmail(email, verificationToken);

      const { password: _, ...result } = savedUser;
      return result;
    } catch (error) {
      if (error.code === '23505') {
        if (error.detail.includes('username')) {
          throw new BadRequestException('Username already exists');
        }
        if (error.detail.includes('email')) {
          throw new BadRequestException('Email already exists');
        }
      }
      throw new BadRequestException('Error creating user');
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const userToken = await this.userTokensRepository.findOne({
      where: {
        token,
        tokenType: TokenType.EMAIL_VERIFICATION,
      },
      relations: ['user'],
    });

    if (!userToken || userToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    userToken.user.isEmailVerified = true;
    await this.userRepository.save(userToken.user);
    await this.userTokensRepository.remove(userToken);
  }

  async signIn(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    const { username, password } = loginDto;
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user || !user.isEmailVerified) {
      throw new UnauthorizedException(
        'Invalid credentials or email not verified',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    };

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('No user found with this email');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Remove any existing verification tokens
    await this.userTokensRepository.delete({
      user: { id: user.id },
      tokenType: TokenType.EMAIL_VERIFICATION,
    });

    const verificationToken = await this.createToken(
      user,
      TokenType.EMAIL_VERIFICATION,
    );
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

    // Remove any existing reset tokens
    await this.userTokensRepository.delete({
      user: { id: user.id },
      tokenType: TokenType.PASSWORD_RESET,
    });

    const resetToken = await this.createToken(user, TokenType.PASSWORD_RESET);
    await this.emailService.sendResetPasswordEmail(email, resetToken);

    return { message: 'Reset password email has been sent' };
  }

  async resetPassword(
    token: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    const userToken = await this.userTokensRepository.findOne({
      where: {
        token,
        tokenType: TokenType.PASSWORD_RESET,
      },
      relations: ['user'],
    });

    if (!userToken || userToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt();
    userToken.user.password = await bcrypt.hash(
      resetPasswordDto.newPassword,
      salt,
    );

    await this.userRepository.save(userToken.user);
    await this.userTokensRepository.remove(userToken);
  }
}
