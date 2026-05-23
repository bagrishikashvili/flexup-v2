import { Module } from '@nestjs/common';
import { LocationsService } from '@/locations/locations.service';
import { LocationsController } from '@/locations/locations.controller';
import { CompaniesModule } from '@/companies/companies.module';

@Module({
  imports: [CompaniesModule],
  providers: [LocationsService],
  controllers: [LocationsController],
  exports: [LocationsService],
})
export class LocationsModule {}
