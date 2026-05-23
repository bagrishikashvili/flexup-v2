# Task Batch 1.2 — Authentication

## ⚠ პირველი ნაბიჯი — წაიკითხე ეს ფაილები

წინასწარ წაიკითხე და დაიცავი:
1. `CLAUDE.md` (root-ში) — პროექტის constitution
2. `docs/ARCHITECTURE.md` — გადაწყვეტილებები (განსაკუთრებით ADR-004 JWT-ზე)
3. `apps/flexup-backend/prisma/schema.prisma` — User და RefreshToken მოდელები
4. Batch 1.1-ის შედეგი — `src/config/`, `src/prisma/`, `src/common/` უკვე არსებობს

თუ რომელიმე ფაილში ჩაწერილს ეწინააღმდეგება შენი იდეა — **შემაჩერე და მკითხე**.

---

## INPUT (კონტექსტი)

რა გვაქვს უკვე (Batch 1.1-დან):
- ConfigService (typed env access)
- PrismaService (global)
- RedisService (global)
- Global exception filters
- Validation pipe (whitelist, transform)
- `@Public()` decorator (metadata setter)
- Health endpoint
- `@/...` path aliases

რა გვაკლია (ამ batch-ში):
- Authentication infrastructure (register, login, refresh, logout)
- JWT strategy + Guards
- Password hashing
- Multi-tenant context helpers

**მნიშვნელოვანი:** User-ის profile management **ამ batch-ში არ კეთდება** — ეს Batch 1.3-ის task-ია. აქ მხოლოდ Auth-ი.

---

## GOAL

ააშენე სრული authentication system, რომელიც მუშაობს **access + refresh token** strategy-ით. End-to-end flow უნდა იყოს მუშა — register, login, refresh, logout.

### კონკრეტული deliverables

**1. `src/auth/auth.module.ts`**
- Imports: PrismaModule (უკვე global-ია), ConfigModule, JwtModule (async, configservice-ით)
- Providers: AuthService, JwtStrategy, JwtAuthGuard, RolesGuard
- Exports: JwtAuthGuard, RolesGuard (სხვა module-ებში გამოყენებისთვის)

**2. Dependencies რომ უნდა დაამატო (ჯერ შემაჩერე და მკითხე):**
- `@nestjs/jwt` — JWT module
- `@nestjs/passport` — Passport integration
- `passport` — base
- `passport-jwt` — JWT strategy
- `@types/passport-jwt` — dev
- `bcryptjs` — **უკვე გვაქვს** package.json-ში
- `@types/bcryptjs` — dev (თუ არ გვაქვს)

**3. `src/auth/dto/`**

`register.dto.ts`:
```typescript
{
  email: string;          // valid email
  phoneNumber?: string;   // optional, E.164 format if provided
  password: string;       // min 8 chars, must include letter + number
  firstName: string;      // min 1, max 100
  lastName: string;       // min 1, max 100
  role: 'WORKER' | 'COMPANY_USER';  // ADMIN არ ეშვება registration-ით
}
```

`login.dto.ts`:
```typescript
{
  email: string;
  password: string;
}
```

`refresh.dto.ts`:
```typescript
{
  refreshToken: string;
}
```

ყველა field — class-validator decorators-ით (`@IsEmail`, `@IsString`, `@MinLength`, `@Matches`, `@IsEnum`).

**4. `src/auth/auth.service.ts`**

მეთოდები:

```typescript
async register(dto: RegisterDto, meta: RequestMeta): Promise<AuthTokensResponse>
async login(dto: LoginDto, meta: RequestMeta): Promise<AuthTokensResponse>
async refresh(dto: RefreshDto, meta: RequestMeta): Promise<AuthTokensResponse>
async logout(userId: string): Promise<void>
async logoutAllSessions(userId: string): Promise<void>
async validateUser(userId: string): Promise<User | null>  // JwtStrategy-სთვის
```

`RequestMeta` შეიცავს `userAgent: string | undefined, ipAddress: string | undefined`.

`AuthTokensResponse`:
```typescript
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}
```

### წესები (კრიტიკული)

**Password hashing:**
- bcrypt, 12 rounds
- შენახვა `User.passwordHash`-ში
- **არასოდეს არ აბრუნებ password-ს ან hash-ს API response-ში**

**Access token:**
- JWT, signed `JWT_ACCESS_SECRET`-ით
- Payload: `{ sub: userId, role: UserRole, iat, exp }`
- TTL: `JWT_ACCESS_TTL_SECONDS` (default 900 = 15 წუთი)
- Stateless — DB-ში არ ვინახავთ

**Refresh token:**
- Cryptographically random 64-byte hex string (gen-ი: `crypto.randomBytes(64).toString('hex')`)
- **არასოდეს JWT** — უბრალო random string
- DB-ში ვინახავთ **მხოლოდ SHA-256 hash-ს** (`RefreshToken.tokenHash`)
- Raw token მხოლოდ client-თან
- TTL: `JWT_REFRESH_TTL_SECONDS` (default 30 დღე)
- შენახული მონაცემები: userId, tokenHash, expiresAt, userAgent, ipAddress

**Refresh token rotation:**
- როცა refresh-ი მოვა, ძველი token revoke-დება (`revokedAt = now()`)
- ახალი refresh issue-დება ერთდროულად ახალ access-თან
- **გადამოწმდეს რომ token არ არის უკვე revoked** — თუ revoked-ი არის, **შეცდომაა და ყველა session უნდა revoke-დეს** (ეს reuse attack-ის ნიშანია)

**Register flow:**
1. Email-ის unique-ობის შემოწმება (case-insensitive — Prisma დაუმუშავოს მაგ., email lowercase-ად შენახული)
2. Phone number, თუ მითითებულია — unique check
3. Password hash (bcrypt 12)
4. User insert
5. Token pair გენერაცია
6. `lastLoginAt` update
7. Return tokens + user (passwordHash გარეშე)

**Login flow:**
1. User-ის ძებნა email-ით (lowercase)
2. თუ არ მოიძებნება — `UnauthorizedException` **არ თქვა "user not found"** (information leak)
3. `bcrypt.compare` password-ის
4. თუ არ ემთხვევა — `UnauthorizedException` **იგივე message** ("invalid credentials")
5. თუ `!user.isActive` — `UnauthorizedException`
6. Token pair generation
7. `lastLoginAt` update
8. Return tokens + user

**Refresh flow:**
1. Raw token-ის hash-ი გამოთვალე
2. DB-ში ძებნა tokenHash-ით
3. თუ არ მოიძებნება — `UnauthorizedException`
4. თუ `revokedAt != null` — **reuse attack**: revoke ALL user-ის refresh tokens (და return `UnauthorizedException`)
5. თუ `expiresAt < now()` — `UnauthorizedException`
6. ძველი token revoke
7. ახალი refresh + access გენერაცია
8. `User.isActive` check (ცვალებადობს login-ის შემდეგ)
9. Return new pair

**Logout:**
- მხოლოდ მიმდინარე refresh token revoke-დება (თუ მოცემულია body-ში)
- სხვა sessions აქტიური რჩება

**Logout all sessions:**
- ყველა non-revoked refresh token user-ის revoke

**5. `src/auth/auth.controller.ts`**

Endpoints (all `@Public()` გარდა `logout`-ისა):

| Method | Path | Public | DTO | Returns |
|--------|------|--------|-----|---------|
| POST   | `/api/auth/register` | ✅ | RegisterDto | 201 + AuthTokensResponse |
| POST   | `/api/auth/login` | ✅ | LoginDto | 200 + AuthTokensResponse |
| POST   | `/api/auth/refresh` | ✅ | RefreshDto | 200 + AuthTokensResponse |
| POST   | `/api/auth/logout` | ❌ (auth required) | RefreshDto | 204 |
| POST   | `/api/auth/logout-all` | ❌ (auth required) | - | 204 |
| GET    | `/api/auth/me` | ❌ (auth required) | - | 200 + UserPublic |

**`RequestMeta` extraction** — საერთო decorator-ი ან inline:
```typescript
@Req() req: Request
const meta = { 
  userAgent: req.headers['user-agent'], 
  ipAddress: req.ip 
};
```

**6. `src/auth/strategies/jwt.strategy.ts`**

```typescript
class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwt.accessSecret,
    });
  }

  async validate(payload: JwtPayload) {
    // payload: { sub: userId, role, iat, exp }
    // აქ ვამოწმებთ რომ user ჯერ კიდევ active-ია
    // უბრუნებთ user object-ს (passwordHash გარეშე)
    // ეს ხდება request.user-ად
  }
}
```

**მნიშვნელოვანი:** `validate`-ი ყოველ request-ზე იძახება. ეს DB hit-ია. **გადაწყვეტილება:** ჯერ ვაკეთებთ მარტივად (DB query ყოველ request-ზე), მერე ვამატებთ Redis cache-ს. ცალკე ADR ჩაწერე ამის შესახებ.

**7. `src/auth/guards/jwt-auth.guard.ts`**

```typescript
@Injectable()
class JwtAuthGuard extends AuthGuard('jwt') {
  // canActivate override-ი ისე, რომ @Public() decorator-ით endpoints გვერდი ვუხვიოთ
  // Reflector-ით ვამოწმებთ `isPublic` metadata-ს
}
```

**Global-ად registered** in `app.module.ts`:
```typescript
{ provide: APP_GUARD, useClass: JwtAuthGuard }
```

ეს ნიშნავს რომ **ყველა endpoint default-ად დაცულია**. ხელით უნდა `@Public()` დაუყაროთ.

**8. `src/auth/guards/roles.guard.ts`**

```typescript
@Injectable()
class RolesGuard implements CanActivate {
  // @Roles('ADMIN', 'COMPANY_USER') decorator-ით მითითებული roles-ი
  // request.user.role-ი თუ შედის — pass
}
```

`@Roles()` decorator-ი `src/common/decorators/roles.decorator.ts`-ში.

**9. `src/auth/decorators/current-user.decorator.ts`**

```typescript
const CurrentUser = createParamDecorator((data, ctx) => {
  return ctx.switchToHttp().getRequest().user;
});
```

გამოყენება:
```typescript
@Get('me')
async me(@CurrentUser() user: User) { ... }
```

**10. `src/common/decorators/roles.decorator.ts`**

```typescript
const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
```

**11. Type definitions — `src/auth/types/`**

`jwt-payload.interface.ts`:
```typescript
interface JwtPayload {
  sub: string;     // userId
  role: UserRole;
  iat: number;
  exp: number;
}
```

`auth-tokens.response.ts` — return type-ი.

**12. `src/users/users.module.ts` — minimal stub**

⚠ **ნუ ააშენებ users module-ის სრულ ფუნქციონალს — ეს Batch 1.3-ის task-ია.**

მაგრამ AuthService-ს დასჭირდება User-ის ძებნა/შექმნა. ორი ვარიანტი:
- **A:** PrismaService პირდაპირ AuthService-ში
- **B:** UsersService minimal — `findByEmail`, `findById`, `create`

ვირჩევთ **B**-ს, რადგან Batch 1.3-ში გავაფართოვებთ. ააშენე **მინიმალური UsersService** მხოლოდ ამ მეთოდებით:
```typescript
findById(id: string): Promise<User | null>
findByEmail(email: string): Promise<User | null>
findByPhone(phone: string): Promise<User | null>
create(data: CreateUserData): Promise<User>
updateLastLogin(id: string): Promise<void>
```

`UsersModule` exports UsersService, AuthModule imports UsersModule.

---

## ACCEPTANCE CRITERIA

### Build & startup
```bash
cd apps/flexup-backend
npm run build        # passes
npm run start:dev    # starts without errors
npm run lint         # passes
npx tsc --noEmit     # passes
```

### Manual E2E flow (curl-ით)

**1. Register:**
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "firstName": "Giorgi",
    "lastName": "Beridze",
    "role": "COMPANY_USER"
  }'
```
**Expected:** 201, body შეიცავს `accessToken`, `refreshToken`, `user`.

**2. Login:**
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```
**Expected:** 200, ახალი tokens.

**3. Wrong password:**
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"WRONG"}'
```
**Expected:** 401, message "Invalid credentials" (იგივე როგორც non-existent user-ისთვის).

**4. Authenticated request:**
```bash
ACCESS=<paste access token>
curl http://localhost:3002/api/auth/me \
  -H "Authorization: Bearer $ACCESS"
```
**Expected:** 200, user object (passwordHash გარეშე).

**5. Refresh:**
```bash
REFRESH=<paste refresh token>
curl -X POST http://localhost:3002/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}"
```
**Expected:** 200, ახალი tokens. ძველი refresh უკვე revoked.

**6. Refresh reuse (security test):**
ხელახლა გაუშვი step 5-ის ბრძანება იგივე ძველი refresh-ით.
**Expected:** 401. DB-ში user-ის ყველა refresh token revoke-დება.

**7. Duplicate email:**
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "firstName": "X",
    "lastName": "Y",
    "role": "WORKER"
  }'
```
**Expected:** 409 Conflict.

**8. Validation error:**
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"short"}'
```
**Expected:** 400, message includes validation errors.

**9. Public route (no auth):**
```bash
curl http://localhost:3002/api/health
```
**Expected:** 200 (Health არ მოითხოვს auth-ს, რადგან `@Public()` უნდა ჰქონდეს).

**10. Protected route without token:**
```bash
curl http://localhost:3002/api/auth/me
```
**Expected:** 401.

---

## CONSTRAINTS (წითელი ხაზები)

1. **არ შეცვალო `prisma/schema.prisma`** — User და RefreshToken უკვე სრულია
2. **არ შეცვალო `docker-compose.yml`**
3. **არ დაამატო dependencies რომ არ მკითხო ჯერ** — განსაკუთრებით:
   - სხვა Auth library (Better-Auth, Lucia, Auth.js) — გვაქვს NestJS native approach
   - სხვა hashing library (argon2) — bcrypt გვაქვს
   - სხვა JWT library — `@nestjs/jwt` მხოლოდ
4. **არასოდეს არ აბრუნებ `passwordHash`-ს** response-ში — Prisma select-ი ან DTO mapping
5. **არასოდეს raw refresh token DB-ში** — მხოლოდ SHA-256 hash
6. **არ გამოიყენო `any`** — explicit types
7. **არ ჩასვა business logic controller-ში** — controller მხოლოდ delegation
8. **არ შექმნა User profile management** — ეს Batch 1.3
9. **არ შექმნა Email verification / OTP / Forgot password** — V2 feature
10. **არ შექმნა Rate limiting** — მერე დავამატებთ ცალკე batch-ში
11. **`@Public()` decorator-ი მუშაობს რეფლექტორით** — `JwtAuthGuard`-ში `reflector.getAllAndOverride`-ით ამოწმე

---

## SECURITY REVIEW — შენი თვითშეფასების ჩამონათვალი

სანამ task-ი დასრულდა გამოაცხადო, შენ თვითონ შეამოწმე:

- [ ] `passwordHash` არ ჩანს არც ერთ response-ში (`SELECT`-ი ისეა)
- [ ] Raw refresh token არ ინახება DB-ში (მხოლოდ hash)
- [ ] Refresh token rotation მუშაობს (ძველი revoke-დება ახლის გენერაციისას)
- [ ] Refresh reuse triggers full session revoke
- [ ] Login error messages **identical** for "no user" vs "wrong password"
- [ ] `JWT_ACCESS_SECRET != JWT_REFRESH_SECRET` (config-ში cross-check)
- [ ] bcrypt rounds = 12
- [ ] Access token TTL ≤ 15 წუთი default-ად
- [ ] Email lowercase-ად ინახება (case-insensitive lookup)
- [ ] `@Public()` decorator მუშაობს — health endpoint accessible without token
- [ ] Protected endpoint without token → 401
- [ ] `User.isActive: false` → cannot login, refresh

---

## OUT OF SCOPE (ამ batch-ში არ კეთდება)

- Email verification (V2)
- Phone OTP / SMS verification (V2)
- Forgot password / password reset (V2)
- 2FA / TOTP (V2)
- OAuth (Google, Apple) (V2)
- Rate limiting (ცალკე batch)
- Full Users module (CRUD, profile update) — Batch 1.3
- Company creation flow — Phase 2
- Worker profile creation — Phase 3

---

## ADR-ი — დააფიქსირე გადაწყვეტილებები

`docs/ARCHITECTURE.md`-ში დაამატე:

**ADR-011: Refresh token storage strategy**
- გადაწყვეტილება: SHA-256 hash DB-ში, raw client-თან
- მიზეზი: DB breach-ის შემთხვევაში tokens უსარგებლო

**ADR-012: Refresh token rotation + reuse detection**
- გადაწყვეტილება: ერთჯერადი refresh, reuse → revoke all
- მიზეზი: stolen token detection

**ADR-013: JwtStrategy.validate DB query per request**
- გადაწყვეტილება: DB hit ყოველ request-ზე (ჯერჯერობით)
- მომავალი: Redis cache user object-ისთვის, TTL 60 წამი
- მიზეზი: simplicity first, optimize when needed

**ADR-014: Global JwtAuthGuard + `@Public()` opt-out**
- გადაწყვეტილება: default-secure
- მიზეზი: დავიწყება risky — `@Public()` ცხადი ნიშანია

---

## დასასრულს

- ყველა acceptance criterion უნდა გავიდეს
- Security review checklist სრულად
- Commit message: `feat: authentication (batch 1.2)`
- ADR-ები ჩაწერილი

თუ session ბოლომდე მიდის, გამოიყენე handoff skill და შექმენი `docs/handoffs/HANDOFF_batch_1_2_<MM_DD>.md`.

---

## თუ რაიმე გადაწყვეტილების დაფიქსირება სჭირდება — **შემაჩერე**

განსაკუთრებით:
- სანამ `npm install` გაუშვებ (dependencies დადასტურება)
- სანამ approach-ი ხელახლა გაიდე (მაგ., როგორ aprache `@Public()`-ის გვერდი)
- სანამ რომელიმე constraint-ი დარღვევას აპირებ
