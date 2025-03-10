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
        // Change EMAIL_USER to MAIL_USER
        const emailUser = config.get<string>('MAIL_USER');
        // Change EMAIL_PASSWORD to MAIL_PASSWORD
        const emailPassword = config.get<string>('MAIL_PASSWORD');

        if (!emailUser || !emailPassword) {
          logger.error('Email configuration is missing');
          throw new Error('Email configuration is incomplete');
        }

        logger.log('Email configuration loaded successfully');

        return {
          transport: {
            host: config.get('MAIL_HOST'),
            port: config.get('MAIL_PORT'),
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
