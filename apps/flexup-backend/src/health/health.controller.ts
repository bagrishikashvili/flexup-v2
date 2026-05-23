import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import { HealthService } from '@/health/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async check(@Res() res: Response): Promise<void> {
    const result = await this.healthService.check();
    const statusCode =
      result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    res.status(statusCode).json(result);
  }
}
