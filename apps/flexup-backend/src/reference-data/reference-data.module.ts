import { Module } from '@nestjs/common';
import { ReferenceDataService } from '@/reference-data/reference-data.service';
import { ReferenceDataController } from '@/reference-data/reference-data.controller';

@Module({
  providers: [ReferenceDataService],
  controllers: [ReferenceDataController],
  exports: [ReferenceDataService],
})
export class ReferenceDataModule {}
