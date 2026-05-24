# Mini-Batch 2.Y — Backend Cookies for Refresh Tokens

## ⚠ პირველი ნაბიჯი — წაიკითხე ეს ფაილები

1. `CLAUDE.md` (root-ში)
2. `docs/ARCHITECTURE.md` — ADR-011 (refresh token storage), ADR-012 (rotation), ADR-028 (error format)
3. `apps/flexup-backend/src/auth/` — სრული auth module
4. `apps/flexup-backend/src/main.ts` — bootstrap
5. `packages/shared/src/types/auth.types.ts` — current AuthTokensResponse

თუ რომელიმე ცვლილება ეწინააღმდეგება CLAUDE.md-ს — **შემაჩერე და მკითხე**.

---

## INPUT (კონტექსტი)

რა გვაქვს ახლა:
- Refresh token returned in JSON body
- Frontend-ი მას localStorage-ში შენახავდა (insecure)

რას ვცვლით:
- Refresh token returned in **HttpOnly cookie** (XSS-resistant)
- JSON body აღარ შეიცავს refreshToken-ს (security)
- Access token JSON body-ში რჩება (frontend-ი memory-ში ინახავს)

რატომ ეს მნიშვნელოვანია:
- XSS attack-ი ვერ მოიპარავს refresh token-ს (JavaScript ვერ წვდება HttpOnly cookie-ს)
- Access token short-lived (15 min) — XSS რომც იყოს, scope-ი მცირეა
- Refresh ხდება cookie-დან automatic-ად — frontend-ი ხელით არ ცვლის

---

## GOAL

გადაიყვანე refresh token storage strategy localStorage-დან HttpOnly cookies-ზე. Access token JSON-ში რჩება.

---

## კონკრეტული deliverables

### 1. Dependency

დაამატე (ჯერ მკითხე):
- `cookie-parser`
- `@types/cookie-parser` (dev)

### 2. `main.ts` — cookie-parser middleware

```typescript
import cookieParser from 'cookie-parser';

// after app creation
app.use(cookieParser());
```

### 3. CORS — credentials უკვე გვაქვს

Verify რომ `credentials: true` უკვე გაქვს `enableCors`-ში (Batch 2.X-დან). თუ არა — დაამატე.

### 4. Config — cookie settings

`.env.example`-ში დაამატე:

```
# Cookies
COOKIE_DOMAIN=                              # ცარიელი = current host (development)
COOKIE_SECURE=false                         # production: true (HTTPS only)
COOKIE_SAME_SITE=lax                        # lax (dev) / strict (production)
COOKIE_REFRESH_TOKEN_NAME=flexup_refresh
```

`config.schema.ts`-ში (Joi):
```typescript
COOKIE_DOMAIN: Joi.string().allow('').default(''),
COOKIE_SECURE: Joi.boolean().default(false),
COOKIE_SAME_SITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),
COOKIE_REFRESH_TOKEN_NAME: Joi.string().default('flexup_refresh'),
```

`config.service.ts`-ში typed access:
```typescript
get cookies() {
  return {
    domain: this.configService.get<string>('COOKIE_DOMAIN') || undefined,
    secure: this.configService.get<boolean>('COOKIE_SECURE')!,
    sameSite: this.configService.get<'lax' | 'strict' | 'none'>('COOKIE_SAME_SITE')!,
    refreshTokenName: this.configService.get<string>('COOKIE_REFRESH_TOKEN_NAME')!,
  };
}
```

### 5. Cookie helper utility

შექმენი `src/common/utils/auth-cookies.utils.ts`:

```typescript
import type { Response, Request } from 'express';
import type { CookieOptions } from 'express';

export interface AuthCookieConfig {
  domain?: string;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  refreshTokenName: string;
}

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
  ttlSeconds: number,
  config: AuthCookieConfig,
): void {
  const options: CookieOptions = {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    maxAge: ttlSeconds * 1000,
    path: '/api/auth',          // მხოლოდ auth endpoints-ისთვის
    ...(config.domain ? { domain: config.domain } : {}),
  };

  res.cookie(config.refreshTokenName, refreshToken, options);
}

export function clearRefreshTokenCookie(
  res: Response,
  config: AuthCookieConfig,
): void {
  res.clearCookie(config.refreshTokenName, {
    httpOnly: true,
    secure: config.secure,
    sameSite: config.sameSite,
    path: '/api/auth',
    ...(config.domain ? { domain: config.domain } : {}),
  });
}

export function getRefreshTokenFromCookie(
  req: Request,
  config: AuthCookieConfig,
): string | null {
  const token = req.cookies?.[config.refreshTokenName];
  return typeof token === 'string' ? token : null;
}
```

**მნიშვნელოვანი:** `path: '/api/auth'` — cookie მხოლოდ auth endpoints-ში გადაიგზავნება. სხვა endpoints-ი არ ნახულობს refresh token-ს (security improvement, რადგან path-ი restrict-ულია).

### 6. AuthController refactor

ცვლილებები ყოველ endpoint-ში:

#### register
```typescript
@Public()
@Throttle({ short: { ttl: 60_000, limit: 3 } })
@Post('register')
async register(
  @Body() dto: RegisterDto,
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
): Promise<AuthResponseWithoutRefresh> {
  const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  const result = await this.authService.register(dto, meta);
  
  setRefreshTokenCookie(
    res,
    result.refreshToken,
    this.configService.jwt.refreshTtlSeconds,
    this.configService.cookies,
  );
  
  const { refreshToken, ...response } = result;
  return response;
}
```

#### login
იგივე pattern.

#### refresh
```typescript
@Public()
@Throttle({ short: { ttl: 60_000, limit: 10 } })
@Post('refresh')
async refresh(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
): Promise<AuthResponseWithoutRefresh> {
  const refreshToken = getRefreshTokenFromCookie(req, this.configService.cookies);
  
  if (!refreshToken) {
    throw new UnauthorizedException({
      code: ErrorCode.TOKEN_INVALID,
      message: 'Refresh token missing',
    });
  }
  
  const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  const result = await this.authService.refresh({ refreshToken }, meta);
  
  setRefreshTokenCookie(
    res,
    result.refreshToken,
    this.configService.jwt.refreshTtlSeconds,
    this.configService.cookies,
  );
  
  const { refreshToken: _, ...response } = result;
  return response;
}
```

⚠ **მნიშვნელოვანი:** `RefreshDto` body-ში აღარ ეცემა. Cookie-დან მხოლოდ.

#### logout
```typescript
@Post('logout')
@HttpCode(204)
async logout(
  @CurrentUser() user: User,
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
): Promise<void> {
  const refreshToken = getRefreshTokenFromCookie(req, this.configService.cookies);
  
  if (refreshToken) {
    await this.authService.logout(user.id, refreshToken);
  }
  
  clearRefreshTokenCookie(res, this.configService.cookies);
}
```

#### logout-all
იგივე — clear cookie ბოლოს.

### 7. AuthService refactor

`logout()` method-ი ცვლის signature-ს:

**Before:**
```typescript
async logout(userId: string): Promise<void>
```

**After:**
```typescript
async logout(userId: string, refreshToken?: string): Promise<void> {
  if (!refreshToken) return;
  
  const tokenHash = this.hashToken(refreshToken);
  await this.prisma.refreshToken.updateMany({
    where: { tokenHash, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
```

ეს არის უფრო specific — მხოლოდ current session revoke-დება (არა ყველა). Logout-all separate method-ი რჩება.

### 8. Shared types update

`packages/shared/src/types/auth.types.ts`:

**Add new type:**
```typescript
/**
 * Response type after auth operations.
 * refreshToken is NOT returned — it's set as HttpOnly cookie.
 */
export interface AuthResponseWithoutRefresh {
  accessToken: string;
  user: AuthUserDto;
}

/**
 * @deprecated Use AuthResponseWithoutRefresh.
 * Kept for backward compatibility during migration.
 */
export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}
```

**Remove from RefreshRequest:**
```typescript
// Before:
export interface RefreshRequest {
  refreshToken: string;
}

// After: empty (cookie carries the token)
export interface RefreshRequest {
  // refresh token now comes from HttpOnly cookie
}
```

ან წაშალე RefreshRequest type-ი მთლიანად — frontend-ი body არ აგზავნის.

**Update refreshSchema:**
```typescript
// auth.schemas.ts
// Remove or simplify:
export const refreshSchema = z.object({}).optional();
```

### 9. CSRF Protection — SameSite strategy

ჩვენი mitigation strategy:
1. **`SameSite=lax`** (dev) — cookies არ გადაგზავნდება cross-site POST-ში
2. **`SameSite=strict`** (production) — კიდევ მკაცრი
3. **Origin header check** — refresh endpoint-ში დამატებითი security:

`src/common/guards/origin.guard.ts` (optional, ან middleware):

```typescript
@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}
  
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const origin = request.headers['origin'] || request.headers['referer'];
    
    if (!origin) return true; // browser-ი ხშირად origin-ს არ აგზავნის same-site request-ში
    
    const allowedOrigins = this.configService.cors.origins;
    if (allowedOrigins === '*') return true;
    
    const isAllowed = allowedOrigins.some(allowed => 
      origin.startsWith(allowed)
    );
    
    if (!isAllowed) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Origin not allowed',
      });
    }
    
    return true;
  }
}
```

გამოყენება `refresh` endpoint-ში:
```typescript
@UseGuards(OriginGuard)
@Public()
@Post('refresh')
async refresh(...) { ... }
```

**Optional MVP-ისთვის** — SameSite-ი საკმარისია 95% cases-ისთვის. OriginGuard ცალკე ADR-ით.

### 10. Documentation update

`docs/ARCHITECTURE.md`-ში დაამატე:

**ADR-029: Refresh token in HttpOnly cookie**
- Decision: refresh token in `Set-Cookie` (HttpOnly, Secure, SameSite=lax/strict)
- Reason:
  - XSS-resistant — JavaScript cannot read HttpOnly cookies
  - Auto-sent with requests to `/api/auth/*` only (path-restricted)
  - Industry standard for SPAs
- Trade-offs:
  - CSRF risk → mitigated by SameSite
  - Cross-origin in dev → CORS credentials: true
  - Mobile apps (future) — need separate auth flow (token in header)

**ADR-030: Logout revokes only current session**
- Decision: `POST /logout` revokes only the session whose refresh cookie was sent
- Alternative: `POST /logout-all` for all sessions (already implemented)
- Reason: principle of least surprise — user expects "logout this device"

---

## ACCEPTANCE CRITERIA

### Build
```bash
cd apps/flexup-backend
npm run build && npm run lint && npx tsc --noEmit
```

### Manual E2E

**1. Register sets cookie:**
```bash
curl -i -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"cookie-test@test.com",
    "password":"Test1234",
    "firstName":"Cookie",
    "lastName":"Test",
    "role":"COMPANY_USER"
  }'
```
**Expected:**
- Status: 201
- Response header includes: `Set-Cookie: flexup_refresh=...; HttpOnly; SameSite=Lax; Path=/api/auth`
- Body: `{ accessToken, user }` — **NO** `refreshToken`

**2. Login sets cookie:**
```bash
curl -i -c cookies.txt -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cookie-test@test.com","password":"Test1234"}'
```
`-c cookies.txt` — saves cookies to file for next requests.

**Expected:** Same as above. `cookies.txt` shows `flexup_refresh` entry.

**3. Refresh uses cookie:**
```bash
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:3002/api/auth/refresh
```
`-b cookies.txt` — sends saved cookies.

**Expected:** 
- 200
- New `Set-Cookie` header (rotated token)
- Body: `{ accessToken, user }`

**4. Refresh without cookie fails:**
```bash
curl -i -X POST http://localhost:3002/api/auth/refresh
```
**Expected:** 401, `code: "TOKEN_INVALID"`, message: "Refresh token missing".

**5. Refresh with old cookie (reuse detection):**
რომ test გავაკეთო, ცალკე cookies-1.txt-ში დავიხახე ძველი refresh, შემდეგ refresh ერთხელ, შემდეგ ხელახლა ცადო ძველი:

```bash
# Initial login
curl -c old-cookies.txt -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cookie-test@test.com","password":"Test1234"}'

cp old-cookies.txt original-cookies.txt

# First refresh — works, rotates token
curl -b old-cookies.txt -c old-cookies.txt -X POST http://localhost:3002/api/auth/refresh

# Reuse original cookie — should fail and revoke all
curl -i -b original-cookies.txt -X POST http://localhost:3002/api/auth/refresh
```
**Expected:** 401, `code: "REFRESH_REUSE_DETECTED"`.

**6. Logout clears cookie:**
```bash
# Login fresh
curl -c logout-test.txt -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cookie-test@test.com","password":"Test1234"}'

# Get access token
ACCESS=$(... extract from response ...)

# Logout
curl -i -b logout-test.txt -c logout-test.txt \
  -X POST http://localhost:3002/api/auth/logout \
  -H "Authorization: Bearer $ACCESS"
```
**Expected:**
- 204
- `Set-Cookie: flexup_refresh=; Max-Age=0; ...` (clears cookie)

**7. CORS preflight with credentials:**
```bash
curl -i -X OPTIONS http://localhost:3002/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```
**Expected:**
- `Access-Control-Allow-Origin: http://localhost:5173`
- `Access-Control-Allow-Credentials: true`

**8. Phase 1-2 tests still pass:**

Verify რომ ძველი E2E tests-ი (Batches 1.2-2.2) ჯერ კიდევ მუშაობს. ცვლილებები მხოლოდ auth-ში — სხვა modules-ი untouched.

⚠ **Exception:** ნებისმიერი test რომელიც `refreshToken` body-დან კითხულობდა — ცვლის expectation-ს (cookie-დან). ეს ვერ მუშაობს ცარიელად.

**9. Swagger updates:**

Open `http://localhost:3002/api/docs`:
- `/auth/register`, `/auth/login`, `/auth/refresh` responses — `refreshToken` field აღარაა  
- `/auth/refresh` request body აღარაა required
- Cookie auth mechanism documented (`@nestjs/swagger`-ში `addCookieAuth`)

---

## CONSTRAINTS

1. **არ შეცვალო `prisma/schema.prisma`** — RefreshToken model საკმარისია
2. **არ შეცვალო refresh token rotation logic** — service-ი იგივე რჩება
3. **არ შეცვალო hashing (bcrypt 12)** — auth security intact
4. **არ წაშალო JSON body refreshToken support** — backward compat, just ignore body if cookie present (optional, ან ცალკე deprecation)
5. **არ შეცვალო access token strategy** — JSON body-ში რჩება
6. **არ დაამატო CSRF token middleware** — SameSite საკმარისია MVP-ისთვის
7. **არ გამოიყენო `any`** — explicit types
8. **არ გადახვიდე `cookie` package-ზე `cookie-parser`-ის ნაცვლად** — express-ი ნატივ-ად მუშაობს cookie-parser-ით

---

## SECURITY REVIEW

- [ ] Cookie `HttpOnly: true` ყოველთვის
- [ ] Cookie `Secure: true` production-ში (env-driven)
- [ ] Cookie `SameSite: lax` (dev) / `strict` (production)
- [ ] Cookie path `/api/auth` — restricted scope
- [ ] CORS `credentials: true` მუშაობს
- [ ] Refresh token body-ში აღარ ბრუნდება response-ში
- [ ] Logout cookie-ს ცარიელად ცვლის + revokes DB record
- [ ] Reuse detection cookie-დანაც მუშაობს

---

## OUT OF SCOPE

- CSRF token (double-submit cookie pattern) — V2 if needed
- Cookie encryption — V2 (already HttpOnly + signed by browser)
- Cross-domain cookies (subdomain support) — V2
- Mobile app token-only flow — V2 (separate endpoint variant)
- Cookie consent banner — V2 (compliance feature)
- Old refreshToken body parameter removal — backward compat ცოტა ხანში დაიგმობა

---

## დასასრულს

- 9 acceptance criterion უნდა გავიდეს
- Phase 1-2 tests-ი ჯერ კიდევ მუშაობს
- ADR-29, ADR-30 ჩაწერილი
- Commit: `feat: refresh token in HttpOnly cookie (mini-batch 2.y)`

შემდეგი — Frontend Batch F1.1 (Vite + React + shadcn + TanStack Router).

---

## **შემაჩერე** თუ:
- `cookie-parser` dependency-ის დასადასტურებლად
- CSRF strategy ცვლის (SameSite საკმარისია, არ გვინდა token middleware)
- Cookie path scope ცვლის (`/api/auth` is intentional)
- Refresh body backward compat-ი ცვლის (decision-ი არსებული tests-ის შესაბამისად)
