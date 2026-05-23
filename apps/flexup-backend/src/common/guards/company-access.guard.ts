import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompanyMemberRole, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { COMPANY_ROLES_KEY } from '@/common/decorators/require-company-role.decorator';
import { CurrentMembershipPayload } from '@/common/decorators/current-membership.decorator';

const ROLE_HIERARCHY: Record<CompanyMemberRole, number> = {
  OWNER: 3,
  MANAGER: 2,
  VIEWER: 1,
};

interface RequestWithMembership {
  user?: { id: string; role: UserRole };
  params: Record<string, string>;
  companyMember?: CurrentMembershipPayload;
}

@Injectable()
export class CompanyAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithMembership>();
    const user = request.user;
    const companyId = request.params.companyId;

    if (!user) {
      throw new UnauthorizedException();
    }
    if (!companyId) {
      throw new ForbiddenException('Company id required');
    }

    if (user.role === UserRole.ADMIN) {
      request.companyMember = {
        companyId,
        role: CompanyMemberRole.OWNER,
        adminBypass: true,
      };
      return true;
    }

    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: user.id, companyId } },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this company');
    }

    const requiredRoles = this.reflector.getAllAndOverride<
      CompanyMemberRole[] | undefined
    >(COMPANY_ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (
      requiredRoles &&
      requiredRoles.length > 0 &&
      !this.satisfiesRole(membership.role, requiredRoles)
    ) {
      throw new ForbiddenException('Insufficient company role');
    }

    request.companyMember = {
      id: membership.id,
      userId: membership.userId,
      companyId: membership.companyId,
      role: membership.role,
    };

    return true;
  }

  private satisfiesRole(
    actual: CompanyMemberRole,
    required: CompanyMemberRole[],
  ): boolean {
    const minRequired = Math.min(...required.map((r) => ROLE_HIERARCHY[r]));
    return ROLE_HIERARCHY[actual] >= minRequired;
  }
}
