import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
    constructor(
      private mailerService: MailerService, 
    ) { }

  async sendRegisterMail(emailUser: string, nameUser: string, activationUrl: string) {
      await this.mailerService.sendMail({
        to: emailUser,
        subject: 'Xác nhận tài khoản của bạn',
        template: '../templates/register',
        context: {
            name: nameUser,
            activationUrl,
        }
    });
  }
}
