import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';

interface ServiceHealth {
  database: 'up' | 'down';
  redis: 'up' | 'down';
}

interface HealthResult {
  status: 'ok' | 'degraded';
  timestamp: string;
  services: ServiceHealth;
  uptime: number;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthResult> {
    const [dbUp, redisUp] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const services: ServiceHealth = {
      database: dbUp ? 'up' : 'down',
      redis: redisUp ? 'up' : 'down',
    };

    return {
      status: dbUp && redisUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
      uptime: process.uptime(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (err) {
      this.logger.warn(
        `Database health check failed: ${(err as Error).message}`,
      );
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (err) {
      this.logger.warn(`Redis health check failed: ${(err as Error).message}`);
      return false;
    }
  }
}
