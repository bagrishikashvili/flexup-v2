import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { ErrorCode } from '@flexup/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { EmailService } from '@/email/email.service';
import { AppConfigService } from '@/config/config.service';
import { renderPasswordResetEmail } from '@/email/templates/password-reset-email.template';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly config: AppConfigService,
  ) {}

  async requestPasswordReset(
    rawEmail: string,
    language: 'ka' | 'en' = 'ka',
  ): Promise<void> {
    const email = rawEmail.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return void — never reveal whether email exists
    if (!user || !user.isActive) {
      return;
    }

    const { resendCooldownSeconds, maxPerDay } = this.config.passwordReset;

    // Daily limit check
    const since24h = new Date(Date.now() - 24 * 3600 * 1000);
    const countToday = await this.prisma.passwordResetToken.count({
      where: { userId: user.id, createdAt: { gte: since24h } },
    });
    if (countToday >= maxPerDay) {
      // Silent — do not reveal rate limit state to caller
      this.logger.warn(`Password reset daily limit reached: userId=${user.id}`);
      return;
    }

    // Cooldown check
    const lastToken = await this.prisma.passwordResetToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    if (lastToken) {
      const sinceLastMs = Date.now() - lastToken.createdAt.getTime();
      if (sinceLastMs < resendCooldownSeconds * 1000) {
        this.logger.warn(`Password reset cooldown active: userId=${user.id}`);
        return;
      }
    }

    const rawToken = randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const { ttlMinutes } = this.config.passwordReset;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Invalidate previous unused tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        email: user.email,
        expiresAt,
      },
    });

    const resetUrl = `${this.config.webBaseUrl}/auth/reset-password?token=${rawToken}`;

    const rendered = renderPasswordResetEmail({
      firstName: user.firstName,
      resetUrl,
      expiresInMinutes: ttlMinutes,
      appName: 'flexup',
      language,
    });

    await this.emailService.send({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    // Log only safe metadata — never raw token or full URL
    const emailDomain = user.email.split('@')[1] ?? 'unknown';
    this.logger.log(
      `Password reset email sent: userId=${user.id} domain=@${emailDomain}`,
    );
  }

  async validateResetToken(
    rawToken: string,
  ): Promise<{ valid: boolean; email?: string }> {
    const tokenHash = this.hashToken(rawToken);

    const token = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!token) return { valid: false };
    if (token.usedAt !== null) return { valid: false };
    if (token.expiresAt < new Date()) return { valid: false };
    if (!token.user.isActive) return { valid: false };

    return { valid: true, email: maskEmail(token.email) };
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);

    const token = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!token) {
      throw new UnauthorizedException({
        code: ErrorCode.PASSWORD_RESET_TOKEN_INVALID,
        message: 'Invalid or expired password reset token',
      });
    }

    if (token.usedAt !== null) {
      throw new UnauthorizedException({
        code: ErrorCode.PASSWORD_RESET_TOKEN_USED,
        message: 'This password reset link has already been used',
      });
    }

    if (token.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED,
        message: 'This password reset link has expired',
      });
    }

    if (!token.user.isActive) {
      throw new UnauthorizedException({
        code: ErrorCode.PASSWORD_RESET_TOKEN_INVALID,
        message: 'Invalid or expired password reset token',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const now = new Date();

    await this.prisma.$transaction([
      // Update password
      this.prisma.user.update({
        where: { id: token.userId },
        data: { passwordHash },
      }),
      // Mark this token used
      this.prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: now },
      }),
      // Invalidate all other unused reset tokens for this user
      this.prisma.passwordResetToken.updateMany({
        where: { userId: token.userId, id: { not: token.id }, usedAt: null },
        data: { usedAt: now },
      }),
      // Revoke all refresh tokens — all sessions must be invalidated
      this.prisma.refreshToken.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    this.logger.log(`Password reset successful: userId=${token.userId}`);
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const masked = local[0] + '***';
  return `${masked}@${domain}`;
}
