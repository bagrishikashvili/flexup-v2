import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { AppConfigService } from '@/config/config.service';
import type { EmailMessage, EmailProvider } from './email-provider.interface';

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private readonly transporter: Transporter;

  constructor(private readonly configService: AppConfigService) {
    const smtp = configService.email.smtp;
    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    const fromName = this.configService.email.fromName;
    const fromAddress = this.configService.email.from;

    try {
      const info = (await this.transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      })) as { messageId?: string };
      this.logger.log(
        `Email sent: ${info.messageId ?? 'unknown'} → ${message.to}`,
      );
    } catch (error) {
      this.logger.error(`Email send failed: ${message.to}`, error);
      throw error;
    }
  }
}
