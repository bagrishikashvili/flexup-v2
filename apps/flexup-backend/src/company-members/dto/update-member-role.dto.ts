import { IsEnum } from 'class-validator';
import { CompanyMemberRole } from '@flexup/shared';

export class UpdateMemberRoleDto {
  @IsEnum(CompanyMemberRole)
  role: CompanyMemberRole;
}
