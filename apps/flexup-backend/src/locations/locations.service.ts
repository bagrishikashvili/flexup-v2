import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Location, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginatedResponse } from '@/common/types/paginated.response';
import { CreateLocationDto } from '@/locations/dto/create-location.dto';
import { UpdateLocationDto } from '@/locations/dto/update-location.dto';
import { LocationQueryDto } from '@/locations/dto/location-query.dto';
import { LocationResponse } from '@/locations/dto/location.response';
import { toLocationResponse } from '@/locations/locations.mapper';

const DEFAULT_RADIUS_KM = 10;

interface LocationWithDistance extends Location {
  distance: number;
}

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  async create(
    companyId: string,
    dto: CreateLocationDto,
  ): Promise<LocationResponse> {
    this.assertCoordsPaired(dto.latitude, dto.longitude);

    const location = await this.prisma.location.create({
      data: {
        companyId,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        country: dto.country ?? 'GE',
        postalCode: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });
    return toLocationResponse(location);
  }

  // ─── Read ────────────────────────────────────────────────────────────────

  async findByCompany(
    companyId: string,
    query: LocationQueryDto,
  ): Promise<PaginatedResponse<LocationResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const hasGeo =
      query.nearLatitude !== undefined && query.nearLongitude !== undefined;
    if (hasGeo) {
      return this.findByCompanyGeo(companyId, query, page, limit);
    }
    if (query.nearLatitude !== undefined || query.nearLongitude !== undefined) {
      throw new BadRequestException(
        'nearLatitude and nearLongitude must be provided together',
      );
    }

    const where: Prisma.LocationWhereInput = {
      companyId,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.city && {
        city: { equals: query.city, mode: 'insensitive' },
      }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { address: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [locations, total] = await this.prisma.$transaction([
      this.prisma.location.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.location.count({ where }),
    ]);

    return {
      data: locations.map(toLocationResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(
    companyId: string,
    locationId: string,
  ): Promise<LocationResponse> {
    const location = await this.requireLocation(companyId, locationId);
    return toLocationResponse(location);
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  async update(
    companyId: string,
    locationId: string,
    dto: UpdateLocationDto,
  ): Promise<LocationResponse> {
    const current = await this.requireLocation(companyId, locationId);

    // Resolved values for paired-validation: only check when either is in the
    // payload; ignore when both untouched.
    if (dto.latitude !== undefined || dto.longitude !== undefined) {
      const lat = dto.latitude !== undefined ? dto.latitude : current.latitude;
      const lng =
        dto.longitude !== undefined ? dto.longitude : current.longitude;
      this.assertCoordsPaired(lat, lng);
    }

    const data: Prisma.LocationUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.country !== undefined && { country: dto.country }),
      ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
      ...(dto.latitude !== undefined && { latitude: dto.latitude }),
      ...(dto.longitude !== undefined && { longitude: dto.longitude }),
    };

    const updated = await this.prisma.location.update({
      where: { id: locationId },
      data,
    });
    return toLocationResponse(updated);
  }

  async setActive(
    companyId: string,
    locationId: string,
    isActive: boolean,
  ): Promise<LocationResponse> {
    await this.requireLocation(companyId, locationId);
    const updated = await this.prisma.location.update({
      where: { id: locationId },
      data: { isActive },
    });
    return toLocationResponse(updated);
  }

  // ─── Delete ──────────────────────────────────────────────────────────────

  async delete(companyId: string, locationId: string): Promise<void> {
    await this.requireLocation(companyId, locationId);

    const [shiftCount, seriesCount] = await this.prisma.$transaction([
      this.prisma.shift.count({ where: { locationId } }),
      this.prisma.shiftSeries.count({ where: { locationId } }),
    ]);
    if (shiftCount > 0 || seriesCount > 0) {
      throw new ConflictException(
        'Cannot delete location with associated shifts. Deactivate instead.',
      );
    }

    await this.prisma.location.delete({ where: { id: locationId } });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async requireLocation(
    companyId: string,
    locationId: string,
  ): Promise<Location> {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, companyId },
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }
    return location;
  }

  private assertCoordsPaired(
    lat: number | null | undefined,
    lng: number | null | undefined,
  ): void {
    const latPresent = lat !== undefined && lat !== null;
    const lngPresent = lng !== undefined && lng !== null;
    if (latPresent !== lngPresent) {
      throw new BadRequestException(
        'latitude and longitude must be provided together',
      );
    }
  }

  // ─── Geo search (raw SQL Haversine) ──────────────────────────────────────

  private async findByCompanyGeo(
    companyId: string,
    query: LocationQueryDto,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<LocationResponse>> {
    const lat = query.nearLatitude as number;
    const lng = query.nearLongitude as number;
    const radius = query.radiusKm ?? DEFAULT_RADIUS_KM;
    const offset = (page - 1) * limit;

    // Build optional filter fragments with Prisma.sql (parameterized).
    const isActiveFilter =
      query.isActive !== undefined
        ? Prisma.sql`AND "isActive" = ${query.isActive}`
        : Prisma.empty;

    const cityFilter = query.city
      ? Prisma.sql`AND LOWER("city") = LOWER(${query.city})`
      : Prisma.empty;

    const searchFilter = query.search
      ? Prisma.sql`AND ("name" ILIKE ${'%' + query.search + '%'} OR "address" ILIKE ${'%' + query.search + '%'} OR "city" ILIKE ${'%' + query.search + '%'})`
      : Prisma.empty;

    const distanceExpr = Prisma.sql`(6371 * acos(
      cos(radians(${lat})) *
      cos(radians("latitude")) *
      cos(radians("longitude") - radians(${lng})) +
      sin(radians(${lat})) *
      sin(radians("latitude"))
    ))`;

    const rows = await this.prisma.$queryRaw<LocationWithDistance[]>(Prisma.sql`
      SELECT * FROM (
        SELECT *, ${distanceExpr} AS "distance"
        FROM "Location"
        WHERE "companyId" = ${companyId}
          AND "latitude" IS NOT NULL
          AND "longitude" IS NOT NULL
          ${isActiveFilter}
          ${cityFilter}
          ${searchFilter}
      ) sub
      WHERE "distance" <= ${radius}
      ORDER BY "distance" ASC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countRows = await this.prisma.$queryRaw<
      { count: bigint }[]
    >(Prisma.sql`
      SELECT COUNT(*)::bigint AS "count" FROM (
        SELECT ${distanceExpr} AS "distance"
        FROM "Location"
        WHERE "companyId" = ${companyId}
          AND "latitude" IS NOT NULL
          AND "longitude" IS NOT NULL
          ${isActiveFilter}
          ${cityFilter}
          ${searchFilter}
      ) sub
      WHERE "distance" <= ${radius}
    `);

    const total = Number(countRows[0]?.count ?? 0n);

    return {
      data: rows.map(toLocationResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
