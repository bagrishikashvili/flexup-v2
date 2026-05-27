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
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompanyMemberRole } from '@flexup/shared';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { CompanyAccessGuard } from '@/common/guards/company-access.guard';
import { RequireCompanyRole } from '@/common/decorators/require-company-role.decorator';
import { PaginatedResponse } from '@/common/types/paginated.response';
import { JobPostingsService } from '@/job-postings/job-postings.service';
import { CreateJobPostingDto } from '@/job-postings/dto/create-job-posting.dto';
import { UpdateJobPostingDto } from '@/job-postings/dto/update-job-posting.dto';
import { JobPostingListQueryDto } from '@/job-postings/dto/job-posting-list-query.dto';
import { SetArchivedDto } from '@/job-postings/dto/set-archived.dto';
import type {
  JobPostingResponse,
  JobPostingListItemResponse,
} from '@flexup/shared';

interface AuthUser {
  id: string;
}

@ApiTags('job-postings')
@ApiBearerAuth('JWT')
@Controller('companies/:companyId/job-postings')
@UseGuards(CompanyAccessGuard)
export class JobPostingsController {
  constructor(private readonly jobPostingsService: JobPostingsService) {}

  @Post()
  @RequireCompanyRole(CompanyMemberRole.MANAGER)
  create(
    @Param('companyId') companyId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateJobPostingDto,
  ): Promise<JobPostingResponse> {
    return this.jobPostingsService.create(user.id, companyId, dto);
  }

  @Get()
  @RequireCompanyRole(CompanyMemberRole.VIEWER)
  list(
    @Param('companyId') companyId: string,
    @Query() query: JobPostingListQueryDto,
  ): Promise<PaginatedResponse<JobPostingListItemResponse>> {
    return this.jobPostingsService.findByCompany(companyId, query);
  }

  @Get(':id')
  @RequireCompanyRole(CompanyMemberRole.VIEWER)
  findOne(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<JobPostingResponse> {
    return this.jobPostingsService.findById(companyId, id);
  }

  @Patch(':id')
  @RequireCompanyRole(CompanyMemberRole.MANAGER)
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJobPostingDto,
  ): Promise<JobPostingResponse> {
    return this.jobPostingsService.update(companyId, id, dto);
  }

  @Patch(':id/archive')
  @RequireCompanyRole(CompanyMemberRole.MANAGER)
  setArchived(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: SetArchivedDto,
  ): Promise<JobPostingResponse> {
    return this.jobPostingsService.setArchived(companyId, id, dto.isArchived);
  }

  @Delete(':id')
  @RequireCompanyRole(CompanyMemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.jobPostingsService.delete(companyId, id);
  }

  @Post(':id/cover-photo')
  @RequireCompanyRole(CompanyMemberRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  uploadCoverPhoto(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<JobPostingResponse> {
    return this.jobPostingsService.uploadCoverPhoto(companyId, id, file);
  }

  @Delete(':id/cover-photo')
  @RequireCompanyRole(CompanyMemberRole.MANAGER)
  removeCoverPhoto(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<JobPostingResponse> {
    return this.jobPostingsService.removeCoverPhoto(companyId, id);
  }
}
