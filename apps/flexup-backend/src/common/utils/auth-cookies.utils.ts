import type { CookieOptions, Request, Response } from 'express';

export interface AuthCookieConfig {
  domain?: string;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  refreshTokenName: string;
}

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
  ttlSeconds: number,
  config: AuthCookieConfig,
): void {
  const options: CookieOptions = {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    maxAge: ttlSeconds * 1000,
    path: '/api/auth',
    ...(config.domain ? { domain: config.domain } : {}),
  };

  res.cookie(config.refreshTokenName, refreshToken, options);
}

export function clearRefreshTokenCookie(
  res: Response,
  config: AuthCookieConfig,
): void {
  res.clearCookie(config.refreshTokenName, {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    path: '/api/auth',
    ...(config.domain ? { domain: config.domain } : {}),
  });
}

export function getRefreshTokenFromCookie(
  req: Request,
  config: AuthCookieConfig,
): string | null {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const token = cookies?.[config.refreshTokenName];
  return typeof token === 'string' ? token : null;
}
