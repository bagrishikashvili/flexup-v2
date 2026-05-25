import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { User } from '@prisma/client';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { EmailVerificationService } from './email-verification.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@ApiTags('auth')
@Controller('auth')
export class EmailVerificationController {
  constructor(private readonly service: EmailVerificationService) {}

  @Public()
  @Throttle({ short: { ttl: 60_000, limit: 10 } })
  @Post('verify-email')
  @HttpCode(200)
  async verify(@Body() dto: VerifyEmailDto): Promise<{ success: true }> {
    await this.service.verify(dto.token);
    return { success: true };
  }

  @Throttle({ short: { ttl: 60_000, limit: 3 } })
  @Post('resend-verification')
  @HttpCode(204)
  async resend(
    @CurrentUser() user: User,
    @Body() dto: ResendVerificationDto,
  ): Promise<void> {
    await this.service.issueAndSend(user.id, dto.language ?? 'ka');
  }
}
