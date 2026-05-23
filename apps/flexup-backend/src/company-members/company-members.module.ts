import { Module } from '@nestjs/common';
import { CompanyMembersService } from '@/company-members/company-members.service';
import { CompanyMembersController } from '@/company-members/company-members.controller';
import { CompaniesModule } from '@/companies/companies.module';

@Module({
  imports: [CompaniesModule],
  providers: [CompanyMembersService],
  controllers: [CompanyMembersController],
})
export class CompanyMembersModule {}
