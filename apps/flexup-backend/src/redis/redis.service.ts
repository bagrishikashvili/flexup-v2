import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { AppConfigService } from '@/config/config.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;
  private reconnectAttempts = 0;
  private readonly maxReconnectDelay = 30000;

  constructor(private readonly config: AppConfigService) {
    this.client = createClient({
      url: this.config.redis.url,
      socket: {
        reconnectStrategy: (retries: number) => {
          this.reconnectAttempts = retries;
          const delay = Math.min(
            100 * Math.pow(2, retries),
            this.maxReconnectDelay,
          );
          this.logger.warn(
            `Redis reconnecting in ${delay}ms (attempt ${retries})`,
          );
          return delay;
        },
      },
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.reconnectAttempts = 0;
      this.logger.log('Redis connected');
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    this.logger.log('Redis disconnected');
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }
}
