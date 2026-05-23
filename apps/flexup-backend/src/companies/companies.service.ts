import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Company, CompanyMemberRole, Prisma, UserRole } from '@prisma/client';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { PrismaService } from '@/prisma/prisma.service';
import { AppConfigService } from '@/config/config.service';
import { PaginatedResponse } from '@/common/types/paginated.response';
import { CreateCompanyDto } from '@/companies/dto/create-company.dto';
import { UpdateCompanyDto } from '@/companies/dto/update-company.dto';
import { CompanyListQueryDto } from '@/companies/dto/company-list-query.dto';
import { CompanyPublicResponse } from '@/companies/dto/company-public.response';
import { CompanyDetailResponse } from '@/companies/dto/company-detail.response';
import { toCompanyDetail, toCompanyPublic } from '@/companies/companies.mapper';

const ALLOWED_LOGO_MIME = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  async create(
    userId: string,
    dto: CreateCompanyDto,
  ): Promise<CompanyDetailResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === UserRole.WORKER) {
      throw new BadRequestException(
        'WORKER role users cannot create companies',
      );
    }

    const company = await this.prisma.$transaction(async (tx) => {
      const created = await tx.company.create({
        data: {
          name: dto.name,
          legalName: dto.legalName,
          registrationNumber: dto.registrationNumber,
          vatNumber: dto.vatNumber,
          websiteUrl: dto.websiteUrl,
          defaultCurrency: dto.defaultCurrency ?? 'GEL',
        },
      });
      await tx.companyMember.create({
        data: {
          companyId: created.id,
          userId,
          role: CompanyMemberRole.OWNER,
        },
      });
      return created;
    });

    return toCompanyDetail(company, 1, CompanyMemberRole.OWNER);
  }

  // ─── Find ────────────────────────────────────────────────────────────────

  async findUserCompanies(userId: string): Promise<CompanyPublicResponse[]> {
    const memberships = await this.prisma.companyMember.findMany({
      where: { userId },
      include: { company: true },
      orderBy: { company: { updatedAt: 'desc' } },
    });
    return memberships.map((m) => toCompanyPublic(m.company, m.role));
  }

  async findById(
    companyId: string,
    userId: string,
  ): Promise<CompanyDetailResponse> {
    const company = await this.requireCompany(companyId);
    const [memberCount, membership] = await Promise.all([
      this.prisma.companyMember.count({ where: { companyId } }),
      this.prisma.companyMember.findUnique({
        where: { userId_companyId: { userId, companyId } },
      }),
    ]);
    return toCompanyDetail(company, memberCount, membership?.role);
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  async update(
    companyId: string,
    dto: UpdateCompanyDto,
  ): Promise<CompanyDetailResponse> {
    await this.requireCompany(companyId);
    const data: Prisma.CompanyUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.legalName !== undefined && { legalName: dto.legalName }),
      ...(dto.registrationNumber !== undefined && {
        registrationNumber: dto.registrationNumber,
      }),
      ...(dto.vatNumber !== undefined && { vatNumber: dto.vatNumber }),
      ...(dto.websiteUrl !== undefined && { websiteUrl: dto.websiteUrl }),
      ...(dto.defaultCurrency !== undefined && {
        defaultCurrency: dto.defaultCurrency,
      }),
    };
    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data,
    });
    const memberCount = await this.prisma.companyMember.count({
      where: { companyId },
    });
    return toCompanyDetail(updated, memberCount);
  }

  async deactivate(companyId: string): Promise<void> {
    await this.requireCompany(companyId);
    await this.prisma.company.update({
      where: { id: companyId },
      data: { isActive: false },
    });
  }

  // ─── Logo ────────────────────────────────────────────────────────────────

  async uploadLogo(
    companyId: string,
    file: Express.Multer.File,
  ): Promise<CompanyDetailResponse> {
    if (!file) {
      throw new BadRequestException('File required');
    }
    if (!ALLOWED_LOGO_MIME.includes(file.mimetype)) {
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

    await this.requireCompany(companyId);

    const logosDir = join(uploadsDir, 'company-logos');
    if (!existsSync(logosDir)) {
      mkdirSync(logosDir, { recursive: true });
    }

    const processed = await sharp(file.buffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `${companyId}-${Date.now()}.webp`;
    const filePath = join(logosDir, filename);
    await writeFile(filePath, processed);

    const current = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { logoUrl: true },
    });
    if (current?.logoUrl) {
      this.deleteLogoFile(current.logoUrl, baseUrl, uploadsDir);
    }

    const logoUrl = `${baseUrl}/company-logos/${filename}`;
    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: { logoUrl },
    });
    const memberCount = await this.prisma.companyMember.count({
      where: { companyId },
    });
    return toCompanyDetail(updated, memberCount);
  }

  async removeLogo(companyId: string): Promise<CompanyDetailResponse> {
    const company = await this.requireCompany(companyId);
    if (company.logoUrl) {
      const { dir: uploadsDir, baseUrl } = this.config.uploads;
      this.deleteLogoFile(company.logoUrl, baseUrl, uploadsDir);
    }
    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: { logoUrl: null },
    });
    const memberCount = await this.prisma.companyMember.count({
      where: { companyId },
    });
    return toCompanyDetail(updated, memberCount);
  }

  // ─── Admin ───────────────────────────────────────────────────────────────

  async listAll(
    query: CompanyListQueryDto,
  ): Promise<PaginatedResponse<CompanyDetailResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyWhereInput = {
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.isVerified !== undefined && { isVerified: query.isVerified }),
      ...(query.search && {
        name: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const [companies, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { members: true } } },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data: companies.map((c) => toCompanyDetail(c, c._count.members)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async verifyCompany(companyId: string): Promise<CompanyDetailResponse> {
    await this.requireCompany(companyId);
    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: { isVerified: true, verifiedAt: new Date() },
    });
    const memberCount = await this.prisma.companyMember.count({
      where: { companyId },
    });
    return toCompanyDetail(updated, memberCount);
  }

  async setActive(
    companyId: string,
    isActive: boolean,
  ): Promise<CompanyDetailResponse> {
    await this.requireCompany(companyId);
    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: { isActive },
    });
    const memberCount = await this.prisma.companyMember.count({
      where: { companyId },
    });
    return toCompanyDetail(updated, memberCount);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async requireCompany(companyId: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  private deleteLogoFile(
    logoUrl: string,
    baseUrl: string,
    uploadsDir: string,
  ): void {
    try {
      const relativePath = logoUrl.replace(baseUrl, '');
      const fullPath = join(uploadsDir, relativePath);
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
      }
    } catch (err) {
      this.logger.warn(`Failed to delete logo file: ${(err as Error).message}`);
    }
  }
}
