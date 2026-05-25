import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class ResendVerificationDto {
  @ApiPropertyOptional({ enum: ['ka', 'en'] })
  @IsOptional()
  @IsEnum(['ka', 'en'])
  language?: 'ka' | 'en';
}
