import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT', 587),
            secure: this.configService.get<boolean>('SMTP_SECURE', false),
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    async sendWelcomeEmail(email: string, name: string, resetLink: string) {
        const mailOptions = {
            from: `"Golden Tower ERP" <${this.configService.get<string>('SMTP_USER')}>`,
            to: email,
            subject: 'Bienvenido al sistema ERP - Golden Tower',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #d4af37; text-transform: uppercase;">Bienvenido, ${name}</h2>
          <p>Has sido invitado a unirte a la plataforma de gestión de <b>Golden Tower</b>.</p>
          <p>Para activar tu cuenta y configurar tu contraseña, haz clic en el siguiente botón:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px;">CONFIGURAR MI CUENTA</a>
          </div>
          <p style="font-size: 12px; color: #777;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="font-size: 10px; color: #aaa;">${resetLink}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 10px; color: #aaa; text-align: center;">© 2026 Golden Tower. Todos los derechos reservados.</p>
        </div>
      `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent: ' + info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
}
