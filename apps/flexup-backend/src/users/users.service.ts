import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { UserRole } from '@flexup/shared';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { PrismaService } from '@/prisma/prisma.service';
import { AppConfigService } from '@/config/config.service';
import { PaginatedResponse } from '@/common/types/paginated.response';
import { UpdateProfileDto } from '@/users/dto/update-profile.dto';
import { ChangePasswordDto } from '@/users/dto/change-password.dto';
import { ChangeEmailDto } from '@/users/dto/change-email.dto';
import { ChangePhoneDto } from '@/users/dto/change-phone.dto';
import { UserListQueryDto } from '@/users/dto/user-list-query.dto';
import { UserPublicResponse } from '@/users/dto/user-public.response';
import { toUserPublic } from '@/users/users.mapper';

export interface CreateUserData {
  email: string;
  phoneNumber?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

const BCRYPT_ROUNDS = 12;
const INVALID_PASSWORD = 'Invalid current password';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  // ─── Batch 1.2 methods (unchanged) ───────────────────────────────────────

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phoneNumber: phone } });
  }

  create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: { ...data, email: data.email.toLowerCase() },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  // ─── Profile ─────────────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<UserPublicResponse> {
    const user = await this.requireUser(userId);
    return toUserPublic(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserPublicResponse> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      },
    });
    return toUserPublic(user);
  }

  // ─── Sensitive changes ────────────────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.requireUser(userId);
    await this.verifyPassword(dto.currentPassword, user.passwordHash);

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
    await this.revokeAllRefreshTokens(userId);
  }

  async changeEmail(
    userId: string,
    dto: ChangeEmailDto,
  ): Promise<UserPublicResponse> {
    const user = await this.requireUser(userId);
    await this.verifyPassword(dto.currentPassword, user.passwordHash);

    const newEmail = dto.newEmail.toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictException('Email already in use');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { email: newEmail, emailVerified: false },
    });
    return toUserPublic(updated);
  }

  async changePhone(
    userId: string,
    dto: ChangePhoneDto,
  ): Promise<UserPublicResponse> {
    const user = await this.requireUser(userId);
    await this.verifyPassword(dto.currentPassword, user.passwordHash);

    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.newPhoneNumber },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictException('Phone number already in use');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { phoneNumber: dto.newPhoneNumber, phoneVerified: false },
    });
    return toUserPublic(updated);
  }

  // ─── Avatar ───────────────────────────────────────────────────────────────

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserPublicResponse> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, WebP allowed',
      );
    }

    const { dir: uploadsDir, baseUrl, maxSizeBytes } = this.config.uploads;

    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File too large. Max size: ${maxSizeBytes} bytes`,
      );
    }

    const avatarsDir = join(uploadsDir, 'avatars');
    if (!existsSync(avatarsDir)) {
      mkdirSync(avatarsDir, { recursive: true });
    }

    const processed = await sharp(file.buffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `${userId}-${Date.now()}.webp`;
    const filePath = join(avatarsDir, filename);
    await writeFile(filePath, processed);

    // Remove old avatar from disk if exists
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });
    if (current?.avatarUrl) {
      this.deleteAvatarFile(current.avatarUrl, baseUrl, uploadsDir);
    }

    const avatarUrl = `${baseUrl}/avatars/${filename}`;
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return toUserPublic(updated);
  }

  async removeAvatar(userId: string): Promise<UserPublicResponse> {
    const user = await this.requireUser(userId);

    if (user.avatarUrl) {
      const { dir: uploadsDir, baseUrl } = this.config.uploads;
      this.deleteAvatarFile(user.avatarUrl, baseUrl, uploadsDir);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
    return toUserPublic(updated);
  }

  // ─── Account lifecycle ────────────────────────────────────────────────────

  async deactivateAccount(userId: string, password: string): Promise<void> {
    const user = await this.requireUser(userId);
    await this.verifyPassword(password, user.passwordHash);

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    await this.revokeAllRefreshTokens(userId);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async listUsers(
    query: UserListQueryDto,
  ): Promise<PaginatedResponse<UserPublicResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.role !== undefined && { role: query.role }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search
        ? {
            OR: [
              {
                email: { contains: query.search, mode: 'insensitive' as const },
              },
              {
                firstName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                lastName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(toUserPublic),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string): Promise<UserPublicResponse> {
    const user = await this.requireUser(id);
    return toUserPublic(user);
  }

  async setUserActive(
    id: string,
    isActive: boolean,
  ): Promise<UserPublicResponse> {
    await this.requireUser(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive },
    });
    return toUserPublic(updated);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async requireUser(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async verifyPassword(plain: string, hash: string): Promise<void> {
    const ok = await bcrypt.compare(plain, hash);
    if (!ok) throw new UnauthorizedException(INVALID_PASSWORD);
  }

  private async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private deleteAvatarFile(
    avatarUrl: string,
    baseUrl: string,
    uploadsDir: string,
  ): void {
    try {
      const relativePath = avatarUrl.replace(baseUrl, '');
      const fullPath = join(uploadsDir, relativePath);
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
      }
    } catch (err) {
      this.logger.warn(
        `Failed to delete avatar file: ${(err as Error).message}`,
      );
    }
  }
}
