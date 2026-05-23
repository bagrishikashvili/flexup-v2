import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CompaniesService } from '@/companies/companies.service';
import { CompaniesController } from '@/companies/companies.controller';
import { CompanyAccessGuard } from '@/common/guards/company-access.guard';

@Module({
  imports: [MulterModule.register({ storage: memoryStorage() })],
  providers: [CompaniesService, CompanyAccessGuard],
  controllers: [CompaniesController],
  exports: [CompaniesService, CompanyAccessGuard],
})
export class CompaniesModule {}
