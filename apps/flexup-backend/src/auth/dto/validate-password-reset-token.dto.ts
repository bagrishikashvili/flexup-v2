import { IsString, MinLength } from 'class-validator';
import type { ValidatePasswordResetTokenRequest } from '@flexup/shared';

export class ValidatePasswordResetTokenDto implements ValidatePasswordResetTokenRequest {
  @IsString()
  @MinLength(32)
  token!: string;
}
