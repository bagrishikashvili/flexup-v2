# Task Batch 2.2 — Locations

## ⚠ პირველი ნაბიჯი — წაიკითხე ეს ფაილები

1. `CLAUDE.md` (root-ში)
2. `docs/ARCHITECTURE.md` — განსაკუთრებით ADR-019 (CompanyAccessGuard), ADR-020 (403 vs 404)
3. `apps/flexup-backend/prisma/schema.prisma` — Location model
4. `apps/flexup-backend/src/companies/` — Batch 2.1-ის ფაილები (გამოვიყენებთ იგივე pattern-ს)
5. `apps/flexup-backend/src/common/guards/company-access.guard.ts` — უკვე გვაქვს

თუ რომელიმე ფაილში ჩაწერილს ეწინააღმდეგება შენი იდეა — **შემაჩერე და მკითხე**.

---

## INPUT (კონტექსტი)

რა გვაქვს უკვე (Batch 2.1-დან):
- Company CRUD სრულად
- CompanyMember management
- `CompanyAccessGuard` + `@RequireCompanyRole()` decorator
- `@CurrentMembership()` decorator
- Logo upload pattern (Sharp + multer)
- `toCompanyPublic()` mapper pattern

რა გვაკლია (ამ batch-ში):
- Location CRUD (nested under company)
- Geo-coordinates support (lat/lng for shift filtering)

ეს არის შედარებით პატარა batch-ი — Company-ის pattern-ის reuse-ი.

---

## GOAL

ააშენე Location module — კომპანიის ფილიალების მართვა. ნებისმიერ company-ს შეიძლება ჰქონდეს რამდენიმე location (მაგ., Starbucks-ი → 50 ფილიალი). ცვლა location-ზეა მიბმული, არა company-ზე უშუალოდ.

---

## კონკრეტული deliverables

### 1. `src/locations/dto/`

`create-location.dto.ts`:
```typescript
{
  name: string;              // min 1, max 200 — e.g., "Starbucks Saburtalo"
  address: string;           // min 1, max 500
  city: string;              // min 1, max 100
  country?: string;          // ISO 3166-1 alpha-2, default "GE", regex /^[A-Z]{2}$/
  postalCode?: string;       // optional, max 20
  latitude?: number;         // optional, range -90..90
  longitude?: number;        // optional, range -180..180
}
```

`update-location.dto.ts`:
- `PartialType(CreateLocationDto)` — all optional

`location-query.dto.ts`:
```typescript
{
  page?: number = 1;
  limit?: number = 20;        // max 100
  search?: string;            // ILIKE on name OR address OR city
  city?: string;              // exact match
  isActive?: boolean;         // filter, default both
  // geo search (optional)
  nearLatitude?: number;
  nearLongitude?: number;
  radiusKm?: number;          // 1..100, default 10 if near coords given
}
```

`location.response.ts`:
```typescript
{
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
```

### 2. `src/locations/locations.service.ts`

```typescript
async create(companyId: string, dto: CreateLocationDto): Promise<LocationResponse>
async findByCompany(companyId: string, query: LocationQueryDto): Promise<PaginatedResponse<LocationResponse>>
async findById(companyId: string, locationId: string): Promise<LocationResponse>
async update(companyId: string, locationId: string, dto: UpdateLocationDto): Promise<LocationResponse>
async setActive(companyId: string, locationId: string, isActive: boolean): Promise<LocationResponse>
async delete(companyId: string, locationId: string): Promise<void>
```

### წესები

**Create:**
1. Validate lat+lng pair — if one is given, both must be given (partial coords don't make sense)
2. Insert with `companyId` from path
3. Return LocationResponse

**findByCompany:**
1. Where `companyId` (from CompanyAccessGuard)
2. Search filter: case-insensitive ILIKE on name/address/city
3. City filter: exact (case-insensitive)
4. `isActive` filter
5. **Geo search** (if `nearLatitude`, `nearLongitude` provided):
   - Haversine formula in raw SQL OR PostGIS — **MVP-ისთვის Haversine raw SQL** (PostGIS extension დამატება ცალკე batch-ში)
   - Filter where distance ≤ radiusKm
   - Sort by distance ASC
   - Otherwise sort: `createdAt DESC`
6. Pagination

**findById:**
- Where `companyId` AND `id`
- თუ არ მოიძებნება → `NotFoundException` ("Location not found")

**update:**
- Same lat+lng validation
- Where `companyId` AND `id`

**setActive:**
- Just toggle `isActive` field
- Used when company wants to temporarily disable a location without deleting

**delete (HARD delete):**
- ⚠ **KRITIKULI:** Location-ის წაშლა შეიძლება მხოლოდ თუ მასზე **არ არის** linked shifts (active or historical)
- ⚠ Check: `count(Shift where locationId)` + `count(ShiftSeries where locationId)`
- თუ > 0 → `ConflictException` ("Cannot delete location with associated shifts. Deactivate instead.")
- სხვაგვარად — Prisma `delete`
- **რეალური წაშლა მცირე ხშირია — გამოყენებითი case: შეცდომით შექმნილი location ცარიელით**

### 3. `src/locations/locations.controller.ts`

**ყველა endpoint nested under `/api/companies/:companyId/locations`**

| Method | Path | Min role | DTO | Returns |
|--------|------|----------|-----|---------|
| POST   | `/api/companies/:companyId/locations` | MANAGER | CreateLocationDto | 201 + LocationResponse |
| GET    | `/api/companies/:companyId/locations` | VIEWER | LocationQueryDto (query) | 200 + Paginated |
| GET    | `/api/companies/:companyId/locations/:locationId` | VIEWER | - | 200 + LocationResponse |
| PATCH  | `/api/companies/:companyId/locations/:locationId` | MANAGER | UpdateLocationDto | 200 + LocationResponse |
| PATCH  | `/api/companies/:companyId/locations/:locationId/active` | MANAGER | `{ isActive: boolean }` | 200 + LocationResponse |
| DELETE | `/api/companies/:companyId/locations/:locationId` | OWNER | - | 204 |

**ყველა endpoint:**
- `@UseGuards(JwtAuthGuard, CompanyAccessGuard)`
- `@RequireCompanyRole(...)` დიაგრამის შესაბამისად

### 4. `src/locations/locations.module.ts`

Imports: PrismaModule (global), ConfigModule
Providers: LocationsService
Controllers: LocationsController
Exports: LocationsService (Shifts module-ი მერე გამოიყენებს)

### 5. `src/locations/locations.mapper.ts`

```typescript
function toLocationResponse(location: Location): LocationResponse
```

Prisma Location → LocationResponse (camelCase preserved, just type-check enforcement).

### 6. Geo distance helper

`src/common/utils/geo.utils.ts`:

```typescript
/**
 * Haversine distance in kilometers between two coordinates.
 * Returns null if any coordinate is null.
 */
export function haversineDistanceKm(
  lat1: number | null,
  lng1: number | null,
  lat2: number,
  lng2: number,
): number | null
```

ეს გამოიყენება optional გამოყენებისთვის — geo search-ი raw SQL-ში ხდება პერფორმანსისთვის.

### 7. Raw SQL geo query (Haversine)

Service-ში, თუ near coords მოცემულია, შემდეგი Prisma `$queryRaw` გამოიყენე:

```typescript
const results = await this.prisma.$queryRaw<Array<Location & { distance: number }>>`
  SELECT *, 
    (6371 * acos(
      cos(radians(${nearLatitude})) * 
      cos(radians(latitude)) * 
      cos(radians(longitude) - radians(${nearLongitude})) + 
      sin(radians(${nearLatitude})) * 
      sin(radians(latitude))
    )) AS distance
  FROM "Location"
  WHERE "companyId" = ${companyId}
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND ${isActive !== undefined ? Prisma.sql`"isActive" = ${isActive}` : Prisma.sql`TRUE`}
  HAVING distance <= ${radiusKm}
  ORDER BY distance ASC
  LIMIT ${limit} OFFSET ${(page - 1) * limit}
`;
```

⚠ Raw SQL = SQL injection vector-ი თუ არასწორად აკეთებ. **გამოიყენე `Prisma.sql` template literal-ი მკაცრად** — არასოდეს string concatenation.

Total count ცალკე query-ით (raw SQL-ი იგივე WHERE clause-ით, count(*)).

---

## ACCEPTANCE CRITERIA

### Build & startup
```bash
cd apps/flexup-backend
npm run build && npm run lint && npx tsc --noEmit && npm run start:dev
```

### Manual E2E flow

Setup — შენ უკვე გაქვს მუშა company Batch 2.1-დან. გადახედე ან შექმენი ხელახლა:

```bash
# Login as owner
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@test.com","password":"Test1234"}'
# Save OWNER_ACCESS, COMPANY_ID
```

**1. Create location:**
```bash
curl -X POST http://localhost:3002/api/companies/$COMPANY_ID/locations \
  -H "Authorization: Bearer $OWNER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Saburtalo Branch",
    "address": "Vazha-Pshavela Ave 76",
    "city": "Tbilisi",
    "postalCode": "0186",
    "latitude": 41.7232,
    "longitude": 44.7456
  }'
# Save LOCATION_ID
```
**Expected:** 201, LocationResponse.

**2. List locations (empty filters):**
```bash
curl "http://localhost:3002/api/companies/$COMPANY_ID/locations" \
  -H "Authorization: Bearer $OWNER_ACCESS"
```
**Expected:** 200, paginated array with 1 location.

**3. Get specific location:**
```bash
curl http://localhost:3002/api/companies/$COMPANY_ID/locations/$LOCATION_ID \
  -H "Authorization: Bearer $OWNER_ACCESS"
```
**Expected:** 200, LocationResponse.

**4. Update location:**
```bash
curl -X PATCH http://localhost:3002/api/companies/$COMPANY_ID/locations/$LOCATION_ID \
  -H "Authorization: Bearer $OWNER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"address":"Vazha-Pshavela Ave 100"}'
```
**Expected:** 200, address updated.

**5. Invalid coordinates (only lat):**
```bash
curl -X POST http://localhost:3002/api/companies/$COMPANY_ID/locations \
  -H "Authorization: Bearer $OWNER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bad Location",
    "address": "...",
    "city": "Tbilisi",
    "latitude": 41.7
  }'
```
**Expected:** 400 ("latitude and longitude must be provided together").

**6. Invalid coordinate range:**
```bash
curl -X POST http://localhost:3002/api/companies/$COMPANY_ID/locations \
  -H "Authorization: Bearer $OWNER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Off Earth",
    "address": "Moon",
    "city": "Luna",
    "latitude": 95,
    "longitude": 200
  }'
```
**Expected:** 400 (validation errors on lat/lng).

**7. Create second location for geo search test:**
```bash
curl -X POST http://localhost:3002/api/companies/$COMPANY_ID/locations \
  -H "Authorization: Bearer $OWNER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Old Tbilisi Branch",
    "address": "Pushkin St 5",
    "city": "Tbilisi",
    "latitude": 41.6938,
    "longitude": 44.8015
  }'
```

**8. Geo search:**
```bash
# 5km radius around Saburtalo coords
curl "http://localhost:3002/api/companies/$COMPANY_ID/locations?nearLatitude=41.7232&nearLongitude=44.7456&radiusKm=5" \
  -H "Authorization: Bearer $OWNER_ACCESS"
```
**Expected:** 200, only Saburtalo location (Old Tbilisi > 5km away). 

```bash
# 15km radius — should return both
curl "http://localhost:3002/api/companies/$COMPANY_ID/locations?nearLatitude=41.7232&nearLongitude=44.7456&radiusKm=15" \
  -H "Authorization: Bearer $OWNER_ACCESS"
```
**Expected:** 200, both locations, Saburtalo first (closer).

**9. Search by name:**
```bash
curl "http://localhost:3002/api/companies/$COMPANY_ID/locations?search=Saburtalo" \
  -H "Authorization: Bearer $OWNER_ACCESS"
```
**Expected:** 200, 1 result.

**10. Filter by city:**
```bash
curl "http://localhost:3002/api/companies/$COMPANY_ID/locations?city=Tbilisi" \
  -H "Authorization: Bearer $OWNER_ACCESS"
```
**Expected:** 200, both.

**11. Deactivate location:**
```bash
curl -X PATCH http://localhost:3002/api/companies/$COMPANY_ID/locations/$LOCATION_ID/active \
  -H "Authorization: Bearer $OWNER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"isActive":false}'
```
**Expected:** 200, isActive: false.

**12. Filter inactive:**
```bash
curl "http://localhost:3002/api/companies/$COMPANY_ID/locations?isActive=false" \
  -H "Authorization: Bearer $OWNER_ACCESS"
```
**Expected:** 200, 1 result (deactivated one).

**13. Delete location:**
```bash
curl -X DELETE http://localhost:3002/api/companies/$COMPANY_ID/locations/$LOCATION_ID \
  -H "Authorization: Bearer $OWNER_ACCESS"
```
**Expected:** 204.

**14. Non-member cannot access:**

შექმენი outsider user, login, შემდეგ:
```bash
curl "http://localhost:3002/api/companies/$COMPANY_ID/locations" \
  -H "Authorization: Bearer $OUTSIDER_ACCESS"
```
**Expected:** 403 (CompanyAccessGuard rejects).

**15. VIEWER role cannot create:**

დააამატე VIEWER user as company member, login, შემდეგ:
```bash
curl -X POST http://localhost:3002/api/companies/$COMPANY_ID/locations \
  -H "Authorization: Bearer $VIEWER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"name":"X","address":"Y","city":"Z"}'
```
**Expected:** 403 ("Insufficient company role").

**16. Cross-company isolation:**

შექმენი second company sxva user-ით, შემდეგ ცადე:
```bash
# Login as second owner, get $COMPANY_ID_2 და $OWNER_ACCESS_2
curl http://localhost:3002/api/companies/$COMPANY_ID/locations/$LOCATION_ID_FROM_COMPANY_1 \
  -H "Authorization: Bearer $OWNER_ACCESS_2"
```
**Expected:** 403 (CompanyAccessGuard rejects — owner-ი მეორე company-ის member არ არის).

---

## CONSTRAINTS

1. **არ შეცვალო `prisma/schema.prisma`** — Location model საკმარისია
2. **არ შეცვალო Companies module** — Batch 2.1 დასრულდა
3. **არ შეცვალო `CompanyAccessGuard`** — გამოყენება როგორც არის
4. **არ დაამატო PostGIS extension** — Haversine raw SQL ჯერ საკმარისია (ADR)
5. **არ გამოიყენო string concatenation raw SQL-ში** — მხოლოდ `Prisma.sql` parameterized
6. **არ შექმნა Location entity-ი outside company** — ყოველთვის nested
7. **არასოდეს დააბრუნო Prisma Location პირდაპირ** — mapper გამოიყენე
8. **არ გამოიყენო `any`** — explicit types
9. **არ შექმნა separate "find global locations" endpoint** — workers მერე ცალკე route-ით (Phase 3)

---

## SECURITY REVIEW

- [ ] ყოველი endpoint `CompanyAccessGuard`-ით დაცული
- [ ] Cross-company access blocked (Test 16)
- [ ] VIEWER ვერ ცვლის (Test 15)
- [ ] Raw SQL parameterized (`Prisma.sql`)
- [ ] Coordinate validation (range + paired)
- [ ] Delete blocks if shifts exist

---

## OUT OF SCOPE

- PostGIS extension (V2 if performance becomes issue)
- Polygon zones / service areas (V3)
- Location photos (V2 — same pattern as logo/avatar)
- Reverse geocoding (V2)
- Operating hours per location (V2)
- Public location pages (V2 — for workers to discover)
- Cascade soft-delete behavior with shifts

---

## ADR-ი

`docs/ARCHITECTURE.md`-ში დაამატე:

**ADR-023: Haversine raw SQL over PostGIS for geo search**
- Decision: Pure SQL with Haversine formula, no PostGIS extension
- Reason: 
  - PostGIS adds operational complexity (extension, backup, migration)
  - Haversine accurate enough for radius < 100km
  - Indexes on `(latitude, longitude)` already exist in schema
- Reevaluate: when location count exceeds ~10k per company, or polygon zones needed

**ADR-024: Location HARD delete with shift guard**
- Decision: `delete` blocks if any Shift/ShiftSeries references location
- Alternative considered: soft delete via `isActive`
- Reason: location ID stable for historical shifts; hard delete only for cleanup of mistakes

---

## დასასრულს

- ყველა 16 acceptance criterion უნდა გავიდეს
- Security review checklist სრულად
- ADR-23, ADR-24 ჩაწერილი
- Commit: `feat: locations module (batch 2.2)`

ფაზა 2-ის backend foundation დასრულდა! 🎉 შემდეგი — `packages/shared` + frontend readiness.

თუ session ბოლომდე მიდის, handoff skill-ით → `docs/handoffs/HANDOFF_batch_2_2_<MM_DD>.md`.

---

## **შემაჩერე** თუ:
- Raw SQL approach ცვლი (გადადი Prisma query-ზე)
- Lat+lng validation strategy ცვლი
- Delete behavior ცვლი
