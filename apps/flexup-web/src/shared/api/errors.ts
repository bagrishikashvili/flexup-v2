import { ApiError } from './client';

export function getErrorCode(error: unknown): string {
  if (error instanceof ApiError) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}
