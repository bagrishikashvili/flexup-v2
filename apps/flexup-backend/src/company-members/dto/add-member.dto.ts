import { IsEmail, IsEnum } from 'class-validator';
import { CompanyMemberRole } from '@flexup/shared';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(CompanyMemberRole)
  role: CompanyMemberRole;
}
