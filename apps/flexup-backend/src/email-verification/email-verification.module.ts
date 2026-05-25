import { Module } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerificationController } from './email-verification.controller';

@Module({
  providers: [EmailVerificationService],
  exports: [EmailVerificationService],
  controllers: [EmailVerificationController],
})
export class EmailVerificationModule {}
