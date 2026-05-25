import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: NestConfigService) {}

  get nodeEnv(): string {
    return this.config.getOrThrow<string>('NODE_ENV');
  }

  get port(): number {
    return this.config.getOrThrow<number>('PORT');
  }

  get corsOrigin(): string {
    return this.config.getOrThrow<string>('CORS_ORIGIN');
  }

  /**
   * Parsed list of allowed CORS origins. Preference order:
   * 1. CORS_ORIGINS (comma-separated list of explicit origins)
   * 2. CORS_ORIGIN ("*" for wide-open, or a single origin)
   *
   * Returns `'*'` to allow any origin or a string[] otherwise.
   */
  get corsOrigins(): string | string[] {
    const raw = this.config.get<string>('CORS_ORIGINS')?.trim() ?? '';
    if (raw) {
      const list = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length > 0) {
        return list;
      }
    }
    const single = this.config.get<string>('CORS_ORIGIN')?.trim() ?? '*';
    return single === '*' ? '*' : [single];
  }

  get swaggerEnabled(): boolean {
    if (this.nodeEnv !== 'production') return true;
    return this.config.get<string>('SWAGGER_ENABLED') === 'true';
  }

  get logLevel(): string {
    return this.config.getOrThrow<string>('LOG_LEVEL');
  }

  get database() {
    return {
      url: this.config.getOrThrow<string>('DATABASE_URL'),
    };
  }

  get redis() {
    return {
      url: this.config.getOrThrow<string>('REDIS_URL'),
    };
  }

  get uploads() {
    return {
      dir: this.config.getOrThrow<string>('UPLOADS_DIR'),
      baseUrl: this.config.getOrThrow<string>('UPLOADS_BASE_URL'),
      maxSizeBytes: this.config.getOrThrow<number>('MAX_UPLOAD_SIZE_BYTES'),
    };
  }

  get jwt() {
    return {
      accessSecret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      refreshSecret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      accessTtlSeconds: this.config.getOrThrow<number>(
        'JWT_ACCESS_TTL_SECONDS',
      ),
      refreshTtlSeconds: this.config.getOrThrow<number>(
        'JWT_REFRESH_TTL_SECONDS',
      ),
    };
  }

  get cookies() {
    return {
      domain: this.config.get<string>('COOKIE_DOMAIN') || undefined,
      secure: this.config.get<boolean>('COOKIE_SECURE')!,
      sameSite: this.config.get<'lax' | 'strict' | 'none'>('COOKIE_SAME_SITE')!,
      refreshTokenName: this.config.get<string>('COOKIE_REFRESH_TOKEN_NAME')!,
    };
  }

  get email() {
    return {
      provider: this.config.get<'smtp' | 'console'>('EMAIL_PROVIDER')!,
      smtp: {
        host: this.config.get<string>('SMTP_HOST')!,
        port: this.config.get<number>('SMTP_PORT')!,
        user: this.config.get<string>('SMTP_USER')!,
        pass: this.config.get<string>('SMTP_PASS')!,
        secure: this.config.get<boolean>('SMTP_SECURE')!,
      },
      from: this.config.get<string>('EMAIL_FROM')!,
      fromName: this.config.get<string>('EMAIL_FROM_NAME')!,
    };
  }

  get webBaseUrl(): string {
    return this.config.get<string>('WEB_BASE_URL')!;
  }

  get verification() {
    return {
      ttlHours: this.config.get<number>('EMAIL_VERIFICATION_TTL_HOURS')!,
      resendCooldownSeconds: this.config.get<number>(
        'EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS',
      )!,
      maxPerDay: this.config.get<number>('EMAIL_VERIFICATION_MAX_PER_DAY')!,
    };
  }
}
