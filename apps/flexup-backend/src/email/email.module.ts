import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmtpEmailProvider } from './providers/smtp.provider';
import { ConsoleEmailProvider } from './providers/console.provider';

@Global()
@Module({
  providers: [EmailService, SmtpEmailProvider, ConsoleEmailProvider],
  exports: [EmailService],
})
export class EmailModule {}
