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
}
