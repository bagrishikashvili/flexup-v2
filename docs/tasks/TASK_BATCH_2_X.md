# Task Batch 2.X — Frontend Readiness

## ⚠ პირველი ნაბიჯი — წაიკითხე ეს ფაილები

1. `CLAUDE.md` (root-ში)
2. `docs/ARCHITECTURE.md` — ყველა ADR
3. `apps/flexup-backend/src/` — ყველა არსებული module
4. Root `package.json` — workspaces config
5. `apps/flexup-backend/tsconfig.json` და `tsconfig.build.json`

თუ რომელიმე ცვლილება ეწინააღმდეგება CLAUDE.md-ს — **შემაჩერე და მკითხე**.

---

## INPUT (კონტექსტი)

რა გვაქვს დასრულებული:
- Phase 1: Auth + Users (sრულად)
- Phase 2.1: Companies + Members + CompanyAccessGuard
- Phase 2.2: Locations + geo search

რა გვაქვს ახლა problem-ი:
- **Types/DTOs მხოლოდ backend-შია** — frontend-ი ვერ გამოიყენებს
- **API contract არ არის documented** — frontend developer-ი ვერ ნახულობს endpoints
- **CORS = "*"** — production-ში არ შეიძლება
- **Auth endpoints unprotected from brute force** — login/register-ი ღია
- **Error format-ი არ არის strictly typed** — frontend-ი ვერ აშენებს reliable handler-ს

რა გვაკლია (ამ batch-ში):
- `packages/shared` workspace package — enums, types, validation schemas
- Backend refactor — types import shared-დან
- Swagger/OpenAPI live docs
- CORS proper config
- Rate limiting (auth-სა და sensitive endpoints)
- Standardized error response format

---

## GOAL

გაამზადე backend frontend-ისთვის — type-safe contract, documented API, secure defaults, frontend-friendly error handling.

---

## კონკრეტული deliverables

### Part A — `packages/shared` Setup

#### 1. ფოლდერი + Package config

```
packages/
└── shared/
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.build.json
    ├── src/
    │   ├── index.ts           — barrel export
    │   ├── enums/
    │   │   └── index.ts
    │   ├── types/
    │   │   ├── auth.types.ts
    │   │   ├── user.types.ts
    │   │   ├── company.types.ts
    │   │   ├── member.types.ts
    │   │   ├── location.types.ts
    │   │   ├── pagination.types.ts
    │   │   ├── error.types.ts
    │   │   └── index.ts
    │   └── validation/
    │       ├── auth.schemas.ts
    │       ├── user.schemas.ts
    │       ├── company.schemas.ts
    │       ├── location.schemas.ts
    │       └── index.ts
    └── dist/                  (gitignored, built output)
```

**`packages/shared/package.json`:**
```json
{
  "name": "@flexup/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -p tsconfig.build.json --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

**ჯერ მკითხე `zod` დამატებაზე.** Zod იქნება validation schemas-ისთვის — backend-ი (NestJS-ში pipe-ით), frontend-ი (React Hook Form-ით).

**Root `package.json`-ში workspaces-ი უნდა გაფართოვდეს:**
```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

#### 2. Enums migration

`packages/shared/src/enums/index.ts`:

```typescript
export enum UserRole {
  WORKER = 'WORKER',
  COMPANY_USER = 'COMPANY_USER',
  ADMIN = 'ADMIN',
}

export enum CompanyMemberRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

export enum ShiftVisibility {
  OPEN = 'OPEN',
  PRIVATE = 'PRIVATE',
}

export enum ShiftStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  FILLED = 'FILLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum JobCategory {
  HOSPITALITY = 'HOSPITALITY',
  RETAIL = 'RETAIL',
  LOGISTICS = 'LOGISTICS',
  DELIVERY = 'DELIVERY',
  EVENTS = 'EVENTS',
  CLEANING = 'CLEANING',
  OTHER = 'OTHER',
}

export enum DayOfWeek {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN',
}
```

⚠ **გადამოწმდეს რომ string values ემთხვევა Prisma schema-ს.**

⚠ **Prisma enums vs shared enums:** Prisma გენერირებს თავის enum-ებს. შენ უნდა გადაამოწმო რომ shared enum-ი ემთხვევა Prisma-ს. გადაწყვეტა: shared enum-ი ცალკეა, runtime-ში string value-ით ერთგვაროვანი. Type-level:

```typescript
// backend-ში გადატანა:
import { UserRole as PrismaUserRole } from '@prisma/client';
import { UserRole } from '@flexup/shared';

// ეს უნდა იყოს assignable ერთმანეთის:
const x: PrismaUserRole = UserRole.WORKER;  // works
```

შეიძლება მცირე type assertion დაგვჭირდეს ერთგან-ორგან. ეს მისაღებია.

#### 3. Types migration

`packages/shared/src/types/auth.types.ts`:

```typescript
import { UserRole } from '../enums';

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

export interface AuthUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  role: Exclude<UserRole, UserRole.ADMIN>;
}

export interface RefreshRequest {
  refreshToken: string;
}
```

`packages/shared/src/types/user.types.ts`:

```typescript
import { UserRole } from '../enums';

export interface UserPublicResponse {
  id: string;
  email: string;
  phoneNumber: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;       // ISO date string (transport)
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailRequest {
  currentPassword: string;
  newEmail: string;
}

export interface ChangePhoneRequest {
  currentPassword: string;
  newPhoneNumber: string;
}

export interface DeactivateAccountRequest {
  password: string;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
  isActive?: boolean;
}
```

`packages/shared/src/types/company.types.ts`:

```typescript
import { CompanyMemberRole } from '../enums';

export interface CompanyPublicResponse {
  id: string;
  name: string;
  legalName: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  defaultCurrency: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currentUserRole?: CompanyMemberRole;
}

export interface CompanyDetailResponse extends CompanyPublicResponse {
  registrationNumber: string | null;
  vatNumber: string | null;
  memberCount: number;
  verifiedAt: string | null;
}

export interface CreateCompanyRequest {
  name: string;
  legalName?: string;
  registrationNumber?: string;
  vatNumber?: string;
  websiteUrl?: string;
  defaultCurrency?: string;
}

export type UpdateCompanyRequest = Partial<CreateCompanyRequest>;

export interface CompanyListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isVerified?: boolean;
}
```

`packages/shared/src/types/member.types.ts`:

```typescript
import { CompanyMemberRole } from '../enums';

export interface MemberUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface MemberResponse {
  id: string;
  userId: string;
  user: MemberUserInfo;
  role: CompanyMemberRole;
  createdAt: string;
}

export interface AddMemberRequest {
  email: string;
  role: CompanyMemberRole;
}

export interface UpdateMemberRoleRequest {
  role: CompanyMemberRole;
}
```

`packages/shared/src/types/location.types.ts`:

```typescript
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
  createdAt: string;
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
```

`packages/shared/src/types/pagination.types.ts`:

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

`packages/shared/src/types/error.types.ts`:

```typescript
export interface ApiErrorResponse {
  statusCode: number;
  error: string;            // "Bad Request", "Unauthorized", etc.
  message: string;          // human-readable
  code?: string;            // machine-readable, e.g. "VALIDATION_ERROR"
  details?: ValidationError[];   // field-level errors
  timestamp: string;
  path: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Error codes — frontend can switch on these
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  REFRESH_REUSE_DETECTED = 'REFRESH_REUSE_DETECTED',
  EMAIL_TAKEN = 'EMAIL_TAKEN',
  PHONE_TAKEN = 'PHONE_TAKEN',
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_COMPANY_ROLE = 'INSUFFICIENT_COMPANY_ROLE',
  NOT_COMPANY_MEMBER = 'NOT_COMPANY_MEMBER',
  LAST_OWNER_PROTECTION = 'LAST_OWNER_PROTECTION',
  WORKER_CANNOT_JOIN_COMPANY = 'WORKER_CANNOT_JOIN_COMPANY',
  LOCATION_HAS_SHIFTS = 'LOCATION_HAS_SHIFTS',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

#### 4. Zod validation schemas

`packages/shared/src/validation/auth.schemas.ts`:

```typescript
import { z } from 'zod';
import { UserRole } from '../enums';

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phoneNumber: z.string().optional(),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  role: z.enum([UserRole.WORKER, UserRole.COMPANY_USER]),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
```

ანალოგიური ფაილები `user.schemas.ts`, `company.schemas.ts`, `location.schemas.ts`.

**მნიშვნელოვანი:** schemas-ი არის **single source of truth**. Backend-ი ვალიდაციას აკეთებს ამით, frontend-ი იგივეთი (React Hook Form-ის resolver-ით).

#### 5. Barrel export — `src/index.ts`

```typescript
export * from './enums';
export * from './types';
export * from './validation';
```

### Part B — Backend Migration

#### 1. Backend `package.json`-ში dependency

```json
{
  "dependencies": {
    "@flexup/shared": "*"
  }
}
```

(npm workspaces handles linking automatically)

#### 2. Backend refactor — types import-ი

ყველა module-ში, სადაც დღეს local enum/type-ია:

**Before:**
```typescript
// auth.dto.ts
export class RegisterDto {
  ...
  @IsEnum(['WORKER', 'COMPANY_USER'])
  role: 'WORKER' | 'COMPANY_USER';
}
```

**After:**
```typescript
// auth.dto.ts
import { UserRole, type RegisterRequest } from '@flexup/shared';

export class RegisterDto implements RegisterRequest {
  ...
  @IsEnum(UserRole)
  role: UserRole;
}
```

ანალოგიური refactor:
- `src/auth/dto/` — UserRole, types
- `src/users/dto/` — UserPublicResponse, etc.
- `src/companies/dto/` — CompanyMemberRole, types
- `src/company-members/dto/`
- `src/locations/dto/`
- ყველა `*.response.ts` ფაილი — შეცვალე `import type` shared-დან

**მნიშვნელოვანი:** Prisma User-დან conversion-ი ხდება mapper-ში. Mapper-ი აბრუნებს `UserPublicResponse` from `@flexup/shared`. ეს უკვე ერთიდან-ერთი source.

#### 3. Zod validation pipe

შექმენი `src/common/pipes/zod-validation.pipe.ts`:

```typescript
import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { ErrorCode, type ValidationError } from '@flexup/shared';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const details: ValidationError[] = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        throw new BadRequestException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          details,
        });
      }
      throw error;
    }
  }
}
```

გამოყენება:
```typescript
@Post('login')
@UsePipes(new ZodValidationPipe(loginSchema))
async login(@Body() dto: LoginInput) { ... }
```

**მნიშვნელოვანი არჩევანი:** Backend-ი ჯერ class-validator-ით მუშაობდა. ცვლილება — ცალკეული endpoint-ი თანდათან გადადის Zod-ზე, **არ ვცვლით ერთბაშად**. ახალი endpoints-ი Zod-ით, ძველი ვტოვებთ მუშავად. Migration plan: ცალკე batch-ი მერე.

**ამ batch-ში:** მხოლოდ `auth.controller`-ის endpoints გადადის Zod-ზე (პრინციპის demonstrate-ისთვის). სხვაგან class-validator რჩება, არ ვცვლით ერთბაშად.

### Part C — Swagger/OpenAPI Setup

#### 1. Dependencies (მკითხე ჯერ)

- `@nestjs/swagger`
- `swagger-ui-express`

#### 2. `main.ts`-ში setup

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('flexup API')
  .setDescription('Shifts marketplace API')
  .setVersion('0.1.0')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'JWT',
  )
  .addTag('auth')
  .addTag('users')
  .addTag('companies')
  .addTag('members')
  .addTag('locations')
  .addTag('admin')
  .addTag('health')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document, {
  swaggerOptions: { persistAuthorization: true },
});
```

**Production-ში:** disable swagger თუ `NODE_ENV === 'production' && SWAGGER_ENABLED !== 'true'`.

#### 3. Controller annotations

**ყველა controller** annotated:

```typescript
@ApiTags('auth')
@Controller('auth')
export class AuthController {

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Tokens + user' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already taken' })
  @Public()
  @Post('register')
  async register(...) { ... }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current user' })
  @Get('me')
  async me(...) { ... }
}
```

**DTOs** annotated `@ApiProperty()`:

```typescript
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ minLength: 8, description: 'Min 8 chars, letter + number' })
  password: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role: UserRole;
  // ...
}
```

**Annotate ყველა controller** — Auth, Users, Companies, Members, Locations, Health.

### Part D — CORS Configuration

`.env.example`-ში დაამატე:

```
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

(comma-separated origins; default development ports)

`main.ts`:

```typescript
const corsOrigins = configService.cors.origins; // parsed array

app.enableCors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
});
```

`config.service.ts`-ში typed access:

```typescript
get cors() {
  const raw = this.configService.get<string>('CORS_ORIGINS') || '*';
  return {
    origins: raw === '*' ? '*' : raw.split(',').map(s => s.trim()),
  };
}
```

`config.schema.ts`-ში (Joi):

```typescript
CORS_ORIGINS: Joi.string().default('*'),
```

### Part E — Rate Limiting

#### 1. Dependency (მკითხე ჯერ)

- `@nestjs/throttler`

#### 2. Global config

`app.module.ts`:

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    // ...
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,        // 1 წამი
        limit: 10,        // 10 req/sec global
      },
      {
        name: 'medium',
        ttl: 60_000,      // 1 წუთი
        limit: 100,
      },
    ]),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
```

#### 3. Auth endpoints სტრიქტული limits

```typescript
// auth.controller.ts
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Throttle({ short: { ttl: 60_000, limit: 5 } })  // 5 requests / minute
@Public()
@Post('login')
async login(...) { ... }

@Throttle({ short: { ttl: 60_000, limit: 3 } })  // 3 / minute (stricter)
@Public()
@Post('register')
async register(...) { ... }

@Throttle({ short: { ttl: 60_000, limit: 10 } })
@Public()
@Post('refresh')
async refresh(...) { ... }
```

#### 4. Health endpoint skip

```typescript
@SkipThrottle()
@Public()
@Get('health')
async health() { ... }
```

#### 5. Storage (in-memory)

MVP-ისთვის in-memory. Production: Redis-backed (`@nest-lab/throttler-storage-redis` ან custom). ცალკე ADR.

### Part F — Standardized Error Response

#### 1. Global exception filter — refactor

`src/common/filters/all-exceptions.filter.ts`:

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ErrorCode, type ApiErrorResponse } from '@flexup/shared';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message = 'An unexpected error occurred';
    let code: string = ErrorCode.INTERNAL_ERROR;
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;
        message = (body.message as string) || message;
        code = (body.code as string) || this.statusToCode(statusCode);
        details = body.details;
        error = (body.error as string) || error;
      }
    } else {
      this.logger.error('Unhandled exception', exception);
    }

    const errorResponse: ApiErrorResponse = {
      statusCode,
      error,
      message,
      code,
      ...(details ? { details: details as any } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(errorResponse);
  }

  private statusToCode(status: number): string {
    switch (status) {
      case 400: return ErrorCode.VALIDATION_ERROR;
      case 401: return ErrorCode.TOKEN_INVALID;
      case 403: return ErrorCode.FORBIDDEN;
      case 404: return ErrorCode.NOT_FOUND;
      case 409: return 'CONFLICT';
      case 429: return ErrorCode.RATE_LIMIT_EXCEEDED;
      default: return ErrorCode.INTERNAL_ERROR;
    }
  }
}
```

#### 2. Service-ში ცხადი error codes

Services-ში სადაც business errors throw-ი ხდება, ცხადი code-ი:

**Example — AuthService:**

```typescript
// login
throw new UnauthorizedException({
  code: ErrorCode.INVALID_CREDENTIALS,
  message: 'Invalid credentials',
});

// register duplicate
throw new ConflictException({
  code: ErrorCode.EMAIL_TAKEN,
  message: 'Email already registered',
});

// refresh reuse
throw new UnauthorizedException({
  code: ErrorCode.REFRESH_REUSE_DETECTED,
  message: 'Session compromised, please log in again',
});
```

**Example — CompanyMembersService:**

```typescript
throw new BadRequestException({
  code: ErrorCode.WORKER_CANNOT_JOIN_COMPANY,
  message: 'Workers cannot be added as company members',
});

throw new BadRequestException({
  code: ErrorCode.LAST_OWNER_PROTECTION,
  message: 'Cannot demote the last owner',
});
```

Refactor-ი მთლიანი codebase-ში — ცხადი codes ყველგან business error-ში.

---

## ACCEPTANCE CRITERIA

### Build
```bash
# root-დან
npm install                                    # workspaces resolve
npm run build -w @flexup/shared                # shared first
cd apps/flexup-backend
npm run build                                  # backend uses shared
npm run lint
npx tsc --noEmit
```

### Manual tests

**1. Swagger UI accessible:**
```bash
npm run docker:up
# Browser: http://localhost:3002/api/docs
```
**Expected:** Interactive Swagger UI with all endpoints documented, JWT auth setup.

**2. CORS allowed origin:**
```bash
curl -X OPTIONS http://localhost:3002/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep "Access-Control"
```
**Expected:** `Access-Control-Allow-Origin: http://localhost:5173`.

**3. CORS blocked origin:**
```bash
curl -X OPTIONS http://localhost:3002/api/auth/login \
  -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep "Access-Control"
```
**Expected:** No allow-origin header.

**4. Rate limiting:**
```bash
# Login 6-ჯერ ზედიზედ
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3002/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"x@x.com","password":"y"}'
done
```
**Expected:** პირველი 5 → 401, მე-6 → 429 (Too Many Requests).

**5. Error format ერთგვაროვანი:**
```bash
curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"not-email","password":""}' | jq
```
**Expected:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "email", "message": "...", "code": "..." },
    { "field": "password", "message": "...", "code": "..." }
  ],
  "timestamp": "...",
  "path": "/api/auth/login"
}
```

**6. Login error code:**
```bash
curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nope@nope.com","password":"WrongPass1"}' | jq
```
**Expected:** `code: "INVALID_CREDENTIALS"`.

**7. Shared package import-ი backend-ში:**

გადახედე `apps/flexup-backend/src/auth/dto/register.dto.ts` — უნდა იყოს:
```typescript
import { UserRole, type RegisterRequest } from '@flexup/shared';
```

**8. Health endpoint skip throttle:**
```bash
for i in {1..30}; do curl -s http://localhost:3002/api/health > /dev/null; done
```
**Expected:** 30/30 ბრუნდება, არ ჩაირთვება throttle.

**9. ყველა test Phase 1-2-დან ჯერ კიდევ მუშაობს:**

გადახედე ძველი E2E tests Batch 1.2, 1.3, 2.1, 2.2-დან. **არცერთი არ უნდა ჩაიშალოს refactor-ის გამო.**

---

## CONSTRAINTS

1. **არ შეცვალო `prisma/schema.prisma`**
2. **არ შეცვალო domain logic** — მხოლოდ types/structure refactor
3. **არ შეცვალო endpoint paths** — frontend integration-სთვის stable
4. **არ შეცვალო response shape semantically** — მხოლოდ error format ცვლის სრულდება
5. **არ წაშალო class-validator** — ცალკეული endpoint-ი Zod-ზე გადადის, ძველი რჩება
6. **არ დაამატო dependencies რომ არ მკითხო ჯერ** — Zod, @nestjs/swagger, swagger-ui-express, @nestjs/throttler
7. **არ გამოიყენო `any`** — explicit types
8. **არ შექმნა frontend-ი ან apps/flexup-web** — შემდეგი batch
9. **არ შეცვალო Prisma enums** — shared enum-ი ცალკეა, mapping ხდება string-level

---

## SECURITY REVIEW

- [ ] CORS-ი specific origins-ისთვის (არა `*`) production-ში
- [ ] Rate limiting `register`/`login`/`refresh` endpoints-ზე
- [ ] Health endpoint skips throttle
- [ ] Error messages არ ცხადებენ internal details (no stack traces in response)
- [ ] Swagger UI production-ში disabled by default
- [ ] Shared package არ შეიცავს secrets ან sensitive data
- [ ] Zod schemas-ი match-ობს backend-ის ვალიდაციას

---

## OUT OF SCOPE

- Frontend implementation (Batch F1.x)
- Redis-backed rate limiting (V2)
- Audit log (მერე)
- API versioning (`/api/v1`) — ჯერ არ გვჭირდება
- WebSocket documentation (Shifts batch-ის შემდეგ)
- Full class-validator → Zod migration (incremental)

---

## ADR-ი

`docs/ARCHITECTURE.md`-ში დაამატე:

**ADR-025: `packages/shared` for cross-package types**
- Decision: Workspace package with enums, types, Zod schemas
- Reason: Type contract enforced compile-time backend ↔ frontend
- Alternative considered: OpenAPI codegen — chosen this approach for simpler workflow

**ADR-026: Incremental Zod migration**
- Decision: New endpoints use Zod, existing class-validator stays
- Reason: avoid big-bang refactor; both validate input identically
- Migration target: Phase 3 cleanup batch

**ADR-027: In-memory rate limiting MVP**
- Decision: `@nestjs/throttler` default in-memory storage
- Limitation: per-instance, lost on restart, doesn't work multi-pod
- Reevaluate: when scaling beyond 1 instance → Redis storage

**ADR-028: Standardized error response with codes**
- Decision: `{ statusCode, error, message, code, details?, timestamp, path }`
- `code` is machine-readable, frontend switches on it
- `message` is human-readable (i18n მერე)

---

## დასასრულს

- ყველა 9 acceptance criterion უნდა გავიდეს
- Security review სრულად
- ADR-25 to ADR-28 ჩაწერილი
- Commit: `feat: frontend readiness — shared package + swagger + cors + rate limit + error format (batch 2.x)`

🎉 Backend-ი მზადაა frontend integration-სთვის. შემდეგი — `apps/flexup-web` setup და Frontend Phase 1.

---

## **შემაჩერე** თუ:
- Dependencies დასამატებლად (Zod, Swagger, Throttler)
- Class-validator-ის სრული replacement-ი გინდა (out of scope!)
- Prisma enum-ის შეცვლა shared enum-ით (არ შეიძლება)
- რომელიმე arch decision dilemma გაგიჩნდა
