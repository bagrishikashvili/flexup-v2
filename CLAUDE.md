# CLAUDE.md

> ეს ფაილი იტვირთება ყოველი Claude Code session-ის დასაწყისში.
> წაიკითხე სრულად სანამ პროექტში რაიმე ცვლილებას შეიტან.

## პროექტი

**flexup** — shifts marketplace platform (Temper.works-ის მსგავსი).
ბაზარი: საქართველო, სამომავლოდ multi-country.

**Domain ენტიტეტები:**
- User (auth identity)
- Company (multi-tenant, ჰყავს members, locations)
- Shift (open marketplace ან private invitation)
- Flexpool (company-ის categorized favorite workers)
- WorkerProfile (worker — Phase 2-ში)

## Tech Stack (ფიქსირებული — არ შეცვალო)

- **Runtime:** Node.js 20+
- **Framework:** NestJS 11
- **Language:** TypeScript (strict mode)
- **DB:** PostgreSQL 16 via Prisma 6
- **Cache/Pub-Sub:** Redis 7
- **Real-time:** Socket.io 4 (NestJS WebSocket gateway)
- **Auth:** JWT (access + refresh tokens, refresh stored as hash)
- **Validation:** class-validator + class-transformer
- **Testing:** Jest

## Monorepo სტრუქტურა

```
/                           — root workspace
├── apps/
│   └── flexup-backend/     — NestJS app (აქ ხდება ძირითადი მუშაობა)
├── docs/                   — architecture decisions, ADRs
├── docker-compose.yml      — postgres + redis + backend
└── package.json            — npm workspaces
```

## Backend-ის სტრუქტურის წესები

**`apps/flexup-backend/src/` ფოლდერი ორგანიზდება feature-based modules-ად:**

```
src/
├── main.ts                 — bootstrap
├── app.module.ts           — root module
├── common/                 — cross-cutting (filters, interceptors, decorators)
│   ├── decorators/
│   ├── filters/            — exception filters
│   ├── guards/             — JwtAuthGuard, CompanyAccessGuard, RolesGuard
│   ├── interceptors/
│   └── pipes/
├── config/                 — typed config (env validation)
├── prisma/                 — PrismaService, PrismaModule (global)
├── redis/                  — RedisService, RedisModule (global)
├── auth/                   — register, login, refresh, JWT strategy
├── users/                  — user profile management
├── companies/              — Company CRUD
├── company-members/        — invitations, role management
├── locations/              — Location CRUD (nested under company)
├── flexpools/              — Flexpool CRUD + members
├── rate-templates/         — RateTemplate CRUD
├── shifts/                 — Shift, ShiftSeries, ShiftRateRule, ShiftInvitation
└── health/                 — /api/health endpoint
```

**თითო module გააჩნია:**
- `<name>.module.ts`
- `<name>.controller.ts`
- `<name>.service.ts`
- `dto/` — request/response DTOs (class-validator-ით)
- `<name>.service.spec.ts` — unit tests

**Path alias:** `@/` → `src/`. გამოყენება მაგრად: `import { PrismaService } from '@/prisma/prisma.service'`.

## API კონვენციები

- **Base path:** `/api`
- **Versioning:** ჯერ არ ვაკეთებთ. თუ საჭირო გახდა — URI versioning (`/api/v1/...`).
- **Resource naming:** plural, kebab-case. `/api/companies`, `/api/rate-templates`.
- **Nested resources:** მაქს 2 დონე. `/api/companies/:companyId/locations`.
- **HTTP codes:**
  - 200 GET, 200/204 PUT/PATCH/DELETE
  - 201 POST (created)
  - 400 validation error
  - 401 unauthenticated
  - 403 forbidden (authenticated, არ აქვს access)
  - 404 not found
  - 409 conflict (unique constraint, business logic conflict)
  - 422 unprocessable (semantic errors)
- **Pagination:** query params `?page=1&limit=20`. response: `{ data: [...], meta: { page, limit, total } }`.

## ფული — წესები

- ფული ყოველთვის **integer minor units** (tetri/cents). `Decimal` არ გამოიყენო.
- ვალუტა ISO 4217 string (`"GEL"`, `"EUR"`, `"USD"`).
- DTOs-ში field-ის სახელი ყოველთვის `*Minor` suffix-ით (`hourlyRateMinor`, `amountMinor`).
- ფრონტენდი თვითონ აკონვერტებს display value-ში.

## დროის წესები

- ყველაფერი ბაზაში **UTC** (Prisma default).
- დროის ფანჯრები (`timeFrom`, `timeTo` rate rules-ში) — `"HH:mm"` string-ი.
- ცვლის `timezone` field განსაზღვრავს რომელ TZ-ში გათვალოს rates.
- თუ `timeTo < timeFrom`, ფანჯარა შუაღამეს ცდება (e.g., `22:00` → `06:00`).

## Multi-tenancy — kritikuli

**ყოველი company-scoped endpoint აუცილებლად:**
1. ამოწმებს რომ მომხმარებელი ავტორიზებულია (`JwtAuthGuard`)
2. ამოწმებს რომ მომხმარებელი არის ამ company-ის წევრი (`CompanyAccessGuard`)
3. ამოწმებს რომ მის role-ს აქვს ამ ოპერაციის უფლება (`@RequireCompanyRole('OWNER', 'MANAGER')`)

**არასოდეს** არ ენდო client-ის მიერ გადმოცემულ `companyId`-ს ვერიფიკაციის გარეშე. ყოველი query-ში `where` clause-ში `companyId` ფილტრი მკაცრად.

## Validation წესები

- ყოველი controller method DTO-ს იღებს (არასოდეს raw body).
- DTO class-validator decorators-ით.
- `ValidationPipe` global-ად, `whitelist: true, forbidNonWhitelisted: true`.
- Business validation service-ში, არა controller-ში.

**Shift-ის სპეციალური წესები:**
- `flatRateMinor` XOR `rateRules` — ერთ-ერთი უნდა იყოს, ორივე ერთად აკრძალულია.
- `endsAt > startsAt` ყოველთვის.
- `ShiftInvitation`-ში `workerProfileId` XOR `flexpoolId`.
- `RateRule.timeFrom != timeTo`.

ეს ვალიდაცია **service layer-ში** — არ ვენდობით database constraints-ს ამისთვის (Prisma მისი ენით ვერ გამოხატავს).

## Error handling

- ბიზნეს ერორებისთვის — გამოიყენე NestJS built-in exceptions (`BadRequestException`, `NotFoundException`, etc.) ან custom domain exceptions `common/exceptions/`-ში.
- Global exception filter — `common/filters/all-exceptions.filter.ts`. პასუხის format:
  ```json
  { "statusCode": 400, "message": "...", "error": "Bad Request", "timestamp": "...", "path": "..." }
  ```
- Prisma errors ცალკე filter-ით (`PrismaExceptionFilter`) → HTTP errors-ად ტრანსლაცია.

## Auth flow

- **Register:** POST `/api/auth/register` → User created (WORKER ან COMPANY_USER role-ით) → returns access + refresh token.
- **Login:** POST `/api/auth/login` → access + refresh.
- **Refresh:** POST `/api/auth/refresh` → ახალი access token (refresh token rotation-ით — გადაცემული refresh revoke-დება, ახალი იქმნება).
- **Logout:** POST `/api/auth/logout` → user-ის refresh tokens revoke-დება.

**Access token:** JWT, stateless, payload `{ sub: userId, role, iat, exp }`.
**Refresh token:** random 64-byte hex, hash-ი ბაზაში, raw client-თან.
**Password:** bcrypt 12 rounds.

## Database წესები

- ყოველი schema ცვლილება — migration-ით (`npm run db:migrate:dev -- --name <description>`).
- Migration-ი — VERSION CONTROL-ში. Production-ში `db:migrate` (deploy).
- Seed scripts — `prisma/seed/`. Default seed: roles, sample categories.
- ID-ები `cuid()` — არ შეცვალო uuid-ით.
- **Soft delete არ ვაკეთებთ** — `isActive: Boolean`.

## Logging

- NestJS Logger (development) / Pino (production — მერე დავამატებთ).
- ყოველი service-ში `private readonly logger = new Logger(MyService.name);`.
- Sensitive data (passwords, tokens, secrets) **არასოდეს** არ ლოგებად.

## Testing წესები

- Unit tests — service-ებზე. Prisma-ს mock-ად ვამბობთ.
- E2E tests — `test/` ფოლდერი, ცალკე `flexup-test` database.
- coverage threshold MVP-ისთვის — 60%+ services-ზე.

## რა **არ** გააკეთო (Claude Code-ისთვის წითელი ხაზები)

1. **არ შეცვალო `prisma/schema.prisma`** — შესწორებებზე ჯერ მკითხე
2. **არ შეცვალო `docker-compose.yml`** — ჯერ მკითხე
3. **არ შეცვალო `package.json` dependencies** — წინასწარ მაცნობე რა გინდა დაამატო
4. **არ შექმნა ახალი workspace ან apps/** — ჯერ MVP-ში მხოლოდ `flexup-backend`
5. **არ დაამატო ORM-ი ან HTTP კლიენტი (axios, etc.)** გარდა იმისა, რაც აქ ჩამოვწერე
6. **არ გამოიყენო `any` type** — ყოველთვის explicit ტიპები
7. **არ ჩასვა business logic controller-ში** — controller მხოლოდ delegation-ისთვის
8. **არ წერო `Decimal`/`Float` ფულზე** — მხოლოდ `Int` minor units
9. **არ გვერდი აუარო Guards-ს** — public endpoint-ი მხოლოდ `@Public()` decorator-ით

## Handoff workflow

session-ის ბოლოს, თუ კონტექსტი ცარიელდება ან მუშაობას წყვეტ:
- გამოიყენე `.claude/skills/handoff/SKILL.md` — შექმენი `docs/handoffs/HANDOFF_<topic>_<MM_DD>.md`
- მომდევნო session დაიწყე ამ ფაილით

## დოკუმენტაცია

- **Architecture decisions** — `docs/ADRs/ADR-NNN-<topic>.md` ფორმატით
- **API documentation** — Swagger (`/api/docs`), მერე დავამატებთ
- **Module-specific docs** — module-ის ფოლდერში `README.md`

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
