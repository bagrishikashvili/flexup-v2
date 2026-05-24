import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@flexup/shared';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { UsersService } from '@/users/users.service';
import { UpdateProfileDto } from '@/users/dto/update-profile.dto';
import { ChangePasswordDto } from '@/users/dto/change-password.dto';
import { ChangeEmailDto } from '@/users/dto/change-email.dto';
import { ChangePhoneDto } from '@/users/dto/change-phone.dto';
import { DeactivateAccountDto } from '@/users/dto/deactivate-account.dto';
import { SetUserActiveDto } from '@/users/dto/set-user-active.dto';
import { UserListQueryDto } from '@/users/dto/user-list-query.dto';
import { UserPublicResponse } from '@/users/dto/user-public.response';
import { PaginatedResponse } from '@/common/types/paginated.response';

interface AuthUser {
  id: string;
}

@ApiTags('users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── My profile ───────────────────────────────────────────────────────────

  @Get('me')
  getMe(@CurrentUser() user: AuthUser): Promise<UserPublicResponse> {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserPublicResponse> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserPublicResponse> {
    return this.usersService.uploadAvatar(user.id, file);
  }

  @Delete('me/avatar')
  removeAvatar(@CurrentUser() user: AuthUser): Promise<UserPublicResponse> {
    return this.usersService.removeAvatar(user.id);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.usersService.changePassword(user.id, dto);
  }

  @Post('me/change-email')
  changeEmail(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangeEmailDto,
  ): Promise<UserPublicResponse> {
    return this.usersService.changeEmail(user.id, dto);
  }

  @Post('me/change-phone')
  changePhone(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePhoneDto,
  ): Promise<UserPublicResponse> {
    return this.usersService.changePhone(user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivateAccount(
    @CurrentUser() user: AuthUser,
    @Body() dto: DeactivateAccountDto,
  ): Promise<void> {
    await this.usersService.deactivateAccount(user.id, dto.password);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  listUsers(
    @Query() query: UserListQueryDto,
  ): Promise<PaginatedResponse<UserPublicResponse>> {
    return this.usersService.listUsers(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getUserById(@Param('id') id: string): Promise<UserPublicResponse> {
    return this.usersService.getUserById(id);
  }

  @Patch(':id/active')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  setUserActive(
    @Param('id') id: string,
    @Body() dto: SetUserActiveDto,
  ): Promise<UserPublicResponse> {
    return this.usersService.setUserActive(id, dto.isActive);
  }
}
