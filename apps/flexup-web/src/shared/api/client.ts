import type { ApiErrorResponse } from '@flexup/shared';

const API_BASE = '/api';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly response: ApiErrorResponse,
  ) {
    super(response.message);
    this.name = 'ApiError';
  }

  get code(): string {
    return this.response.code ?? 'UNKNOWN_ERROR';
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth = false, headers = {}, ...rest } = options;

  const init: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    },
    credentials: 'include',
  };

  if (!skipAuth) {
    const { getAccessToken } = await import('@/features/auth/stores/auth.store');
    const token = getAccessToken();
    if (token) {
      (init.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError(0, {
      statusCode: 0,
      error: 'Network Error',
      message: 'Network Error',
      code: 'NETWORK_ERROR',
      timestamp: new Date().toISOString(),
      path,
    });
  }

  if (!response.ok) {
    let errorBody: ApiErrorResponse;
    try {
      errorBody = (await response.json()) as ApiErrorResponse;
    } catch {
      errorBody = {
        statusCode: response.status,
        error: response.statusText,
        message: 'Request failed',
        code: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
        path,
      };
    }
    throw new ApiError(response.status, errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
