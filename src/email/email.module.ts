import { Module, Logger } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('EmailModule');
        const emailUser = config.get<string>('EMAIL_USER');
        const emailPassword = config.get<string>('EMAIL_PASSWORD');

        if (!emailUser || !emailPassword) {
          logger.error('Email configuration is missing');
          throw new Error('Email configuration is incomplete');
        }

        logger.log('Email configuration loaded successfully');

        return {
          transport: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: emailUser,
              pass: emailPassword,
            },
            tls: {
              rejectUnauthorized: false,
            },
          },
          defaults: {
            from: `"DracoFit" <${emailUser}>`,
          },
        };
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
