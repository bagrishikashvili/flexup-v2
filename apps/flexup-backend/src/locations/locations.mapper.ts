import { Location } from '@prisma/client';
import { LocationResponse } from '@/locations/dto/location.response';

export function toLocationResponse(location: Location): LocationResponse {
  return {
    id: location.id,
    companyId: location.companyId,
    name: location.name,
    address: location.address,
    city: location.city,
    country: location.country,
    postalCode: location.postalCode ?? null,
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    isActive: location.isActive,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  };
}
