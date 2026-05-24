import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { User } from '@prisma/client';
import {
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
import { RefreshDto } from '@/auth/dto/refresh.dto';
import {
  AuthTokensResponse,
  UserPublic,
} from '@/auth/types/auth-tokens.response';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @Throttle({ short: { ttl: 60_000, limit: 3 } })
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerSchema))
  register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ): Promise<AuthTokensResponse> {
    return this.authService.register(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @ApiOperation({ summary: 'Log in with email + password' })
  @Throttle({ short: { ttl: 60_000, limit: 5 } })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthTokensResponse> {
    return this.authService.login(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @ApiOperation({
    summary: 'Rotate refresh token, return new access + refresh',
  })
  @Throttle({ short: { ttl: 60_000, limit: 10 } })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refreshSchema))
  refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
  ): Promise<AuthTokensResponse> {
    return this.authService.refresh(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Revoke a single refresh token' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Body() dto: RefreshDto,
  ): Promise<void> {
    await this.authService.logout(user.id, dto.refreshToken);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Revoke all refresh tokens for the current user' })
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    await this.authService.logoutAllSessions(user.id);
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
