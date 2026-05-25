import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@/config/config.service';
import { SmtpEmailProvider } from './providers/smtp.provider';
import { ConsoleEmailProvider } from './providers/console.provider';
import type {
  EmailMessage,
  EmailProvider,
} from './providers/email-provider.interface';

@Injectable()
export class EmailService implements EmailProvider {
  constructor(
    private readonly configService: AppConfigService,
    private readonly smtpProvider: SmtpEmailProvider,
    private readonly consoleProvider: ConsoleEmailProvider,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const provider = this.configService.email.provider;

    switch (provider) {
      case 'smtp':
        return this.smtpProvider.send(message);
      case 'console':
        return this.consoleProvider.send(message);
      default:
        throw new Error(`Unknown email provider: ${String(provider)}`);
    }
  }
}
