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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompanyMemberRole } from '@flexup/shared';
import { CompanyAccessGuard } from '@/common/guards/company-access.guard';
import { RequireCompanyRole } from '@/common/decorators/require-company-role.decorator';
import { PaginatedResponse } from '@/common/types/paginated.response';
import { LocationsService } from '@/locations/locations.service';
import { CreateLocationDto } from '@/locations/dto/create-location.dto';
import { UpdateLocationDto } from '@/locations/dto/update-location.dto';
import { LocationQueryDto } from '@/locations/dto/location-query.dto';
import { LocationResponse } from '@/locations/dto/location.response';
import { SetUserActiveDto } from '@/users/dto/set-user-active.dto';

@ApiTags('locations')
@ApiBearerAuth('JWT')
@Controller('companies/:companyId/locations')
@UseGuards(CompanyAccessGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @RequireCompanyRole(CompanyMemberRole.MANAGER)
  create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateLocationDto,
  ): Promise<LocationResponse> {
    return this.locationsService.create(companyId, dto);
  }

  @Get()
  @RequireCompanyRole(CompanyMemberRole.VIEWER)
  list(
    @Param('companyId') companyId: string,
    @Query() query: LocationQueryDto,
  ): Promise<PaginatedResponse<LocationResponse>> {
    return this.locationsService.findByCompany(companyId, query);
  }

  @Get(':locationId')
  @RequireCompanyRole(CompanyMemberRole.VIEWER)
  findOne(
    @Param('companyId') companyId: string,
    @Param('locationId') locationId: string,
  ): Promise<LocationResponse> {
    return this.locationsService.findById(companyId, locationId);
  }

  @Patch(':locationId')
  @RequireCompanyRole(CompanyMemberRole.MANAGER)
  update(
    @Param('companyId') companyId: string,
    @Param('locationId') locationId: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<LocationResponse> {
    return this.locationsService.update(companyId, locationId, dto);
  }

  @Patch(':locationId/active')
  @RequireCompanyRole(CompanyMemberRole.MANAGER)
  setActive(
    @Param('companyId') companyId: string,
    @Param('locationId') locationId: string,
    @Body() dto: SetUserActiveDto,
  ): Promise<LocationResponse> {
    return this.locationsService.setActive(companyId, locationId, dto.isActive);
  }

  @Delete(':locationId')
  @RequireCompanyRole(CompanyMemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('companyId') companyId: string,
    @Param('locationId') locationId: string,
  ): Promise<void> {
    await this.locationsService.delete(companyId, locationId);
  }
}
