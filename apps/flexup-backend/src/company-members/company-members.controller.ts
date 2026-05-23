import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CompanyMemberRole } from '@prisma/client';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { CompanyAccessGuard } from '@/common/guards/company-access.guard';
import { RequireCompanyRole } from '@/common/decorators/require-company-role.decorator';
import { CompanyMembersService } from '@/company-members/company-members.service';
import { AddMemberDto } from '@/company-members/dto/add-member.dto';
import { UpdateMemberRoleDto } from '@/company-members/dto/update-member-role.dto';
import { MemberResponse } from '@/company-members/dto/member.response';

interface AuthUser {
  id: string;
}

@Controller('companies/:companyId/members')
@UseGuards(CompanyAccessGuard)
export class CompanyMembersController {
  constructor(private readonly membersService: CompanyMembersService) {}

  @Get()
  @RequireCompanyRole(CompanyMemberRole.VIEWER)
  list(@Param('companyId') companyId: string): Promise<MemberResponse[]> {
    return this.membersService.listMembers(companyId);
  }

  @Post()
  @RequireCompanyRole(CompanyMemberRole.OWNER)
  add(
    @Param('companyId') companyId: string,
    @Body() dto: AddMemberDto,
  ): Promise<MemberResponse> {
    return this.membersService.addMember(companyId, dto);
  }

  // Leave-self must precede `:memberId` to avoid matching "me" as id.
  @Delete('me')
  @RequireCompanyRole(CompanyMemberRole.VIEWER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(
    @Param('companyId') companyId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.membersService.leaveCompany(companyId, user.id);
  }

  @Patch(':memberId')
  @RequireCompanyRole(CompanyMemberRole.OWNER)
  updateRole(
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<MemberResponse> {
    return this.membersService.updateMemberRole(companyId, memberId, dto);
  }

  @Delete(':memberId')
  @RequireCompanyRole(CompanyMemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.membersService.removeMember(companyId, memberId, user.id);
  }
}
