import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private mailerService: MailerService) {}

  async sendVerificationEmail(email: string, token: string) {
    try {
      this.logger.log(`Attempting to send verification email to ${email}`);

      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify your DracoFit account',
        html: `
          <h2>Welcome to DracoFit!</h2>
          <p>Please verify your email by clicking the link below:</p>
          <a href="http://localhost:3000/api/auth/verify-email?token=${token}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `,
      });

      this.logger.log(`Verification email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error.message}`);
      throw error;
    }
  }

  async sendResetPasswordEmail(email: string, token: string) {
    try {
      this.logger.log(`Attempting to send reset password email to ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset your DracoFit password',
        html: `
        <h2>Reset Password Request</h2>
        <p>Please click the link below to reset your password:</p>
        <a href="http://localhost:3000/api/auth/reset-password?token=${token}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
      });
      this.logger.log(`Reset password email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email: ${error.message}`,
      );
      throw error;
    }
  }
}
