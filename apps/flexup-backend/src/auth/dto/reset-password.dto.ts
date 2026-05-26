import { IsString, Matches, MinLength } from 'class-validator';
import type { ResetPasswordRequest } from '@flexup/shared';

export class ResetPasswordDto implements ResetPasswordRequest {
  @IsString()
  @MinLength(32)
  token!: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Za-z]/, { message: 'newPassword must contain at least one letter' })
  @Matches(/[0-9]/, { message: 'newPassword must contain at least one number' })
  newPassword!: string;
}
