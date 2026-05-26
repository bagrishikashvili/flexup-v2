# Batch 2.W + F1.3 — Password Reset / Forgot Password (End-to-End)

## ⚠ პირველი ნაბიჯი — წაიკითხე ეს ფაილები

1. `CLAUDE.md` (root-ში)
2. `docs/ARCHITECTURE.md` — განსაკუთრებით ADR-011, ADR-012, ADR-016, ADR-028, ADR-029 და Email Verification-ის ADR-ები
3. `apps/flexup-backend/prisma/schema.prisma` — User, RefreshToken და EmailVerificationToken pattern
4. `apps/flexup-backend/src/auth/` — cookies-based auth module
5. `apps/flexup-backend/src/email/` — EmailService, SMTP/console providers, templates
6. `apps/flexup-web/src/` — Login/Register/Verify foundation
7. `packages/shared/src/` — types, schemas, error codes

თუ რომელიმე ცვლილება ეწინააღმდეგება CLAUDE.md-ს — **შემაჩერე და მკითხე**.

---

## INPUT (კონტექსტი)

რა გვაქვს:
- სრული Auth flow cookies-based refresh token-ით
- Password change authenticated user-ისთვის (`changePassword`) უკვე არსებობს და ყველა refresh token-ს revoke-ს უკეთებს
- Email Verification end-to-end უკვე არსებობს
- SMTP/Mailpit/Console email provider უკვე არსებობს
- Frontend Login/Register/Verify pages უკვე გვაქვს
- Standardized error response `{ statusCode, error, message, code, details?, timestamp, path }`
- `packages/shared` გამოიყენება frontend/backend contract-ისთვის

რა გვაკლია:
- “Forgot password?” flow login page-დან
- Reset token entity backend-ში
- Password reset email
- Reset password landing page frontend-ში
- Token validation endpoint
- New password submit endpoint
- Security rules: token hash only, one-time use, rate limit, generic responses

---

## GOAL

ააშენე end-to-end password reset flow:

1. User-ი Login page-ზე აჭერს “Forgot password?”
2. შეჰყავს email
3. Backend ყოველთვის აბრუნებს generic success-ს, რომ user enumeration არ მოხდეს
4. თუ email არსებობს და user active-ია → იგზავნება reset link email-ზე
5. User-ი გახსნის link-ს `/auth/reset-password?token=...`
6. Frontend ამოწმებს token-ს
7. User აყენებს ახალ password-ს
8. Backend hash-ს უცვლის password-ს, token-ს `usedAt`-ს უწერს და ყველა refresh token-ს revoke-ს უკეთებს
9. User redirect/login page-ზე ბრუნდება success message-ით

---

## CRITICAL SECURITY RULES

- **არასოდეს თქვა არსებობს თუ არა email** — request reset endpoint ყოველთვის generic message-ს აბრუნებს.
- **Raw reset token არ ინახება DB-ში** — მხოლოდ SHA-256 hash.
- **Token არის one-time use** — `usedAt != null` → invalid.
- **Token-ს აქვს expiry** — default 1 საათი.
- **Password reset-ის შემდეგ revoke ALL refresh tokens** — ყველა active session უნდა გაუქმდეს.
- **Password reset არ აბრუნებს access/refresh tokens-ს** — user manually login.
- **Inactive user-ზე email არ იგზავნება**, მაგრამ response მაინც generic success.
- **Rate limit აუცილებელია** request-reset და reset endpoints-ზე.
- **არ გამოიყენო JWT reset token-ად** — crypto random 64-byte hex string.
- **არ ჩადო token logs-ში** — არც raw token, არც reset URL full token-ით.

---

# PART 1 — BACKEND

## A. Prisma schema ცვლილებები

`apps/flexup-backend/prisma/schema.prisma`

დაამატე ახალი model:

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  tokenHash String    @unique
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  email     String
  expiresAt DateTime
  usedAt    DateTime?

  createdAt DateTime  @default(now())

  @@index([userId])
  @@index([tokenHash])
  @@index([expiresAt])
}
```

User model-ში დაამატე relation:

```prisma
model User {
  // ... existing fields
  passwordResetTokens PasswordResetToken[]
}
```

Migration:

```bash
npm run db:migrate:dev -- --name password_reset_token
```

---

## B. Config

`.env.example`-ში დაამატე:

```bash
# Password reset
PASSWORD_RESET_TTL_MINUTES=60
PASSWORD_RESET_RESEND_COOLDOWN_SECONDS=60
PASSWORD_RESET_MAX_PER_DAY=5
```

`config.schema.ts`:

```typescript
PASSWORD_RESET_TTL_MINUTES: Joi.number().integer().min(5).max(1440).default(60),
PASSWORD_RESET_RESEND_COOLDOWN_SECONDS: Joi.number().integer().min(0).default(60),
PASSWORD_RESET_MAX_PER_DAY: Joi.number().integer().min(1).max(20).default(5),
```

`config.service.ts`:

```typescript
get passwordReset() {
  return {
    ttlMinutes: this.configService.get<number>('PASSWORD_RESET_TTL_MINUTES')!,
    resendCooldownSeconds: this.configService.get<number>('PASSWORD_RESET_RESEND_COOLDOWN_SECONDS')!,
    maxPerDay: this.configService.get<number>('PASSWORD_RESET_MAX_PER_DAY')!,
  };
}
```

---

## C. Shared package updates

### 1. `packages/shared/src/types/auth.types.ts`

დაამატე:

```typescript
export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ValidatePasswordResetTokenRequest {
  token: string;
}

export interface ValidatePasswordResetTokenResponse {
  valid: boolean;
  email?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}
```

### 2. `packages/shared/src/validation/auth.schemas.ts`

დაამატე:

```typescript
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const validatePasswordResetTokenSchema = z.object({
  token: z.string().min(32),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
```

თუ უკვე გაქვს საერთო password schema/register schema-ში, reuse გააკეთე — არ დუბლირდეს rules.

### 3. Error codes

`packages/shared/src/types/error.types.ts` ან შესაბამის enum-ში დაამატე:

```typescript
PASSWORD_RESET_TOKEN_INVALID = 'PASSWORD_RESET_TOKEN_INVALID',
PASSWORD_RESET_TOKEN_EXPIRED = 'PASSWORD_RESET_TOKEN_EXPIRED',
PASSWORD_RESET_TOKEN_USED = 'PASSWORD_RESET_TOKEN_USED',
PASSWORD_RESET_RATE_LIMITED = 'PASSWORD_RESET_RATE_LIMITED',
```

---

## D. Email template

შექმენი:

`apps/flexup-backend/src/email/templates/password-reset-email.template.ts`

```typescript
interface PasswordResetEmailParams {
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
  appName: string;
  language: 'ka' | 'en';
}

const T = {
  ka: {
    subject: 'flexup — პაროლის აღდგენა',
    greeting: 'გამარჯობა',
    body: 'მივიღეთ მოთხოვნა თქვენი flexup ანგარიშის პაროლის აღდგენაზე. ახალი პაროლის დასაყენებლად დააჭირეთ ქვემოთ მოცემულ ღილაკს.',
    button: 'პაროლის აღდგენა',
    expires: 'ეს ლინკი მოქმედებს {{minutes}} წუთის განმავლობაში.',
    fallback: 'თუ ღილაკი არ მუშაობს, დააკოპირეთ ეს ბმული ბრაუზერში:',
    notYou: 'თუ ეს მოთხოვნა თქვენ არ გამოგიგზავნიათ, უბრალოდ უგულებელყავით ეს წერილი. თქვენი პაროლი არ შეიცვლება.',
    footer: 'პატივისცემით, flexup-ის გუნდი',
  },
  en: {
    subject: 'flexup — Reset your password',
    greeting: 'Hello',
    body: 'We received a request to reset your flexup account password. Click the button below to set a new password.',
    button: 'Reset password',
    expires: 'This link is valid for {{minutes}} minutes.',
    fallback: "If the button doesn't work, copy this link into your browser:",
    notYou: "If you didn't request this, simply ignore this email. Your password will not change.",
    footer: 'Best regards, the flexup team',
  },
};

export function renderPasswordResetEmail(
  params: PasswordResetEmailParams,
): { subject: string; html: string; text: string } {
  // გამოიყენე იგივე card style რაც verification-email.template.ts-შია
  // არ ჩაწერო token ცალკე, მხოლოდ resetUrl link-ში.
}
```

**მნიშვნელოვანი:** ვიზუალურად უნდა იყოს იგივე style, რაც email verification template-ს აქვს — login card style, Georgian/English support.

---

## E. Password reset service

შექმენი:

`apps/flexup-backend/src/auth/password-reset.service.ts`

```typescript
async requestPasswordReset(email: string, meta: RequestMeta): Promise<void>
async validateResetToken(token: string): Promise<{ valid: boolean; email?: string }>
async resetPassword(token: string, newPassword: string): Promise<void>
```

### requestPasswordReset flow

1. Normalize email → lowercase + trim
2. User მოძებნე email-ით
3. თუ user არ არსებობს ან `isActive=false`:
   - არ throw
   - არ email send
   - return void
4. Daily limit check:
   - count `PasswordResetToken` by userId where `createdAt >= startOfDay`
   - თუ max exceeded → return void ან throw too-many-requests?
   - API response მაინც generic უნდა იყოს.
5. Cooldown check:
   - ბოლო token createdAt
   - თუ cooldown არ გასულა → return void
6. Generate raw token:
   ```typescript
   const rawToken = randomBytes(64).toString('hex');
   const tokenHash = sha256(rawToken);
   ```
7. Optional cleanup:
   - წინა unused tokens იმავე user-ზე mark used/revoked equivalent არ გვაქვს, ამიტომ შეიძლება `usedAt = now()` დაუწერო old unused tokens-ს.
   - ან დატოვო valid expiry-მდე. რეკომენდაცია: invalidate old unused reset tokens.
8. Create `PasswordResetToken`
9. Build reset URL:
   ```typescript
   `${WEB_BASE_URL}/auth/reset-password?token=${rawToken}`
   ```
10. Send email via `EmailService`
11. Log only safe metadata:
   - userId
   - email domain or masked email
   - never raw token / never full URL

### validateResetToken flow

1. Hash raw token
2. Find `PasswordResetToken` by tokenHash
3. If not found → `{ valid: false }`
4. If `usedAt != null` → `{ valid: false }`
5. If expired → `{ valid: false }`
6. If user inactive → `{ valid: false }`
7. Return:
   ```typescript
   { valid: true, email: maskEmail(token.email) }
   ```
   მაგალითად: `b***@example.com`

### resetPassword flow

1. Hash raw token
2. Find token + user
3. If not found → `UnauthorizedException` with code `PASSWORD_RESET_TOKEN_INVALID`
4. If `usedAt != null` → `UnauthorizedException` with code `PASSWORD_RESET_TOKEN_USED`
5. If expired → `UnauthorizedException` with code `PASSWORD_RESET_TOKEN_EXPIRED`
6. If user inactive → `UnauthorizedException`
7. Hash new password bcrypt 12
8. Transaction:
   - update User.passwordHash
   - set this token `usedAt = now()`
   - invalidate other unused reset tokens for same user
   - revoke all refresh tokens for user (`revokedAt = now()`)
9. Return void

---

## F. AuthController endpoints

ყველა endpoint არის public, მაგრამ throttle-ით დაცული.

### 1. POST `/api/auth/forgot-password`

```typescript
@Public()
@Throttle({ short: { ttl: 60_000, limit: 3 } })
@Post('forgot-password')
async forgotPassword(
  @Body() dto: ForgotPasswordDto,
  @Req() req: Request,
): Promise<ForgotPasswordResponse> {
  const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  await this.passwordResetService.requestPasswordReset(dto.email, meta);

  return {
    message: 'If an account with this email exists, password reset instructions have been sent.',
  };
}
```

### 2. POST `/api/auth/reset-password/validate`

```typescript
@Public()
@Throttle({ short: { ttl: 60_000, limit: 10 } })
@Post('reset-password/validate')
async validateResetToken(
  @Body() dto: ValidatePasswordResetTokenDto,
): Promise<ValidatePasswordResetTokenResponse> {
  return this.passwordResetService.validateResetToken(dto.token);
}
```

### 3. POST `/api/auth/reset-password`

```typescript
@Public()
@Throttle({ short: { ttl: 60_000, limit: 5 } })
@Post('reset-password')
async resetPassword(
  @Body() dto: ResetPasswordDto,
): Promise<ResetPasswordResponse> {
  await this.passwordResetService.resetPassword(dto.token, dto.newPassword);

  return {
    message: 'Password has been reset successfully.',
  };
}
```

---

## G. DTOs

`apps/flexup-backend/src/auth/dto/forgot-password.dto.ts`

```typescript
export class ForgotPasswordDto implements ForgotPasswordRequest {
  @IsEmail()
  email!: string;
}
```

`validate-password-reset-token.dto.ts`

```typescript
export class ValidatePasswordResetTokenDto implements ValidatePasswordResetTokenRequest {
  @IsString()
  @MinLength(32)
  token!: string;
}
```

`reset-password.dto.ts`

```typescript
export class ResetPasswordDto implements ResetPasswordRequest {
  @IsString()
  @MinLength(32)
  token!: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Za-z]/)
  @Matches(/[0-9]/)
  newPassword!: string;
}
```

თუ project უკვე Zod pipe-ზეა გადასული new endpoints-ისთვის, გამოიყენე shared zod schemas და არ გააკეთო class-validator duplicate. Existing pattern-ს მიყევი.

---

## H. Auth module wiring

`auth.module.ts`-ში დაამატე:

- `PasswordResetService`
- `EmailModule` import თუ global არ არის
- exports საჭირო არ არის, თუ გარედან არ გამოიყენება

---

## I. Swagger/OpenAPI

დაამატე Swagger decorators:

- `forgot-password`
- `reset-password/validate`
- `reset-password`

Document:
- generic response request reset-ზე
- token validation response
- reset password success
- possible error codes

---

# PART 2 — FRONTEND

## A. Routes

დაამატე:

```text
apps/flexup-web/src/routes/auth/
├── forgot-password.tsx
└── reset-password.tsx
```

არსებულ `login.tsx`-ში დაამატე link:

```text
Forgot password?
```

ქართულად:
```text
პაროლი დაგავიწყდათ?
```

---

## B. Auth API

`apps/flexup-web/src/features/auth/api/auth.api.ts`

დაამატე mutations:

```typescript
export function useForgotPasswordMutation()
export function useValidateResetPasswordTokenQuery(token: string | null)
export function useResetPasswordMutation()
```

API calls:

```typescript
POST /api/auth/forgot-password
POST /api/auth/reset-password/validate
POST /api/auth/reset-password
```

`skipAuth: true` ყველა reset endpoint-ზე.

---

## C. Forgot password page

Route: `/auth/forgot-password`

UI:
- იგივე Auth card layout რაც login/register
- Header: flexup logo/name + LanguageSwitcher
- Title:
  - ka: `პაროლის აღდგენა`
  - en: `Reset password`
- Description:
  - ka: `შეიყვანეთ ელფოსტა და გამოგიგზავნით პაროლის აღდგენის ბმულს.`
  - en: `Enter your email and we’ll send you a password reset link.`
- Email input
- Submit button
- Back to login link

Submit success:
- Always show generic success:
  - ka: `თუ ანგარიში არსებობს, ინსტრუქცია ელფოსტაზე გამოიგზავნა.`
  - en: `If an account exists, reset instructions have been sent.`
- არ აჩვენო “email not found”.

---

## D. Reset password page

Route: `/auth/reset-password?token=...`

Flow:

1. Read `token` from search params
2. If token missing:
   - show invalid link state
   - button back to login
3. Call validate endpoint
4. If invalid:
   - show expired/invalid link state
   - button “Request new link”
5. If valid:
   - show new password form:
     - newPassword
     - confirmPassword
6. Client-side validation:
   - min 8
   - letter + number
   - confirm matches
7. Submit:
   - call reset endpoint
   - on success:
     - clear auth store just in case
     - toast success
     - redirect `/auth/login?reset=success`

---

## E. Login page success message

`/auth/login?reset=success` შემთხვევაში აჩვენე toast ან inline alert:

- ka: `პაროლი წარმატებით შეიცვალა. შედით ახალი პაროლით.`
- en: `Password reset successfully. Sign in with your new password.`

---

## F. i18n keys

დაამატე `locales/ka/auth.json` და `locales/en/auth.json`-ში:

```json
{
  "forgotPassword": {
    "title": "პაროლის აღდგენა",
    "description": "შეიყვანეთ ელფოსტა და გამოგიგზავნით პაროლის აღდგენის ბმულს.",
    "emailLabel": "ელფოსტა",
    "submit": "ბმულის გაგზავნა",
    "success": "თუ ანგარიში არსებობს, ინსტრუქცია ელფოსტაზე გამოიგზავნა.",
    "backToLogin": "შესვლაზე დაბრუნება"
  },
  "resetPassword": {
    "title": "ახალი პაროლის დაყენება",
    "description": "შეიყვანეთ ახალი პაროლი.",
    "newPassword": "ახალი პაროლი",
    "confirmPassword": "გაიმეორეთ პაროლი",
    "submit": "პაროლის შეცვლა",
    "success": "პაროლი წარმატებით შეიცვალა. შედით ახალი პაროლით.",
    "invalidLink": "ბმული არასწორია ან ვადა გაუვიდა.",
    "requestNewLink": "ახალი ბმულის მოთხოვნა"
  }
}
```

ინგლისური შესაბამისი translation-ებით.

---

# ACCEPTANCE CRITERIA

## Backend build

```bash
cd apps/flexup-backend
npm run build
npm run lint
npx tsc --noEmit
```

Expected: no errors.

---

## Shared build

```bash
npm run build -w @flexup/shared
```

Expected: no errors.

---

## Frontend build

```bash
cd apps/flexup-web
npm run type-check
npm run lint
npm run build
```

Expected: no errors.

---

## Manual E2E — Mailpit

### 1. Request reset

```bash
curl -s -X POST http://localhost:3002/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' | jq
```

Expected:
```json
{
  "message": "If an account with this email exists, password reset instructions have been sent."
}
```

### 2. Non-existing email returns same response

```bash
curl -s -X POST http://localhost:3002/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"does-not-exist@example.com"}' | jq
```

Expected: exact same response as existing email.

### 3. Mailpit email

Open:

```text
http://localhost:8025
```

Expected:
- password reset email arrived
- Georgian/English template works
- link points to:
  ```text
  http://localhost:5173/auth/reset-password?token=...
  ```

### 4. Validate token

```bash
curl -s -X POST http://localhost:3002/api/auth/reset-password/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"PASTE_TOKEN"}' | jq
```

Expected:
```json
{
  "valid": true,
  "email": "t***@example.com"
}
```

### 5. Reset password

```bash
curl -s -X POST http://localhost:3002/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"PASTE_TOKEN","newPassword":"NewPass123"}' | jq
```

Expected:
```json
{
  "message": "Password has been reset successfully."
}
```

### 6. Token reuse fails

Run same reset again.

Expected:
- 401
- `code: "PASSWORD_RESET_TOKEN_USED"` or generic invalid token code, depending on existing error policy.

### 7. Old password no longer works

```bash
curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"OldPass123"}' | jq
```

Expected:
- 401
- `code: "INVALID_CREDENTIALS"`

### 8. New password works

```bash
curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"NewPass123"}' | jq
```

Expected:
- 200
- accessToken returned
- refresh cookie set

### 9. Existing sessions revoked

Before reset, login and save refresh cookie.
After reset, call `/api/auth/refresh` with old cookie.

Expected:
- 401
- old refresh token invalid/revoked.

---

# CONSTRAINTS

1. **არ შეცვალო login/register/refresh/logout behavior**, გარდა forgot/reset links-ის დამატებისა frontend-ში.
2. **არ დააბრუნო reset token API response-ში** — token მხოლოდ email link-ში.
3. **არ შეინახო raw token DB-ში** — მხოლოდ SHA-256 hash.
4. **არ გამოიყენო JWT password reset token-ად**.
5. **არ თქვა email არსებობს თუ არა** request reset response-ში.
6. **არ ჩაწერო raw token logs-ში**.
7. **არ შეინახო reset token frontend state/localStorage-ში** — მხოლოდ URL query param-დან წაიკითხე და mutation-ში გამოიყენე.
8. **არ გამოიყენო `any`**.
9. **Controller-ში business logic არ ჩადო** — controller delegation only.
10. **ყველა user-facing text i18n-ით**.
11. **Password reset success არ ალოგინებს user-ს ავტომატურად**.
12. **Password reset revoke-ს უკეთებს ყველა refresh token-ს**.
13. **Existing Email Verification flow არ უნდა გაფუჭდეს**.

---

# SECURITY REVIEW

- [ ] Forgot password response generic-ია existing/non-existing email-ისთვის
- [ ] Reset token DB-ში hash-ად ინახება
- [ ] Reset token one-time use-ია
- [ ] Reset token expiry მუშაობს
- [ ] Password reset revoke-ს უკეთებს ყველა refresh token-ს
- [ ] Raw token არ ილოგება
- [ ] Rate limit მუშაობს request/reset endpoints-ზე
- [ ] Inactive user reset email-ს არ იღებს
- [ ] New password იგივე rules-ს იყენებს რაც register/change password
- [ ] Frontend არ ინახავს token-ს localStorage/sessionStorage-ში
- [ ] Error codes standardized format-ში ბრუნდება
- [ ] Existing auth tests ისევ გადის

---

# OUT OF SCOPE

- Phone/SMS password reset
- 2FA/TOTP recovery
- Admin password reset for other users
- Active sessions UI
- Password history / prevent reused passwords
- “Magic link login”
- Redis-backed rate limiting
- Email template React Email migration
- Worker mobile reset flow separate styling

---

# ADR-ი — დააფიქსირე გადაწყვეტილებები

`docs/ARCHITECTURE.md`-ში დაამატე:

## ADR-030: Password reset tokens are random opaque tokens

- Decision: reset token is `crypto.randomBytes(64).toString('hex')`
- DB stores only SHA-256 hash
- Reason: DB breach cannot be used to reset passwords
- Alternative: JWT reset token — rejected because revocation/one-time use is harder

## ADR-031: Forgot password response is always generic

- Decision: request reset endpoint returns same success response regardless of email existence
- Reason: prevent user enumeration
- Trade-off: user may not know they typed email incorrectly
- Mitigation: UI copy says “If an account exists…”

## ADR-032: Password reset revokes all sessions

- Decision: after successful reset, all refresh tokens are revoked
- Reason: stolen sessions remain dangerous after account recovery
- UX trade-off: user must login again on all devices

---

# დასასრულს

- ყველა acceptance criterion უნდა გავიდეს
- Security review checklist სრულად მონიშნე
- Swagger/OpenAPI docs განახლებულია
- Shared package build გადის
- Frontend reset flow მუშაობს browser-ში
- Commit:
  ```bash
  feat: add password reset flow end-to-end
  ```
