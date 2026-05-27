import { Module } from '@nestjs/common';
import { ReferenceDataModule } from '@/reference-data/reference-data.module';
import { JobPostingsService } from '@/job-postings/job-postings.service';
import { JobPostingsController } from '@/job-postings/job-postings.controller';

@Module({
  imports: [ReferenceDataModule],
  providers: [JobPostingsService],
  controllers: [JobPostingsController],
  exports: [JobPostingsService],
})
export class JobPostingsModule {}
