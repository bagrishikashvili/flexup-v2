import { IsEmail, IsEnum } from 'class-validator';
import { CompanyMemberRole } from '@prisma/client';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(CompanyMemberRole)
  role: CompanyMemberRole;
}
