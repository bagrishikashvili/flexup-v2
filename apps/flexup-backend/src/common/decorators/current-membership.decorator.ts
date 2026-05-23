import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CompanyMemberRole } from '@prisma/client';

export interface CurrentMembershipPayload {
  id?: string;
  userId?: string;
  companyId: string;
  role: CompanyMemberRole;
  adminBypass?: boolean;
}

export const CurrentMembership = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentMembershipPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ companyMember: CurrentMembershipPayload }>();
    return request.companyMember;
  },
);
