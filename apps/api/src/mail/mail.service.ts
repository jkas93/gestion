import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        const smtpHost = this.configService.get<string>('SMTP_HOST');
        // Parse port explicitly to handle string inputs from .env
        const smtpPort = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
        const smtpUser = this.configService.get<string>('SMTP_USER');
        // Handle boolean correctly: ensure 'false' string isn't truthy
        const smtpSecure = this.configService.get<string>('SMTP_SECURE') === 'true';

        this.logger.log(`📧 Configurando transporte SMTP: ${smtpHost}:${smtpPort} (Secure: ${smtpSecure}) (User: ${smtpUser ? 'DEFINED' : 'UNDEFINED'})`);

        if (!smtpHost || !smtpUser) {
            this.logger.error('❌ CRITICAL: SMTP Configuration missing in MailService (Check .env file loading)');
        }

        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure, // true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: this.configService.get<string>('SMTP_PASS'),
            },
            connectionTimeout: 10000, // 10 segundos
            greetingTimeout: 5000, // 5 segundos
        });

        this.logger.log(`✅ Transporte SMTP configurado para: ${smtpUser}`);
    }

    async sendWelcomeEmail(email: string, name: string, role: string, resetLink: string) {
        const mailOptions = {
            from: `"Golden Tower ERP" <${this.configService.get<string>('SMTP_USER')}>`,
            to: email,
            subject: 'Bienvenido al sistema ERP - Golden Tower',
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Bienvenido a Golden Tower</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
                    <tr>
                        <td style="padding: 20px 0;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden;">
                                <!-- Header -->
                                <tr>
                                    <td style="background-color: #000000; padding: 40px 0; text-align: center;">
                                        <h1 style="color: #D4AF37; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; font-weight: 300;">Golden Tower</h1>
                                        <p style="color: #666666; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 4px; text-transform: uppercase;">Enterprise Resource Planning</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 40px 20px 40px;">
                                        <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Confirmación de Alta</p>
                                        <h2 style="color: #333333; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">Bienvenido al equipo, ${name}</h2>
                                        <p style="color: #D4AF37; margin: 0 0 25px 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">Cargo Asignado: ${role}</p>
                                        
                                        <p style="color: #555555; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                                            Nos complace informarte que tu cuenta corporativa ha sido creada exitosamente. Has sido registrado en la plataforma de gestión integral de <b>Golden Tower</b>.
                                        </p>
                                        
                                        <p style="color: #555555; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                                            Para garantizar la seguridad de tu acceso, es necesario que configures tu contraseña personal. Una vez completado este paso, podrás acceder al sistema inmediatamente.
                                        </p>
                                        
                                        <!-- CTA Button -->
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 10px 0 30px 0;">
                                                    <a href="${resetLink}" style="background-color: #D4AF37; color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
                                                        Activar Cuenta y Definir Contraseña
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <div style="background-color: #f9f9f9; border-left: 3px solid #D4AF37; padding: 15px; margin-bottom: 20px;">
                                            <p style="margin: 0; color: #666; font-size: 13px;">
                                                <strong>Nota de Seguridad:</strong> Este enlace es personal e intransferible. Si no has solicitado este acceso, por favor contacta inmediatamente con el departamento de RRHH.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f4f4f4; padding: 30px 40px; text-align: center;">
                                        <p style="color: #999999; font-size: 11px; margin: 0 0 10px 0;">
                                            Si tienes problemas con el botón, copia y pega el siguiente enlace:<br>
                                            <span style="color: #D4AF37; word-break: break-all;">${resetLink}</span>
                                        </p>
                                        <p style="color: #bbbbbb; font-size: 10px; margin: 20px 0 0 0; text-transform: uppercase;">
                                            © ${new Date().getFullYear()} Golden Tower. Todos los derechos reservados.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `,
        };

        // Retry logic: 3 intentos
        const maxRetries = 3;
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const startTime = Date.now();
                this.logger.log(`📤 Enviando email a ${email} (intento ${attempt}/${maxRetries})...`);

                const info = await this.transporter.sendMail(mailOptions);
                const sendTime = Date.now() - startTime;

                this.logger.log(`✅ Email enviado exitosamente en ${sendTime}ms`);
                this.logger.log(`   └─ Message ID: ${info.messageId}`);
                this.logger.log(`   └─ Destinatario: ${email}`);

                return info;
            } catch (error) {
                lastError = error;
                this.logger.warn(`⚠️ Intento ${attempt}/${maxRetries} falló: ${error.message}`);

                if (attempt < maxRetries) {
                    const retryDelay = 1000 * attempt; // Espera incremental: 1s, 2s, 3s
                    this.logger.log(`⏳ Reintentando en ${retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

        this.logger.error(`❌ Error al enviar email después de ${maxRetries} intentos:`, lastError?.stack);
        throw new Error(`Failed to send email after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
    }

    async verifyConnection(): Promise<boolean> {
        try {
            this.logger.log('🔍 Verificando conexión SMTP...');
            await this.transporter.verify();
            this.logger.log('✅ Conexión SMTP verificada exitosamente');
            return true;
        } catch (error) {
            this.logger.error('❌ Error al verificar conexión SMTP:', error.message);
            return false;
        }
    }
}
