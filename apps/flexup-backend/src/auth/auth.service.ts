import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersService } from '@/users/users.service';
import { AppConfigService } from '@/config/config.service';
import { RegisterDto } from '@/auth/dto/register.dto';
import { LoginDto } from '@/auth/dto/login.dto';
import { RefreshDto } from '@/auth/dto/refresh.dto';
import { JwtPayload } from '@/auth/types/jwt-payload.interface';
import {
  AuthTokensResponse,
  UserPublic,
} from '@/auth/types/auth-tokens.response';

export interface RequestMeta {
  userAgent: string | undefined;
  ipAddress: string | undefined;
}

const BCRYPT_ROUNDS = 12;
const INVALID_CREDENTIALS = 'Invalid credentials';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async register(
    dto: RegisterDto,
    meta: RequestMeta,
  ): Promise<AuthTokensResponse> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    if (dto.phoneNumber) {
      const existingPhone = await this.usersService.findByPhone(
        dto.phoneNumber,
      );
      if (existingPhone) {
        throw new ConflictException('Phone number already in use');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
    });

    await this.usersService.updateLastLogin(user.id);

    return this.issueTokenPair(user, meta);
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<AuthTokensResponse> {
    const user = await this.usersService.findByEmail(dto.email);

    // Constant-time compare to prevent timing attacks — always run bcrypt even if user not found
    const dummyHash = '$2b$12$invalidhashplaceholderfortimingXXXXXXXXXXXXXXXXX';
    const passwordToCheck = user ? user.passwordHash : dummyHash;
    const isMatch = await bcrypt.compare(dto.password, passwordToCheck);

    if (!user || !isMatch || !user.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.usersService.updateLastLogin(user.id);
    return this.issueTokenPair(user, meta);
  }

  async refresh(
    dto: RefreshDto,
    meta: RequestMeta,
  ): Promise<AuthTokensResponse> {
    const tokenHash = this.hashToken(dto.refreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // Reuse attack — token was already revoked, revoke ALL sessions
    if (stored.revokedAt !== null) {
      this.logger.warn(
        `Refresh token reuse detected for userId=${stored.userId}`,
      );
      await this.revokeAllUserTokens(stored.userId);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // Revoke used token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(stored.user, meta);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await this.revokeAllUserTokens(userId);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  private async issueTokenPair(
    user: User,
    meta: RequestMeta,
  ): Promise<AuthTokensResponse> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const rawRefresh = randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefresh);
    const ttlSeconds = this.config.jwt.refreshTtlSeconds;

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    const userPublic: UserPublic = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    return { accessToken, refreshToken: rawRefresh, user: userPublic };
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
