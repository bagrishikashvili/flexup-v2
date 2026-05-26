import type { ValidatePasswordResetTokenRequest } from '@flexup/shared';

export class ValidatePasswordResetTokenDto implements ValidatePasswordResetTokenRequest {
  token!: string;
}
