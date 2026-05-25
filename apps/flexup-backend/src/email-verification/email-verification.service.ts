import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { ErrorCode } from '@flexup/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { EmailService } from '@/email/email.service';
import { AppConfigService } from '@/config/config.service';
import { renderVerificationEmail } from '@/email/templates/verification-email.template';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: AppConfigService,
  ) {}

  async issueAndSend(
    userId: string,
    language: 'ka' | 'en' = 'ka',
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      throw new BadRequestException({
        code: 'EMAIL_ALREADY_VERIFIED',
        message: 'Email already verified',
      });
    }

    await this.checkRateLimits(userId);

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const ttlHours = this.configService.verification.ttlHours;
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        userId,
        email: user.email,
        expiresAt,
      },
    });

    const verifyUrl = `${this.configService.webBaseUrl}/auth/verify-email?token=${rawToken}`;

    const rendered = renderVerificationEmail({
      firstName: user.firstName,
      verifyUrl,
      expiresInHours: ttlHours,
      appName: 'flexup',
      language,
    });

    await this.emailService.send({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    this.logger.log(`Verification email sent to ${user.email}`);
  }

  async verify(rawToken: string): Promise<{ userId: string }> {
    const tokenHash = this.hashToken(rawToken);

    const token = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!token) {
      throw new BadRequestException({
        code: 'VERIFICATION_TOKEN_INVALID',
        message: 'Invalid verification token',
      });
    }

    if (token.usedAt) {
      throw new BadRequestException({
        code: 'VERIFICATION_TOKEN_USED',
        message: 'This verification link has already been used',
      });
    }

    if (token.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'VERIFICATION_TOKEN_EXPIRED',
        message: 'This verification link has expired',
      });
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: token.userId },
        data: { emailVerified: true },
      }),
    ]);

    this.logger.log(`Email verified: userId=${token.userId}`);
    return { userId: token.userId };
  }

  private async checkRateLimits(userId: string): Promise<void> {
    const cooldownSec = this.configService.verification.resendCooldownSeconds;
    const maxPerDay = this.configService.verification.maxPerDay;

    const lastToken = await this.prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastToken) {
      const sinceLastMs = Date.now() - lastToken.createdAt.getTime();
      if (sinceLastMs < cooldownSec * 1000) {
        const secondsLeft = Math.ceil(
          (cooldownSec * 1000 - sinceLastMs) / 1000,
        );
        throw new BadRequestException({
          code: 'VERIFICATION_RESEND_COOLDOWN',
          message: `Please wait ${secondsLeft}s before resending`,
        });
      }
    }

    const since24h = new Date(Date.now() - 24 * 3600 * 1000);
    const count = await this.prisma.emailVerificationToken.count({
      where: { userId, createdAt: { gte: since24h } },
    });

    if (count >= maxPerDay) {
      throw new BadRequestException({
        code: 'VERIFICATION_DAILY_LIMIT',
        message: 'Daily verification email limit reached',
      });
    }
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
