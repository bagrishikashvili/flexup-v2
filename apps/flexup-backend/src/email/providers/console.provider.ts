import { Injectable, Logger } from '@nestjs/common';
import type { EmailMessage, EmailProvider } from './email-provider.interface';

@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  send(message: EmailMessage): Promise<void> {
    this.logger.log('=== EMAIL (console mode) ===');
    this.logger.log(`To: ${message.to}`);
    this.logger.log(`Subject: ${message.subject}`);
    this.logger.log(`HTML:\n${message.html}`);
    return Promise.resolve();
  }
}
