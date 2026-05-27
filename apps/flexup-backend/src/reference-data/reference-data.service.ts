import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from '@flexup/shared';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ReferenceDataService {
  private readonly logger = new Logger(ReferenceDataService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSections() {
    return this.prisma.jobSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getCategories(sectionId?: string) {
    return this.prisma.jobCategory.findMany({
      where: {
        isActive: true,
        ...(sectionId ? { sectionId } : {}),
      },
      include: { section: true },
      orderBy: [{ section: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
  }

  async getCategoryById(id: string) {
    return this.prisma.jobCategory.findUnique({
      where: { id },
      include: { section: true },
    });
  }

  async getSkills() {
    return this.prisma.skill.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getAppearances() {
    return this.prisma.appearance.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getLanguages() {
    return this.prisma.language.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async validateCategoryId(id: string): Promise<void> {
    const cat = await this.getCategoryById(id);
    if (!cat?.isActive) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_CATEGORY,
        message: 'Category not found or inactive',
      });
    }
  }

  async validateSkillIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const count = await this.prisma.skill.count({
      where: { id: { in: ids }, isActive: true },
    });
    if (count !== ids.length) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_SKILL,
        message: 'One or more skills are invalid',
      });
    }
  }

  async validateAppearanceIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const count = await this.prisma.appearance.count({
      where: { id: { in: ids }, isActive: true },
    });
    if (count !== ids.length) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_APPEARANCE,
        message: 'One or more appearances are invalid',
      });
    }
  }

  async validateLanguageIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const count = await this.prisma.language.count({
      where: { id: { in: ids }, isActive: true },
    });
    if (count !== ids.length) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_LANGUAGE,
        message: 'One or more languages are invalid',
      });
    }
  }
}
