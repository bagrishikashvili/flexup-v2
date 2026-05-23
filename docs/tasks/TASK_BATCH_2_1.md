# Task Batch 2.1 — Companies + Members (Multi-tenant Foundation)

## ⚠ პირველი ნაბიჯი — წაიკითხე ეს ფაილები

წინასწარ წაიკითხე და დაიცავი:
1. `CLAUDE.md` (root-ში) — განსაკუთრებით "Multi-tenancy" სექცია
2. `docs/ARCHITECTURE.md` — ADR-006 multi-tenancy-ზე
3. `apps/flexup-backend/prisma/schema.prisma` — Company, CompanyMember მოდელები
4. Batch 1.1-1.3-ის შედეგი — `src/auth/`, `src/users/`, guards, decorators

თუ რომელიმე ფაილში ჩაწერილს ეწინააღმდეგება შენი იდეა — **შემაჩერე და მკითხე**.

---

## INPUT (კონტექსტი)

რა გვაქვს უკვე (Phase 1-დან):
- სრული Auth (register, login, refresh, logout)
- სრული Users module (profile, avatar, password change)
- `JwtAuthGuard` global
- `@Public()`, `@CurrentUser()`, `@Roles()` decorators
- `RolesGuard` (platform-level: ADMIN vs WORKER vs COMPANY_USER)

რა გვაკლია (ამ batch-ში):
- Company CRUD
- Company member management (invitations, role changes)
- **Multi-tenant access control** (`CompanyAccessGuard`, `@RequireCompanyRole()` decorator)
- Company context extraction from request

ეს არის **ფუნდამენტი მთელი Phase 2-ისთვის**. ყველა შემდეგი resource (Locations, Shifts, Flexpools) ამ access control-ით დაცული იქნება.

---

## GOAL

ააშენე multi-tenant Company management system. ერთი user-ი შეიძლება იყოს რამდენიმე company-ის წევრი სხვადასხვა role-ით. ყველა company-scoped operation-ი უნდა იყოს დაცული.

### კონცეფცია — Multi-tenant access წესები

**Company-ის შექმნა:**
- ნებისმიერ `COMPANY_USER`-ს შეუძლია შექმნას Company
- შემქმნელი ავტომატურად ხდება `OWNER`

**Company-ის წევრობა:**
- ერთი user → რამდენიმე company (განსხვავებული role-ებით)
- შემოწმება `CompanyMember` join table-ით

**Role hierarchy (company-level):**
- `OWNER` — ყველაფერი (delete company, transfer ownership, manage members)
- `MANAGER` — operations (shifts, locations, flexpools, rates), VIEWER არ შეუძლია წაშალოს
- `VIEWER` — read-only

**კრიტიკული წესი:** ერთ company-ში **ყოველთვის უნდა იყოს მინიმუმ ერთი OWNER**. ბოლო OWNER-ის წაშლა/role downgrade აკრძალულია.

---

## კონკრეტული deliverables

### 1. `src/companies/dto/`

`create-company.dto.ts`:
```typescript
{
  name: string;                   // min 2, max 200
  legalName?: string;             // optional, max 200
  registrationNumber?: string;    // optional, max 50
  vatNumber?: string;             // optional, max 50
  websiteUrl?: string;            // optional, valid URL
  defaultCurrency?: string;       // ISO 4217, default "GEL", regex /^[A-Z]{3}$/
}
```

`update-company.dto.ts`:
- `PartialType(CreateCompanyDto)` — ყველა field optional

`company-list-query.dto.ts`:
```typescript
{
  page?: number = 1;
  limit?: number = 20;          // max 100
  search?: string;              // ILIKE on name
  isActive?: boolean;
  isVerified?: boolean;
}
```

`company-public.response.ts`:
```typescript
{
  id: string;
  name: string;
  legalName: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  defaultCurrency: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // member-specific data (აქედანვე ვბრუნებთ, optional ფიროდე)
  currentUserRole?: CompanyMemberRole;
}
```

`company-detail.response.ts` — სრული data OWNER-ისთვის:
```typescript
{
  ...CompanyPublicResponse,
  registrationNumber: string | null;
  vatNumber: string | null;
  memberCount: number;
  verifiedAt: Date | null;
}
```

### 2. `src/companies/companies.service.ts`

```typescript
// Company CRUD
async create(userId: string, dto: CreateCompanyDto): Promise<CompanyDetailResponse>
async findUserCompanies(userId: string): Promise<CompanyPublicResponse[]>
async findById(companyId: string, userId: string): Promise<CompanyDetailResponse>
async update(companyId: string, dto: UpdateCompanyDto): Promise<CompanyDetailResponse>
async deactivate(companyId: string): Promise<void>

// Avatar/logo
async uploadLogo(companyId: string, file: Express.Multer.File): Promise<CompanyDetailResponse>
async removeLogo(companyId: string): Promise<CompanyDetailResponse>

// Admin
async listAll(query: CompanyListQueryDto): Promise<PaginatedResponse<CompanyDetailResponse>>
async verifyCompany(companyId: string): Promise<CompanyDetailResponse>
async setActive(companyId: string, isActive: boolean): Promise<CompanyDetailResponse>
```

### წესები

**Create:**
1. Transaction:
   - Create Company
   - Create CompanyMember (OWNER role) for the creator
2. Return CompanyDetailResponse

**Find user companies:**
- Return ყველა company სადაც user-ი წევრია, თითოეულზე მისი role
- Sort: ბოლო update-ი (`updatedAt DESC`)

**Update:**
- Validation backend-ში — currency format
- `companyId` resource-ის-მფლობელი ხელით აღარ ვამოწმებთ (Guard აკეთებს)

**Deactivate (soft delete):**
- `isActive = false`
- ცვლის გავლენა: shifts, applications მუშაობს ბუნებრივად ცხრილებზე გადადის Phase 2.5-ში
- Cascade ცვლილებები: არ ვაკეთებთ ხელით — Phase 2-ის ბოლოს გავაკეთებთ ცხრილ-მთლიანი policy-ი

**Logo upload (იგივე pattern Avatar-ისთვის Batch 1.3-დან):**
- multer memoryStorage
- Validation: image/jpeg, png, webp, max 5MB
- Sharp: resize 512×512 (fit: inside), WebP quality 85
- Storage: `uploads/company-logos/<companyId>-<timestamp>.webp`
- ძველი წაშლა

**Admin listAll:**
- Pagination
- Search by name (ILIKE)
- Filters: isActive, isVerified
- Sort: createdAt DESC

**Verify company:**
- Admin-only operation
- `isVerified = true`, `verifiedAt = now()`

### 3. `src/company-members/dto/`

`add-member.dto.ts`:
```typescript
{
  email: string;                          // user-ის email-ით ვამატებთ
  role: CompanyMemberRole;                // OWNER | MANAGER | VIEWER
}
```

`update-member-role.dto.ts`:
```typescript
{
  role: CompanyMemberRole;
}
```

`member.response.ts`:
```typescript
{
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  role: CompanyMemberRole;
  createdAt: Date;
}
```

### 4. `src/company-members/company-members.service.ts`

```typescript
async listMembers(companyId: string): Promise<MemberResponse[]>
async addMember(companyId: string, dto: AddMemberDto): Promise<MemberResponse>
async updateMemberRole(companyId: string, memberId: string, dto: UpdateMemberRoleDto): Promise<MemberResponse>
async removeMember(companyId: string, memberId: string): Promise<void>
async leaveCompany(companyId: string, userId: string): Promise<void>
```

### წესები — Members

**addMember:**
1. User-ის ძებნა email-ით (lowercase)
2. თუ არ მოიძებნება → `NotFoundException` ("User not registered")
   - **მერე V2-ში:** invitation system unregistered users-ისთვის
3. Check: user უკვე არ არის ამ company-ის წევრი (`@@unique([userId, companyId])` constraint, მაგრამ შემოწმე application-level-ზე უკეთესი error-ისთვის → 409 Conflict)
4. Check: target user-ის `role != WORKER` — workers-ი company member-ი ვერ იქნება (semantic constraint)
5. Create CompanyMember

**updateMemberRole:**
1. Find current member
2. **OWNER protection:** თუ ეს ბოლო OWNER-ია და role იცვლება არა-OWNER-ად → `BadRequestException` ("Cannot demote the last owner")
3. Update role

**removeMember:**
1. Find member
2. **OWNER protection:** თუ ეს ბოლო OWNER → `BadRequestException`
3. **Self-removal:** OWNER-ი თავის თავს ვერ ამოაგდებს — `leaveCompany`-ით უნდა გავიდეს
4. Delete CompanyMember

**leaveCompany:**
1. Find current user's membership
2. თუ ბოლო OWNER-ია → `BadRequestException` ("Transfer ownership or deactivate company before leaving")
3. Delete

**listMembers:**
- Sort: OWNER first, then MANAGER, VIEWER. Within role: createdAt ASC
- Include user data (joined)

### 5. `src/company-members/company-members.controller.ts`

| Method | Path | Guard | Min role | Returns |
|--------|------|-------|----------|---------|
| GET    | `/api/companies/:companyId/members` | JWT + CompanyAccess | VIEWER | 200 + Members[] |
| POST   | `/api/companies/:companyId/members` | JWT + CompanyAccess | OWNER | 201 + MemberResponse |
| PATCH  | `/api/companies/:companyId/members/:memberId` | JWT + CompanyAccess | OWNER | 200 + MemberResponse |
| DELETE | `/api/companies/:companyId/members/:memberId` | JWT + CompanyAccess | OWNER | 204 |
| DELETE | `/api/companies/:companyId/members/me` | JWT + CompanyAccess | VIEWER | 204 (leave) |

### 6. `src/companies/companies.controller.ts`

| Method | Path | Guard | Min role | Returns |
|--------|------|-------|----------|---------|
| POST   | `/api/companies` | JWT | (any COMPANY_USER) | 201 + CompanyDetailResponse |
| GET    | `/api/companies/mine` | JWT | - | 200 + CompanyPublicResponse[] |
| GET    | `/api/companies/:companyId` | JWT + CompanyAccess | VIEWER | 200 + CompanyDetailResponse |
| PATCH  | `/api/companies/:companyId` | JWT + CompanyAccess | MANAGER | 200 + CompanyDetailResponse |
| POST   | `/api/companies/:companyId/logo` | JWT + CompanyAccess | MANAGER | 200 + CompanyDetailResponse |
| DELETE | `/api/companies/:companyId/logo` | JWT + CompanyAccess | MANAGER | 200 + CompanyDetailResponse |
| DELETE | `/api/companies/:companyId` | JWT + CompanyAccess | OWNER | 204 (deactivate) |
| GET    | `/api/admin/companies` | JWT + Roles(ADMIN) | - | 200 + Paginated |
| POST   | `/api/admin/companies/:companyId/verify` | JWT + Roles(ADMIN) | - | 200 |
| PATCH  | `/api/admin/companies/:companyId/active` | JWT + Roles(ADMIN) | - | 200 |

### 7. `src/common/guards/company-access.guard.ts` — **ეს ყველაზე მნიშვნელოვანი ფაილია**

```typescript
@Injectable()
export class CompanyAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const companyId = request.params.companyId;

    if (!user || !companyId) {
      throw new UnauthorizedException();
    }

    // ADMIN-ი ნებისმიერ company-ში შედის
    if (user.role === UserRole.ADMIN) {
      request.companyMember = { role: 'OWNER', adminBypass: true };
      return true;
    }

    // Find membership
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: user.id, companyId } },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this company');
    }

    // Check minimum role requirement (if @RequireCompanyRole decorator used)
    const requiredRoles = this.reflector.getAllAndOverride<CompanyMemberRole[]>(
      'companyRoles',
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && !this.satisfiesRole(membership.role, requiredRoles)) {
      throw new ForbiddenException('Insufficient company role');
    }

    // Attach to request for controller access
    request.companyMember = membership;

    return true;
  }

  private satisfiesRole(actual: CompanyMemberRole, required: CompanyMemberRole[]): boolean {
    // Hierarchy: OWNER > MANAGER > VIEWER
    const hierarchy = { OWNER: 3, MANAGER: 2, VIEWER: 1 };
    const minRequired = Math.min(...required.map(r => hierarchy[r]));
    return hierarchy[actual] >= minRequired;
  }
}
```

### 8. `src/common/decorators/require-company-role.decorator.ts`

```typescript
export const RequireCompanyRole = (...roles: CompanyMemberRole[]) =>
  SetMetadata('companyRoles', roles);
```

გამოყენება:
```typescript
@UseGuards(JwtAuthGuard, CompanyAccessGuard)
@RequireCompanyRole(CompanyMemberRole.MANAGER)  // means MANAGER or OWNER
@Patch(':companyId')
async update(...) { ... }
```

### 9. `src/common/decorators/current-membership.decorator.ts`

```typescript
export const CurrentMembership = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().companyMember;
  },
);
```

გამოყენება:
```typescript
async update(
  @Param('companyId') companyId: string,
  @CurrentMembership() membership: CompanyMember,
  @Body() dto: UpdateCompanyDto,
) { ... }
```

### 10. Company-level role-based action matrix

Action matrix რომელიც კოდში სხვადასხვა ადგილზე უნდა იყოს გათვალისწინებული:

| Action                            | OWNER | MANAGER | VIEWER |
|-----------------------------------|-------|---------|--------|
| View company                      | ✅    | ✅      | ✅     |
| Update company info               | ✅    | ✅      | ❌     |
| Upload/remove logo                | ✅    | ✅      | ❌     |
| Deactivate company                | ✅    | ❌      | ❌     |
| Add member                        | ✅    | ❌      | ❌     |
| Change member role                | ✅    | ❌      | ❌     |
| Remove member                     | ✅    | ❌      | ❌     |
| Leave company                     | ✅\*  | ✅      | ✅     |

\* OWNER-ი ვერ გავა თუ ბოლო OWNER-ია

---

## ACCEPTANCE CRITERIA

### Build & startup
```bash
cd apps/flexup-backend
npm run build && npm run lint && npx tsc --noEmit && npm run start:dev
```

### Manual E2E flow

Setup — შექმენი 3 user:
```bash
# Owner
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@test.com","password":"Test1234","firstName":"Owner","lastName":"User","role":"COMPANY_USER"}'
# Save tokens as OWNER_ACCESS, OWNER_REFRESH

# Manager
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@test.com","password":"Test1234","firstName":"Manager","lastName":"User","role":"COMPANY_USER"}'
# Save as MANAGER_ACCESS

# Worker (should NOT be addable as member)
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"worker@test.com","password":"Test1234","firstName":"Worker","lastName":"User","role":"WORKER"}'
# Save as WORKER_ACCESS
```

**1. Create company:**
```bash
curl -X POST http://localhost:3002/api/companies \
  -H "Authorization: Bearer $OWNER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Cafe",
    "legalName": "Test Cafe LLC",
    "registrationNumber": "12345678",
    "defaultCurrency": "GEL"
  }'
# Save company id as COMPANY_ID
```
**Expected:** 201, company created, OWNER member created automatically.

**2. List user's companies:**
```bash
curl http://localhost:3002/api/companies/mine \
  -H "Authorization: Bearer $OWNER_ACCESS"
```
**Expected:** 200, array with one company. `currentUserRole: "OWNER"`.

**3. Get company details:**
```bash
curl http://localhost:3002/api/companies/$COMPANY_ID \
  -H "Authorization: Bearer $OWNER_ACCESS"
```
**Expected:** 200, full details.

**4. Update as VIEWER (forbidden — but first we need to add manager):**

```bash
# Add manager (as OWNER)
curl -X POST http://localhost:3002/api/companies/$COMPANY_ID/members \
  -H "Authorization: Bearer $OWNER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@test.com","role":"MANAGER"}'
```
**Expected:** 201, member added.

**5. Manager can update:**
```bash
curl -X PATCH http://localhost:3002/api/companies/$COMPANY_ID \
  -H "Authorization: Bearer $MANAGER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl":"https://testcafe.ge"}'
```
**Expected:** 200.

**6. Manager cannot add member:**
```bash
curl -X POST http://localhost:3002/api/companies/$COMPANY_ID/members \
  -H "Authorization: Bearer $MANAGER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"email":"someone@test.com","role":"VIEWER"}'
```
**Expected:** 403 Forbidden.

**7. Cannot add WORKER as member:**
```bash
curl -X POST http://localhost:3002/api/companies/$COMPANY_ID/members \
  -H "Authorization: Bearer $OWNER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"email":"worker@test.com","role":"VIEWER"}'
```
**Expected:** 400 Bad Request ("WORKER role users cannot join companies").

**8. Cannot demote last OWNER:**
Add second user as VIEWER, then try to change OWNER's role:
```bash
# Get OWNER's memberId via GET members
curl http://localhost:3002/api/companies/$COMPANY_ID/members \
  -H "Authorization: Bearer $OWNER_ACCESS"
# Find owner's memberId, save as OWNER_MEMBER_ID

curl -X PATCH http://localhost:3002/api/companies/$COMPANY_ID/members/$OWNER_MEMBER_ID \
  -H "Authorization: Bearer $OWNER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"role":"MANAGER"}'
```
**Expected:** 400 ("Cannot demote the last owner").

**9. Non-member cannot access company:**
დაარეგისტრირე ახალი user, შემდეგ:
```bash
curl http://localhost:3002/api/companies/$COMPANY_ID \
  -H "Authorization: Bearer $OUTSIDER_ACCESS"
```
**Expected:** 403 Forbidden ("Not a member of this company").

**10. Non-existent company:**
```bash
curl http://localhost:3002/api/companies/fake_id_12345 \
  -H "Authorization: Bearer $OWNER_ACCESS"
```
**Expected:** 403 (იგივე message — არ ვაცხადებთ company-ის არსებობას non-member-ისთვის).

**11. Upload logo:**
```bash
curl -X POST http://localhost:3002/api/companies/$COMPANY_ID/logo \
  -H "Authorization: Bearer $OWNER_ACCESS" \
  -F "file=@/path/to/logo.png"
```
**Expected:** 200, logoUrl populated.

**12. Leave company (OWNER) — should fail:**
```bash
curl -X DELETE http://localhost:3002/api/companies/$COMPANY_ID/members/me \
  -H "Authorization: Bearer $OWNER_ACCESS"
```
**Expected:** 400 ("Transfer ownership or deactivate company").

**13. Leave company (MANAGER) — should succeed:**
```bash
curl -X DELETE http://localhost:3002/api/companies/$COMPANY_ID/members/me \
  -H "Authorization: Bearer $MANAGER_ACCESS"
```
**Expected:** 204.

**14. Manager has no access after leaving:**
```bash
curl http://localhost:3002/api/companies/$COMPANY_ID \
  -H "Authorization: Bearer $MANAGER_ACCESS"
```
**Expected:** 403.

**15. Deactivate company:**
```bash
curl -X DELETE http://localhost:3002/api/companies/$COMPANY_ID \
  -H "Authorization: Bearer $OWNER_ACCESS"
```
**Expected:** 204. Database: `isActive = false`.

**16. Admin listing:**
შექმენი admin user (SQL-ით):
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@test.com';
```
Login as admin, შემდეგ:
```bash
curl "http://localhost:3002/api/admin/companies?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_ACCESS"
```
**Expected:** 200, paginated.

---

## CONSTRAINTS (წითელი ხაზები)

1. **არ შეცვალო `prisma/schema.prisma`** — Company, CompanyMember საკმარისია
2. **არასოდეს არ ენდო client-supplied `companyId`-ს** ვერიფიკაციის გარეშე — `CompanyAccessGuard` ყოველთვის
3. **არ გამოიყენო User type response-ში** — UserPublicResponse mapper-ით
4. **არ შეცვალო Auth, Users modules** — Phase 1 დასრულდა
5. **არ დაამატო email invitation system** (V2 — unregistered users-ისთვის)
6. **არ დაამატო ownership transfer endpoint** ცალკე — `updateMemberRole`-ით უნდა გაკეთდეს
7. **არ ჩასვა cross-tenant queries** — ყოველი query-ში `companyId` filter მკაცრად
8. **არ გამოიყენო `any`** — explicit types
9. **დიდი action operations transaction-ში** — create company (Company + Member) atomic
10. **Logo upload-ი იგივე pattern Avatar-ისთვის Batch 1.3-დან** — DRY

---

## SECURITY REVIEW — შენი თვითშეფასების ჩამონათვალი

- [ ] ყოველი company-scoped endpoint-ი `CompanyAccessGuard`-ით დაცული
- [ ] `@RequireCompanyRole()` decorator-ი მუშაობს role hierarchy-ით
- [ ] Non-member-ი ვერ ხედავს company-ის arsebobas (403, not 404)
- [ ] Member ვერ აკეთებს permission-ის ზევით operations
- [ ] WORKER-ი ვერ ხდება company member (server-side check)
- [ ] Last owner protection (demote, remove, leave)
- [ ] Logo upload — same validation as avatar (MIME, size, generated filename)
- [ ] Logo files outside web-accessible to other companies (proper path)
- [ ] Admin endpoints require platform `@Roles(ADMIN)` — not CompanyAccessGuard
- [ ] Transactions for atomic operations (create company)

---

## OUT OF SCOPE

- Email invitations for unregistered users (V2)
- Ownership transfer dedicated endpoint (ცალკე V2)
- Audit log of member changes (მერე)
- Company branding (colors, themes) (Phase 3+)
- Subscription/billing per company (Phase 4+)
- Company verification document upload (manual ADMIN ჯერ)
- Multi-language company names (V2)
- Company switcher state management (frontend concern)

---

## ADR-ი

`docs/ARCHITECTURE.md`-ში დაამატე:

**ADR-019: CompanyAccessGuard with role hierarchy**
- Decision: numeric hierarchy (OWNER=3, MANAGER=2, VIEWER=1), `@RequireCompanyRole(MANAGER)` matches MANAGER+
- Reason: simpler than explicit lists, intuitive

**ADR-020: Non-member returns 403, not 404**
- Decision: don't leak company existence
- Reason: prevent company enumeration attacks

**ADR-021: Last owner protection in service layer**
- Decision: business rule in CompanyMembersService, not DB constraint
- Reason: Prisma can't express this; transaction-safe count check before mutation

**ADR-022: ADMIN bypass in CompanyAccessGuard**
- Decision: ADMIN-ი ნებისმიერ company-ში ხედავს და მართავს
- Reason: platform-level support; logged via audit log (მერე)

---

## დასასრულს

- ყველა 16 acceptance criterion უნდა გავიდეს
- Security review checklist სრულად
- ADR-ები ჩაწერილი
- Commit message: `feat: companies + multi-tenant access control (batch 2.1)`

Phase 2-ის foundation დასრულდა. შემდეგი — Locations.

თუ session ბოლომდე მიდის, handoff skill-ით → `docs/handoffs/HANDOFF_batch_2_1_<MM_DD>.md`.

---

## თუ რაიმე გადაწყვეტილების დაფიქსირება სჭირდება — **შემაჩერე**

განსაკუთრებით:
- სანამ approach-ი ხელახლა გაიდე multi-tenant-ისთვის
- სანამ რომელიმე action matrix-ის წესს დაარღვევ
- სანამ `CompanyAccessGuard`-ის ლოგიკას შეცვლი
