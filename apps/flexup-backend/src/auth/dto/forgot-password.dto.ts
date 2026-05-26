import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import type { ForgotPasswordRequest } from '@flexup/shared';

export class ForgotPasswordDto implements ForgotPasswordRequest {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(['ka', 'en'])
  language?: 'ka' | 'en';
}
