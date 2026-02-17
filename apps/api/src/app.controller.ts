import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MailService } from './mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('email-status')
  async checkEmail() {
    const user = this.configService.get('SMTP_USER');
    let status = 'Checking via nodemailer...';
    try {
      const ok = await this.mailService.verifyConnection();
      status = ok ? 'CONNECTED ✅' : 'FAILED ❌';
    } catch (e) {
      status = `ERROR: ${e.message}`;
    }
    return {
      env_smtp_user: user ? `PRESENT (${user.substring(0, 3)}...)` : 'MISSING ❌',
      env_smtp_host: this.configService.get('SMTP_HOST') || 'MISSING ❌',
      connection_check: status,
      process_env_user: process.env.SMTP_USER ? 'Present in process.env' : 'Missing in process.env'
    };
  }
}
