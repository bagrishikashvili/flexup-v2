import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import {
  ErrorCode,
  JobPostingResponse,
  JobPostingListItemResponse,
} from '@flexup/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { AppConfigService } from '@/config/config.service';
import { ReferenceDataService } from '@/reference-data/reference-data.service';
import { PaginatedResponse } from '@/common/types/paginated.response';
import { CreateJobPostingDto } from '@/job-postings/dto/create-job-posting.dto';
import { UpdateJobPostingDto } from '@/job-postings/dto/update-job-posting.dto';
import { JobPostingListQueryDto } from '@/job-postings/dto/job-posting-list-query.dto';
import {
  toJobPostingResponse,
  toJobPostingListItem,
  jobPostingFullInclude,
} from '@/job-postings/job-postings.mapper';

const ALLOWED_COVER_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class JobPostingsService {
  private readonly logger = new Logger(JobPostingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceData: ReferenceDataService,
    private readonly config: AppConfigService,
  ) {}

  async create(
    userId: string,
    companyId: string,
    dto: CreateJobPostingDto,
  ): Promise<JobPostingResponse> {
    await this.referenceData.validateCategoryId(dto.categoryId);
    await this.referenceData.validateSkillIds(dto.skillIds ?? []);
    await this.referenceData.validateAppearanceIds(dto.appearanceIds ?? []);
    await this.referenceData.validateLanguageIds(dto.languageIds ?? []);

    if ((dto.latitude !== undefined) !== (dto.longitude !== undefined)) {
      throw new BadRequestException({
        code: ErrorCode.COORDINATES_MUST_BE_PAIRED,
        message: 'latitude and longitude must be provided together',
      });
    }

    const job = await this.prisma.jobPosting.create({
      data: {
        companyId,
        categoryId: dto.categoryId,
        createdById: userId,
        title: dto.title,
        briefing: dto.briefing,
        addressLine: dto.addressLine,
        city: dto.city,
        country: dto.country ?? 'GE',
        postalCode: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactPersonName: dto.contactPersonName,
        contactPersonPhone: dto.contactPersonPhone,
        skills: {
          create: (dto.skillIds ?? []).map((skillId) => ({ skillId })),
        },
        appearances: {
          create: (dto.appearanceIds ?? []).map((appearanceId) => ({
            appearanceId,
          })),
        },
        languages: {
          create: (dto.languageIds ?? []).map((languageId) => ({ languageId })),
        },
      },
      include: jobPostingFullInclude,
    });

    return toJobPostingResponse(job);
  }

  async findByCompany(
    companyId: string,
    query: JobPostingListQueryDto,
  ): Promise<PaginatedResponse<JobPostingListItemResponse>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.JobPostingWhereInput = {
      companyId,
      ...(query.isArchived !== undefined
        ? { isArchived: query.isArchived }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.city
        ? { city: { contains: query.city, mode: 'insensitive' } }
        : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return {
      data: items.map(toJobPostingListItem),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(companyId: string, id: string): Promise<JobPostingResponse> {
    const job = await this.prisma.jobPosting.findFirst({
      where: { id, companyId },
      include: jobPostingFullInclude,
    });
    if (!job) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Job posting not found',
      });
    }
    return toJobPostingResponse(job);
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateJobPostingDto,
  ): Promise<JobPostingResponse> {
    await this.findById(companyId, id);

    if (dto.categoryId) {
      await this.referenceData.validateCategoryId(dto.categoryId);
    }
    if (dto.skillIds) await this.referenceData.validateSkillIds(dto.skillIds);
    if (dto.appearanceIds)
      await this.referenceData.validateAppearanceIds(dto.appearanceIds);
    if (dto.languageIds)
      await this.referenceData.validateLanguageIds(dto.languageIds);

    if (
      dto.latitude !== undefined &&
      dto.longitude !== undefined &&
      (dto.latitude === undefined) !== (dto.longitude === undefined)
    ) {
      throw new BadRequestException({
        code: ErrorCode.COORDINATES_MUST_BE_PAIRED,
        message: 'latitude and longitude must be provided together',
      });
    }

    const job = await this.prisma.$transaction(async (tx) => {
      await tx.jobPosting.update({
        where: { id },
        data: {
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.briefing !== undefined && { briefing: dto.briefing }),
          ...(dto.addressLine !== undefined && {
            addressLine: dto.addressLine,
          }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.country !== undefined && { country: dto.country }),
          ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
          ...(dto.latitude !== undefined && { latitude: dto.latitude }),
          ...(dto.longitude !== undefined && { longitude: dto.longitude }),
          ...(dto.contactPersonName !== undefined && {
            contactPersonName: dto.contactPersonName,
          }),
          ...(dto.contactPersonPhone !== undefined && {
            contactPersonPhone: dto.contactPersonPhone,
          }),
        },
      });

      if (dto.skillIds !== undefined) {
        await tx.jobPostingSkill.deleteMany({ where: { jobPostingId: id } });
        if (dto.skillIds.length > 0) {
          await tx.jobPostingSkill.createMany({
            data: dto.skillIds.map((skillId) => ({
              jobPostingId: id,
              skillId,
            })),
          });
        }
      }

      if (dto.appearanceIds !== undefined) {
        await tx.jobPostingAppearance.deleteMany({
          where: { jobPostingId: id },
        });
        if (dto.appearanceIds.length > 0) {
          await tx.jobPostingAppearance.createMany({
            data: dto.appearanceIds.map((appearanceId) => ({
              jobPostingId: id,
              appearanceId,
            })),
          });
        }
      }

      if (dto.languageIds !== undefined) {
        await tx.jobPostingLanguage.deleteMany({ where: { jobPostingId: id } });
        if (dto.languageIds.length > 0) {
          await tx.jobPostingLanguage.createMany({
            data: dto.languageIds.map((languageId) => ({
              jobPostingId: id,
              languageId,
            })),
          });
        }
      }

      return tx.jobPosting.findUniqueOrThrow({
        where: { id },
        include: jobPostingFullInclude,
      });
    });

    return toJobPostingResponse(job);
  }

  async setArchived(
    companyId: string,
    id: string,
    isArchived: boolean,
  ): Promise<JobPostingResponse> {
    await this.findById(companyId, id);
    const job = await this.prisma.jobPosting.update({
      where: { id },
      data: {
        isArchived,
        archivedAt: isArchived ? new Date() : null,
      },
      include: jobPostingFullInclude,
    });
    return toJobPostingResponse(job);
  }

  async delete(companyId: string, id: string): Promise<void> {
    await this.findById(companyId, id);
    await this.prisma.jobPosting.delete({ where: { id } });
  }

  async uploadCoverPhoto(
    companyId: string,
    id: string,
    file: Express.Multer.File,
  ): Promise<JobPostingResponse> {
    if (!file) {
      throw new BadRequestException('File required');
    }
    if (!ALLOWED_COVER_MIME.includes(file.mimetype)) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_FILE_TYPE,
        message: 'Invalid file type. Only JPEG, PNG, WebP allowed',
      });
    }
    if (file.size > MAX_COVER_SIZE_BYTES) {
      throw new BadRequestException({
        code: ErrorCode.FILE_TOO_LARGE,
        message: 'File too large. Max size: 5MB',
      });
    }

    await this.findById(companyId, id);

    const { dir: uploadsDir, baseUrl } = this.config.uploads;
    const coversDir = join(uploadsDir, 'job-covers');
    if (!existsSync(coversDir)) {
      mkdirSync(coversDir, { recursive: true });
    }

    const processed = await sharp(file.buffer)
      .resize(1280, 720, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `${id}-${Date.now()}.webp`;
    const filePath = join(coversDir, filename);
    await writeFile(filePath, processed);

    const current = await this.prisma.jobPosting.findUnique({
      where: { id },
      select: { coverPhotoUrl: true },
    });
    if (current?.coverPhotoUrl) {
      this.deleteCoverFile(current.coverPhotoUrl, baseUrl, uploadsDir);
    }

    const coverPhotoUrl = `${baseUrl}/job-covers/${filename}`;
    const job = await this.prisma.jobPosting.update({
      where: { id },
      data: { coverPhotoUrl },
      include: jobPostingFullInclude,
    });

    return toJobPostingResponse(job);
  }

  async removeCoverPhoto(
    companyId: string,
    id: string,
  ): Promise<JobPostingResponse> {
    const existing = await this.findById(companyId, id);
    if (existing.coverPhotoUrl) {
      const { dir: uploadsDir, baseUrl } = this.config.uploads;
      this.deleteCoverFile(existing.coverPhotoUrl, baseUrl, uploadsDir);
    }
    const job = await this.prisma.jobPosting.update({
      where: { id },
      data: { coverPhotoUrl: null },
      include: jobPostingFullInclude,
    });
    return toJobPostingResponse(job);
  }

  private deleteCoverFile(
    coverUrl: string,
    baseUrl: string,
    uploadsDir: string,
  ): void {
    try {
      const relativePath = coverUrl.replace(baseUrl, '');
      const fullPath = join(uploadsDir, relativePath);
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
      }
    } catch (err) {
      this.logger.warn(
        `Failed to delete cover file: ${(err as Error).message}`,
      );
    }
  }
}
