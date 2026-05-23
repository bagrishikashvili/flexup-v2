export class LocationResponse {
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
  createdAt: Date;
  updatedAt: Date;
}
