import { IsEnum } from 'class-validator';
import { CompanyMemberRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsEnum(CompanyMemberRole)
  role: CompanyMemberRole;
}
