import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../users/events/user-created.event';
import { forwardRef, Inject } from '@nestjs/common';
import { UserPetsService } from '../user-pets/user-pets.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserTokens)
    private userTokensRepository: Repository<UserTokens>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => UserPetsService)) // Keep this if UserPetsService is still needed for other things or if the listener is in UserPetsModule
    private readonly userPetsService: UserPetsService, // This might become unused here if pet creation is fully event-driven
    private readonly eventEmitter: EventEmitter2, // <<< INJECT EventEmitter2
  ) {}

  private async createToken(
    user: User,
    type: TokenType,
    manager?: EntityManager, // <<< Add optional manager
  ): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(
      expires.getHours() + (type === TokenType.EMAIL_VERIFICATION ? 24 : 1),
    );

    const tokenRepository = manager
      ? manager.getRepository(UserTokens)
      : this.userTokensRepository; // <<< Use manager if provided

    await tokenRepository.save({
      // <<< Use the determined repository
      user, // TypeORM should handle linking user.id correctly
      token,
      tokenType: type,
      expiresAt: expires,
    });

    return token;
  }

  async signUp(signUpDto: SignUpDto): Promise<Omit<User, 'password'>> {
    const { username, password, firstName, lastName, email } = signUpDto;
    this.logger.log(`Attempting to sign up user: ${username}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      const userEntity = queryRunner.manager.create(User, {
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        isAdmin: false,
        isEmailVerified: false,
      });

      const savedUser = await queryRunner.manager.save(userEntity);
      this.logger.log(`User ${username} saved with ID: ${savedUser.id}`);

      // --- Pet creation logic is handled by event listener ---

      // Create verification token USING THE TRANSACTION MANAGER
      const verificationToken = await this.createToken(
        savedUser,
        TokenType.EMAIL_VERIFICATION,
        queryRunner.manager, // <<< Pass the transaction manager
      );
      // Email sending doesn't need the transaction manager unless it writes to DB
      await this.emailService.sendVerificationEmail(email, verificationToken);
      this.logger.log(`Verification email sent to ${email}`);

      await queryRunner.commitTransaction();
      this.logger.log(
        `User ${username} and associated data committed successfully.`,
      );

      // Emit the event AFTER the transaction is committed
      this.eventEmitter.emit(
        'user.created',
        new UserCreatedEvent(savedUser.id, savedUser.username),
      );
      this.logger.log(
        `Emitted 'user.created' event for user ID: ${savedUser.id}`,
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = savedUser;
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // Enhanced logging for the original error
      this.logger.error(
        `SIGNUP_ERROR_RAW for ${username}: Message: ${error.message}, Code: ${error.code}, Detail: ${error.detail}, Stack: ${error.stack}`,
      );

      if (error.code === '23503' && error.table === 'user_tokens') {
        // Foreign key violation on user_tokens
        this.logger.error(
          `Foreign key violation on user_tokens for user ${username} during signup: ${error.detail}`,
        );
        throw new InternalServerErrorException(
          'Error creating user verification token due to data inconsistency.',
        );
      }

      if (error.code === '23505') {
        // PostgreSQL unique violation
        if (error.detail?.includes('username')) {
          this.logger.warn(`Conflict: Username ${username} already exists.`);
          throw new ConflictException('Username already exists');
        }
        if (error.detail?.includes('email')) {
          this.logger.warn(`Conflict: Email for ${username} already exists.`);
          throw new ConflictException('Email already exists');
        }
        // Check for unique constraint on pets table, e.g., if userId must be unique
        if (
          error.table === 'pets' ||
          error.detail?.includes('pets_user_id_key') ||
          error.detail?.includes('pets_userId_key')
        ) {
          // Adjust based on your actual constraint name
          this.logger.error(
            `Unique constraint violation on pets table for user ${username}: ${error.detail}`,
          );
          throw new ConflictException(
            'User already has a pet or pet creation conflict.',
          );
        }
      }

      // Explicitly check for ConflictException from UserPetsService
      if (
        error instanceof ConflictException &&
        error.message.includes('User already has a pet')
      ) {
        this.logger.error(
          `ConflictException from UserPetsService for ${username}: ${error.message}`,
        );
        throw error; // Re-throw the original ConflictException from UserPetsService
      }

      // Log that we are falling back to the generic error
      this.logger.error(
        `Falling back to generic 'Error creating user' for ${username}. Original error (type: ${error.constructor.name}) was not specifically handled.`,
      );
      throw new BadRequestException('Error creating user');
    } finally {
      await queryRunner.release();
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

  async logout(userId: number): Promise<void> {
    // Find the user
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Remove any existing auth tokens for this user
    await this.userTokensRepository.delete({
      user: { id: userId },
      tokenType: TokenType.AUTH_TOKEN,
    });
  }
}
