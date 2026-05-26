import type { ResetPasswordRequest } from '@flexup/shared';

export class ResetPasswordDto implements ResetPasswordRequest {
  token!: string;
  newPassword!: string;
}
