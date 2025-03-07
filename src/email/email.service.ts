import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000/api/auth';
  }

  async sendVerificationEmail(email: string, token: string) {
    try {
      this.logger.log('Sending verification email');
      const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify your DracoFit account',
        html: `
          <h2>Welcome to DracoFit!</h2>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        `,
      });

      this.logger.log('Verification email sent successfully');
    } catch (error) {
      this.logger.error('Failed to send verification email', error.stack);
      throw error;
    }
  }

  async sendResetPasswordEmail(email: string, token: string) {
    try {
      this.logger.log('Sending reset password email');
      const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset your DracoFit password',
        html: `
          <h2>Reset Password Request</h2>
          <p>Please click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p>For security, please change your password if you suspect unauthorized access.</p>
        `,
      });

      this.logger.log('Reset password email sent successfully');
    } catch (error) {
      this.logger.error('Failed to send reset password email', error.stack);
      throw error;
    }
  }
}
