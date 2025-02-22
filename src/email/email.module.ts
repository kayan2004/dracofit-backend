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
        const emailUser = config.get('EMAIL_USER');
        const emailPassword = config.get('EMAIL_PASSWORD');

        logger.log(`EMAIL_USER: ${emailUser}`);
        logger.log(`EMAIL_PASSWORD: ${emailPassword ? '******' : 'Not Set'}`);

        return {
          transport: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: emailUser,
              pass: emailPassword,
            },
          },
          defaults: {
            from: '"DracoFit" <kayanabdepbaki@gmail.com>',
          },
        };
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
