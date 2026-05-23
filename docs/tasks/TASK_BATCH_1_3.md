# Task Batch 1.3 — Users Module (Profile Management)

## ⚠ პირველი ნაბიჯი — წაიკითხე ეს ფაილები

წინასწარ წაიკითხე და დაიცავი:
1. `CLAUDE.md` (root-ში) — პროექტის constitution
2. `docs/ARCHITECTURE.md` — გადაწყვეტილებები
3. `apps/flexup-backend/prisma/schema.prisma` — User model
4. Batch 1.1-ის შედეგი — `src/config/`, `src/prisma/`, `src/common/`, `src/health/`
5. Batch 1.2-ის შედეგი — `src/auth/`, minimal `src/users/users.service.ts`

თუ რომელიმე ფაილში ჩაწერილს ეწინააღმდეგება შენი იდეა — **შემაჩერე და მკითხე**.

---

## INPUT (კონტექსტი)

რა გვაქვს უკვე (Batch 1.2-დან):
- სრული Auth flow (register, login, refresh, logout)
- JWT strategy + Guards (`JwtAuthGuard` global)
- `@Public()`, `@CurrentUser()`, `@Roles()` decorators
- **Minimal UsersService** — findById, findByEmail, findByPhone, create, updateLastLogin

რა გვაკლია (ამ batch-ში):
- სრული User profile management
- Avatar upload (sharp-ით resize)
- Email/phone change flow
- Password change
- Soft delete (deactivate account)
- Admin-level user listing (basic)

---

## GOAL

გააფართოვე `UsersService` და ააშენე `UsersController` სრული profile management-ისთვის. ყველაფერი rest-ფული, type-safe, secure.

### კონკრეტული deliverables

**1. `src/users/dto/`**

`update-profile.dto.ts`:
```typescript
{
  firstName?: string;     // min 1, max 100
  lastName?: string;      // min 1, max 100
}
```
ყველა field optional — partial update.

`change-password.dto.ts`:
```typescript
{
  currentPassword: string;
  newPassword: string;    // იგივე rules რომ register-ში (min 8, letter + number)
}
```

`change-email.dto.ts`:
```typescript
{
  currentPassword: string;  // confirmation
  newEmail: string;         // valid email
}
```

`change-phone.dto.ts`:
```typescript
{
  currentPassword: string;
  newPhoneNumber: string;   // E.164 format
}
```

`user-public.response.ts` — Prisma User-ის safe projection:
```typescript
{
  id: string;
  email: string;
  phoneNumber: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**არასოდეს** `passwordHash`, `refreshTokens`, ან სხვა sensitive fields.

`user-list-query.dto.ts` (Admin-ისთვის):
```typescript
{
  page?: number = 1;       // min 1
  limit?: number = 20;     // min 1, max 100
  role?: UserRole;         // filter
  search?: string;         // ძებნა email/firstName/lastName-ით
  isActive?: boolean;      // filter
}
```

**2. `src/users/users.service.ts` — გაფართოება**

გააფართოვე არსებული service. დაამატე:

```typescript
// Profile management
async getProfile(userId: string): Promise<UserPublicResponse>
async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserPublicResponse>

// Sensitive changes (require password)
async changePassword(userId: string, dto: ChangePasswordDto): Promise<void>
async changeEmail(userId: string, dto: ChangeEmailDto): Promise<UserPublicResponse>
async changePhone(userId: string, dto: ChangePhoneDto): Promise<UserPublicResponse>

// Avatar
async uploadAvatar(userId: string, file: Express.Multer.File): Promise<UserPublicResponse>
async removeAvatar(userId: string): Promise<UserPublicResponse>

// Account lifecycle
async deactivateAccount(userId: string, password: string): Promise<void>

// Admin
async listUsers(query: UserListQueryDto): Promise<PaginatedResponse<UserPublicResponse>>
async getUserById(id: string): Promise<UserPublicResponse>  // admin only
async setUserActive(id: string, isActive: boolean): Promise<UserPublicResponse>  // admin only
```

### წესები — service layer

**Password verification (changePassword/changeEmail/changePhone/deactivate):**
- bcrypt.compare-ი `currentPassword` vs `user.passwordHash`
- თუ არ ემთხვევა → `UnauthorizedException` ("Invalid current password")
- მხოლოდ მერე გადადი ცვლილებაზე

**Change password:**
1. Verify current password
2. Hash new password (bcrypt 12)
3. Update `passwordHash`
4. **გადააფერხე ყველა refresh token** (logout from all devices) — `RefreshToken.revokedAt = now()` where userId
5. **არ აბრუნებ ახალ tokens-ს** — user-ი ხელახლა უნდა შევიდეს (security best practice)

**Change email:**
1. Verify current password
2. Check uniqueness (new email lowercase, current user-ის გარდა)
3. Update email, set `emailVerified: false` (verification flow მერე)
4. Return updated user

**Change phone:**
1. Verify current password
2. Validate E.164 format (`@IsPhoneNumber()` from class-validator)
3. Check uniqueness
4. Update phoneNumber, set `phoneVerified: false`
5. Return updated user

**Avatar upload:**
- Multer-ით (უკვე dependencies-შია) — `memoryStorage`
- Validation:
  - MIME type: `image/jpeg`, `image/png`, `image/webp` only
  - Max size: 5 MB
- Sharp-ით (უკვე dependencies-შია) processing:
  - Resize to max 512×512 (preserve aspect ratio, fit: inside)
  - Convert to WebP, quality 85
  - Output buffer
- Storage:
  - **MVP:** local filesystem, `apps/flexup-backend/uploads/avatars/<userId>-<timestamp>.webp`
  - **მომავალში:** S3/R2 — ცალკე ADR ჩაწერე ამის შესახებ
- ძველი avatar წაშალე disk-დან, თუ არსებობდა
- Update `User.avatarUrl` — relative path ან full URL config-ით (`UPLOADS_BASE_URL`)

**Remove avatar:**
- წაშალე ფაილი disk-დან
- Update `User.avatarUrl = null`

**Deactivate account:**
1. Verify password
2. Update `User.isActive = false`
3. Revoke all refresh tokens
4. **არ ვშლით** მონაცემებს — soft delete-ი via `isActive` flag
5. Return 204

**List users (Admin):**
- Pagination: `{ data: User[], meta: { page, limit, total } }`
- Search: case-insensitive ILIKE-ით email/firstName/lastName-ზე
- Sort: `createdAt DESC` default
- Filter: role, isActive

**3. `src/users/users.controller.ts`**

| Method | Path | Guard | DTO | Returns |
|--------|------|-------|-----|---------|
| GET    | `/api/users/me` | JWT | - | 200 + UserPublicResponse |
| PATCH  | `/api/users/me` | JWT | UpdateProfileDto | 200 + UserPublicResponse |
| POST   | `/api/users/me/avatar` | JWT | multipart/form-data (`file`) | 200 + UserPublicResponse |
| DELETE | `/api/users/me/avatar` | JWT | - | 200 + UserPublicResponse |
| POST   | `/api/users/me/change-password` | JWT | ChangePasswordDto | 204 |
| POST   | `/api/users/me/change-email` | JWT | ChangeEmailDto | 200 + UserPublicResponse |
| POST   | `/api/users/me/change-phone` | JWT | ChangePhoneDto | 200 + UserPublicResponse |
| DELETE | `/api/users/me` | JWT | `{ password: string }` | 204 |
| GET    | `/api/users` | JWT + Roles(ADMIN) | UserListQueryDto (query) | 200 + Paginated |
| GET    | `/api/users/:id` | JWT + Roles(ADMIN) | - | 200 + UserPublicResponse |
| PATCH  | `/api/users/:id/active` | JWT + Roles(ADMIN) | `{ isActive: boolean }` | 200 + UserPublicResponse |

**Static files serving** — avatar URLs-ის ხელმისაწვდომობისთვის:
- NestJS-ში `ServeStaticModule` (თუ უკვე dependency-შია — დაამატე თუ არა, **მკითხე ჯერ**)
- Path: `/api/uploads/*` → `apps/flexup-backend/uploads/*`
- Alternative: nginx-ი production-ში (ADR ჩაწერე)

**4. `src/users/users.module.ts`**

Imports: PrismaModule (global, არ სჭირდება ცხადი import), MulterModule (file upload-ისთვის)
Providers: UsersService
Controllers: UsersController
Exports: UsersService (Auth-მა გამოიყენოს)

**5. `src/common/types/paginated.response.ts`**

Generic type რომელიც სხვა module-ებშიც გამოვიყენებთ:
```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**6. Mapper utility — `src/users/users.mapper.ts`**

```typescript
function toUserPublic(user: User): UserPublicResponse
```

ცენტრალური ფუნქცია რომელიც Prisma User-ს safe DTO-დ აქცევს. ყველგან გამოიყენე ეს — **არასოდეს Prisma User პირდაპირ controller-ში**.

**7. Config დამატება**

`.env.example`-ში:
```
UPLOADS_DIR=./uploads
UPLOADS_BASE_URL=http://localhost:3002/api/uploads
MAX_UPLOAD_SIZE_BYTES=5242880
```

`ConfigService`-ში typed access დაამატე.

`.gitignore`-ში:
```
apps/flexup-backend/uploads/
```

---

## ACCEPTANCE CRITERIA

### Build & startup
```bash
cd apps/flexup-backend
npm run build
npm run start:dev
npm run lint
npx tsc --noEmit
```

### Manual E2E flow

Setup — login რომ access token მივიღოთ:
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "Test1234",
    "firstName": "Alice",
    "lastName": "Smith",
    "role": "COMPANY_USER"
  }'

# Save access token
ACCESS=<paste>
```

**1. Get profile:**
```bash
curl http://localhost:3002/api/users/me \
  -H "Authorization: Bearer $ACCESS"
```
**Expected:** 200, UserPublicResponse (no passwordHash).

**2. Update profile:**
```bash
curl -X PATCH http://localhost:3002/api/users/me \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Alicia"}'
```
**Expected:** 200, firstName: "Alicia".

**3. Avatar upload:**
```bash
curl -X POST http://localhost:3002/api/users/me/avatar \
  -H "Authorization: Bearer $ACCESS" \
  -F "file=@/path/to/photo.jpg"
```
**Expected:** 200, avatarUrl populated. ფაილი uploads/avatars/-ში არსებობს WebP-ად, ≤512×512.

**4. Avatar URL accessible:**
```bash
curl http://localhost:3002/api/uploads/avatars/<filename>.webp -o test.webp
file test.webp  # უნდა იყოს RIFF/WebP
```

**5. Big file rejected:**
```bash
# 10MB file
dd if=/dev/urandom of=big.jpg bs=1M count=10
curl -X POST http://localhost:3002/api/users/me/avatar \
  -H "Authorization: Bearer $ACCESS" \
  -F "file=@big.jpg"
```
**Expected:** 413 ან 400.

**6. Wrong MIME type rejected:**
```bash
echo "not an image" > fake.txt
curl -X POST http://localhost:3002/api/users/me/avatar \
  -H "Authorization: Bearer $ACCESS" \
  -F "file=@fake.txt"
```
**Expected:** 400.

**7. Change password (wrong current):**
```bash
curl -X POST http://localhost:3002/api/users/me/change-password \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"WRONG","newPassword":"NewPass123"}'
```
**Expected:** 401.

**8. Change password (correct):**
```bash
curl -X POST http://localhost:3002/api/users/me/change-password \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Test1234","newPassword":"NewPass123"}'
```
**Expected:** 204. ბაზაში: ყველა refresh token revoke-დება.

**9. ძველი access token არ მუშაობს ცვლილებების შემდეგ?**
**მაგრამ:** access token JWT-ია, stateless — ის TTL-მდე იმუშავებს. ეს expected ქცევაა, არ არის bug. Refresh tokens revoke-დება.

**10. Login with new password:**
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"NewPass123"}'
```
**Expected:** 200.

**11. Change email (duplicate):**

დაარეგისტრირე მეორე user `bob@example.com`-ით, შემდეგ:
```bash
curl -X POST http://localhost:3002/api/users/me/change-email \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"NewPass123","newEmail":"bob@example.com"}'
```
**Expected:** 409 Conflict.

**12. Deactivate account:**
```bash
curl -X DELETE http://localhost:3002/api/users/me \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"password":"NewPass123"}'
```
**Expected:** 204.

**13. Cannot login after deactivation:**
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"NewPass123"}'
```
**Expected:** 401.

**14. Admin listing (requires ADMIN user):**

ბაზაში ხელით შექმენი ADMIN user (ან seed-ით):
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@flexup.local';
```

Login as admin, შემდეგ:
```bash
curl "http://localhost:3002/api/users?page=1&limit=10&search=alice" \
  -H "Authorization: Bearer $ADMIN_ACCESS"
```
**Expected:** 200, pagination meta, data array.

**15. Non-admin cannot list users:**
```bash
curl http://localhost:3002/api/users \
  -H "Authorization: Bearer $ACCESS"
```
**Expected:** 403 Forbidden.

---

## CONSTRAINTS (წითელი ხაზები)

1. **არ შეცვალო `prisma/schema.prisma`** — User model საკმარისია
2. **არ შეცვალო Auth module** — Batch 1.2-ში დასრულდა
3. **არ დაამატო dependencies რომ არ მკითხო ჯერ** — განსაკუთრებით:
   - სხვა file storage library (multer-ი გვაქვს)
   - სხვა image processing (sharp-ი გვაქვს)
   - სხვა cloud SDK (S3, Cloudinary) — local storage MVP-ში
4. **არასოდეს Prisma User type controller response-ში** — მხოლოდ `toUserPublic()` mapper-ით
5. **Sensitive operations (password, email, phone change, deactivate)** აუცილებლად მოითხოვს current password verification
6. **Password change → revoke all refresh tokens** — security requirement
7. **Avatar files outside git** — `.gitignore`-ში დაამატე
8. **არ გამოიყენო `any`** — explicit types
9. **არასოდეს `passwordHash` response-ში** — mapper layer enforces ამას
10. **Email lowercase ყოველთვის** — application-level (consistent Batch 1.2-თან)
11. **Avatar URL relative ან absolute** — config-ით (`UPLOADS_BASE_URL`) — production-ში CDN-ი იოლად შეიცვლება

---

## SECURITY REVIEW — შენი თვითშეფასების ჩამონათვალი

- [ ] `passwordHash` არ ჩანს არც ერთ response-ში (mapper enforces)
- [ ] Sensitive changes require current password
- [ ] Password change revokes all refresh tokens
- [ ] Avatar uploads validated (MIME, size)
- [ ] Avatar file path არ მისცემს access-ს სხვა user-ის ფაილზე (path traversal prevention)
- [ ] Filename-ი — generated, არასოდეს user-supplied
- [ ] Admin endpoints require `@Roles(UserRole.ADMIN)` + RolesGuard
- [ ] Deactivated user cannot login (Batch 1.2-ის login check ჯერ კიდევ მუშაობს)
- [ ] Email duplicate check case-insensitive
- [ ] Phone duplicate check (when phone provided)

---

## OUT OF SCOPE (ამ batch-ში არ კეთდება)

- Email verification (V2 — verification token send)
- Phone OTP (V2)
- Password reset / forgot password (V2)
- 2FA (V2)
- S3/R2 storage (V2 — local-ი MVP-ში)
- CDN integration (V2)
- WorkerProfile management (Phase 3)
- Company-related endpoints (Phase 2)
- Audit log of profile changes (მერე)
- Admin user creation flow (manual SQL-ით ჯერ, UI მერე)

---

## ADR-ი — დააფიქსირე გადაწყვეტილებები

`docs/ARCHITECTURE.md`-ში დაამატე:

**ADR-015: Avatar storage — local filesystem MVP**
- გადაწყვეტილება: local disk, `uploads/avatars/`
- მომავალი: S3/R2 migration ცალკე task-ით (env-driven storage strategy)
- მიზეზი: MVP simplicity, single-instance deployment

**ADR-016: Password change revokes all sessions**
- გადაწყვეტილება: ყველა refresh token revoke
- მიზეზი: stolen credentials → password reset → ყველა stolen session უსარგებლო

**ADR-017: Email/phone change doesn't revoke sessions**
- გადაწყვეტილება: tokens valid რჩება email-ის შეცვლის შემდეგაც
- მიზეზი: less disruptive UX
- Trade-off: თუ attacker-მა შეცვალა email, ვერ მართავს tokens-ს, მაგრამ user-ის original tokens valid რჩება
- Mitigation: მერე ცალკე "active sessions" view, manual revoke

**ADR-018: Soft delete via `isActive` flag**
- გადაწყვეტილება: მონაცემები რჩება, login blocked
- მომავალი: GDPR right-to-erasure separate task

---

## დასასრულს

- ყველა acceptance criterion უნდა გავიდეს
- Security review checklist სრულად
- ADR-ები ჩაწერილი
- Commit message: `feat: users module — profile management (batch 1.3)`

Phase 1 დასრულდა! 🎉 შემდეგი — Phase 2: Companies, Locations, Shifts.

თუ session ბოლომდე მიდის, გამოიყენე handoff skill და შექმენი `docs/handoffs/HANDOFF_batch_1_3_<MM_DD>.md`.

---

## თუ რაიმე გადაწყვეტილების დაფიქსირება სჭირდება — **შემაჩერე**

განსაკუთრებით:
- სანამ `npm install` გაუშვებ (dependencies დადასტურება — `@nestjs/serve-static`?)
- სანამ approach-ი ხელახლა გაიდე
- სანამ რომელიმე constraint-ი დარღვევას აპირებ
