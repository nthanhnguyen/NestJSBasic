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
        from: '"JobHub" <support@example.com>',
        subject: 'Xác nhận tài khoản của bạn',
        template: '../templates/register',
        context: {
            name: nameUser,
            activationUrl,
        }
    });
  }

  async sendEmployerRegistration(emailUser: string, nameUser: string) {
    await this.mailerService.sendMail({
      to: emailUser,
      from: '"JobHub" <support@example.com>',
      subject: 'Xác nhận đăng ký nhà tuyển dụng',
      template: '../templates/register',
      context: {
          name: nameUser,
      }
  });
}
}
