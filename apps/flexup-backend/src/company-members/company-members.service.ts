import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyMemberRole, ErrorCode, UserRole } from '@flexup/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { AddMemberDto } from '@/company-members/dto/add-member.dto';
import { UpdateMemberRoleDto } from '@/company-members/dto/update-member-role.dto';
import { MemberResponse } from '@/company-members/dto/member.response';
import { toMemberResponse } from '@/company-members/company-members.mapper';

const ROLE_ORDER: Record<CompanyMemberRole, number> = {
  OWNER: 0,
  MANAGER: 1,
  VIEWER: 2,
};

@Injectable()
export class CompanyMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(companyId: string): Promise<MemberResponse[]> {
    const members = await this.prisma.companyMember.findMany({
      where: { companyId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return members
      .sort((a, b) => {
        const diff = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
        if (diff !== 0) return diff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .map(toMemberResponse);
  }

  async addMember(
    companyId: string,
    dto: AddMemberDto,
  ): Promise<MemberResponse> {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not registered');
    }
    if ((user.role as UserRole) === UserRole.WORKER) {
      throw new BadRequestException({
        code: ErrorCode.WORKER_CANNOT_JOIN_COMPANY,
        message: 'WORKER role users cannot join companies',
      });
    }

    const existing = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: user.id, companyId } },
    });
    if (existing) {
      throw new ConflictException({
        code: ErrorCode.CONFLICT,
        message: 'User is already a member of this company',
      });
    }

    const created = await this.prisma.companyMember.create({
      data: { companyId, userId: user.id, role: dto.role },
      include: { user: true },
    });
    return toMemberResponse(created);
  }

  async updateMemberRole(
    companyId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<MemberResponse> {
    const member = await this.requireMember(companyId, memberId);

    if (
      (member.role as CompanyMemberRole) === CompanyMemberRole.OWNER &&
      dto.role !== CompanyMemberRole.OWNER
    ) {
      await this.assertNotLastOwner(companyId);
    }

    const updated = await this.prisma.companyMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: { user: true },
    });
    return toMemberResponse(updated);
  }

  async removeMember(
    companyId: string,
    memberId: string,
    actingUserId: string,
  ): Promise<void> {
    const member = await this.requireMember(companyId, memberId);

    if (member.userId === actingUserId) {
      throw new BadRequestException({
        code: ErrorCode.LAST_OWNER_PROTECTION,
        message: 'Use leave-company endpoint to remove yourself',
      });
    }

    if ((member.role as CompanyMemberRole) === CompanyMemberRole.OWNER) {
      await this.assertNotLastOwner(companyId);
    }

    await this.prisma.companyMember.delete({ where: { id: memberId } });
  }

  async leaveCompany(companyId: string, userId: string): Promise<void> {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    if ((membership.role as CompanyMemberRole) === CompanyMemberRole.OWNER) {
      const ownerCount = await this.prisma.companyMember.count({
        where: { companyId, role: CompanyMemberRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException({
          code: ErrorCode.LAST_OWNER_PROTECTION,
          message: 'Transfer ownership or deactivate company before leaving',
        });
      }
    }
    await this.prisma.companyMember.delete({ where: { id: membership.id } });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async requireMember(companyId: string, memberId: string) {
    const member = await this.prisma.companyMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.companyId !== companyId) {
      throw new NotFoundException('Member not found');
    }
    return member;
  }

  private async assertNotLastOwner(companyId: string): Promise<void> {
    const ownerCount = await this.prisma.companyMember.count({
      where: { companyId, role: CompanyMemberRole.OWNER },
    });
    if (ownerCount <= 1) {
      throw new BadRequestException({
        code: ErrorCode.LAST_OWNER_PROTECTION,
        message: 'Cannot demote the last owner',
      });
    }
  }
}
