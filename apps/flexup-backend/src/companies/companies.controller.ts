import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompanyMemberRole, UserRole } from '@flexup/shared';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CompanyAccessGuard } from '@/common/guards/company-access.guard';
import { RequireCompanyRole } from '@/common/decorators/require-company-role.decorator';
import { PaginatedResponse } from '@/common/types/paginated.response';
import { CompaniesService } from '@/companies/companies.service';
import { CreateCompanyDto } from '@/companies/dto/create-company.dto';
import { UpdateCompanyDto } from '@/companies/dto/update-company.dto';
import { CompanyListQueryDto } from '@/companies/dto/company-list-query.dto';
import { CompanyPublicResponse } from '@/companies/dto/company-public.response';
import { CompanyDetailResponse } from '@/companies/dto/company-detail.response';
import { SetUserActiveDto } from '@/users/dto/set-user-active.dto';

interface AuthUser {
  id: string;
  role: UserRole;
}

@ApiTags('companies')
@ApiBearerAuth('JWT')
@Controller()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // ─── My companies ────────────────────────────────────────────────────────

  @Post('companies')
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCompanyDto,
  ): Promise<CompanyDetailResponse> {
    if (user.role === UserRole.WORKER) {
      throw new BadRequestException(
        'WORKER role users cannot create companies',
      );
    }
    return this.companiesService.create(user.id, dto);
  }

  @Get('companies/mine')
  listMine(@CurrentUser() user: AuthUser): Promise<CompanyPublicResponse[]> {
    return this.companiesService.findUserCompanies(user.id);
  }

  @Get('companies/:companyId')
  @UseGuards(CompanyAccessGuard)
  @RequireCompanyRole(CompanyMemberRole.VIEWER)
  findOne(
    @Param('companyId') companyId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<CompanyDetailResponse> {
    return this.companiesService.findById(companyId, user.id);
  }

  @Patch('companies/:companyId')
  @UseGuards(CompanyAccessGuard)
  @RequireCompanyRole(CompanyMemberRole.MANAGER)
  update(
    @Param('companyId') companyId: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<CompanyDetailResponse> {
    return this.companiesService.update(companyId, dto);
  }

  @Post('companies/:companyId/logo')
  @UseGuards(CompanyAccessGuard)
  @RequireCompanyRole(CompanyMemberRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @Param('companyId') companyId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CompanyDetailResponse> {
    return this.companiesService.uploadLogo(companyId, file);
  }

  @Delete('companies/:companyId/logo')
  @UseGuards(CompanyAccessGuard)
  @RequireCompanyRole(CompanyMemberRole.MANAGER)
  removeLogo(
    @Param('companyId') companyId: string,
  ): Promise<CompanyDetailResponse> {
    return this.companiesService.removeLogo(companyId);
  }

  @Delete('companies/:companyId')
  @UseGuards(CompanyAccessGuard)
  @RequireCompanyRole(CompanyMemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('companyId') companyId: string): Promise<void> {
    await this.companiesService.deactivate(companyId);
  }

  // ─── Admin ───────────────────────────────────────────────────────────────

  @Get('admin/companies')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  listAll(
    @Query() query: CompanyListQueryDto,
  ): Promise<PaginatedResponse<CompanyDetailResponse>> {
    return this.companiesService.listAll(query);
  }

  @Post('admin/companies/:companyId/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  verify(
    @Param('companyId') companyId: string,
  ): Promise<CompanyDetailResponse> {
    return this.companiesService.verifyCompany(companyId);
  }

  @Patch('admin/companies/:companyId/active')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  setActive(
    @Param('companyId') companyId: string,
    @Body() dto: SetUserActiveDto,
  ): Promise<CompanyDetailResponse> {
    return this.companiesService.setActive(companyId, dto.isActive);
  }
}
