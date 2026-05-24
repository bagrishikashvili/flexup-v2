export interface LocationResponse {
  id: string;
  companyId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  /** ISO 8601 UTC timestamp on the wire. */
  createdAt: string;
  /** ISO 8601 UTC timestamp on the wire. */
  updatedAt: string;
}

export interface CreateLocationRequest {
  name: string;
  address: string;
  city: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export type UpdateLocationRequest = Partial<CreateLocationRequest>;

export interface SetLocationActiveRequest {
  isActive: boolean;
}

export interface LocationListQuery {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  isActive?: boolean;
  nearLatitude?: number;
  nearLongitude?: number;
  radiusKm?: number;
}
