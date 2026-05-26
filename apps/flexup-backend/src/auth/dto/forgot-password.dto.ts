import type { ForgotPasswordRequest } from '@flexup/shared';

export class ForgotPasswordDto implements ForgotPasswordRequest {
  email!: string;
  language?: 'ka' | 'en';
}
