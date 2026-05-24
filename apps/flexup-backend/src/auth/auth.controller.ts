import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { User } from '@prisma/client';
import {
  ErrorCode,
  UserRole,
  loginSchema,
  refreshSchema,
  registerSchema,
} from '@flexup/shared';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { AuthService } from '@/auth/auth.service';
import { RegisterDto } from '@/auth/dto/register.dto';
import { LoginDto } from '@/auth/dto/login.dto';
import {
  AuthResponseWithoutRefresh,
  UserPublic,
} from '@/auth/types/auth-tokens.response';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AppConfigService } from '@/config/config.service';
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
  setRefreshTokenCookie,
} from '@/common/utils/auth-cookies.utils';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: AppConfigService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @Throttle({ short: { ttl: 60_000, limit: 3 } })
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseWithoutRefresh> {
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
    const result = await this.authService.register(dto, meta);

    setRefreshTokenCookie(
      res,
      result.refreshToken,
      this.configService.jwt.refreshTtlSeconds,
      this.configService.cookies,
    );

    const { refreshToken: _, ...response } = result;
    return response;
  }

  @ApiOperation({ summary: 'Log in with email + password' })
  @Throttle({ short: { ttl: 60_000, limit: 5 } })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseWithoutRefresh> {
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
    const result = await this.authService.login(dto, meta);

    setRefreshTokenCookie(
      res,
      result.refreshToken,
      this.configService.jwt.refreshTtlSeconds,
      this.configService.cookies,
    );

    const { refreshToken: _, ...response } = result;
    return response;
  }

  @ApiCookieAuth('flexup_refresh')
  @ApiOperation({
    summary: 'Rotate refresh token, return new access token',
    description:
      'Reads refresh token from HttpOnly cookie. Returns new access token and rotates the cookie.',
  })
  @Throttle({ short: { ttl: 60_000, limit: 10 } })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refreshSchema))
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseWithoutRefresh> {
    const refreshToken = getRefreshTokenFromCookie(
      req,
      this.configService.cookies,
    );

    if (!refreshToken) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Refresh token missing',
      });
    }

    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
    const result = await this.authService.refresh(refreshToken, meta);

    setRefreshTokenCookie(
      res,
      result.refreshToken,
      this.configService.jwt.refreshTtlSeconds,
      this.configService.cookies,
    );

    const { refreshToken: _, ...response } = result;
    return response;
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Revoke current session refresh token' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = getRefreshTokenFromCookie(
      req,
      this.configService.cookies,
    );

    if (refreshToken) {
      await this.authService.logout(user.id, refreshToken);
    }

    clearRefreshTokenCookie(res, this.configService.cookies);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Revoke all refresh tokens for the current user' })
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logoutAllSessions(user.id);
    clearRefreshTokenCookie(res, this.configService.cookies);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Return the currently authenticated user' })
  @Get('me')
  me(@CurrentUser() user: Omit<User, 'passwordHash'>): UserPublic {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
    };
  }
}
