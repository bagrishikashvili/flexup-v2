# Architecture Decisions

ეს ფაილი არის ჩვენი არქიტექტურული გადაწყვეტილებების მოკლე საცავი — რომ მერე გავიხსენოთ რატომ ვარჩიეთ ერთი მიდგომა მეორის ნაცვლად.

## ADR-001: Monorepo with npm workspaces

**კონტექსტი:** ჩვენ ვაშენებთ backend-ს, მერე იქნება web app და mobile app.

**გადაწყვეტილება:** npm workspaces. ერთი repo, რამდენიმე app.

**მიზეზი:** მცირე გუნდისთვის უფრო მარტივია ვიდრე multi-repo. shared TypeScript types-ი მერე ადვილად გავიტანთ `packages/shared`-ში.

**ალტერნატივები:** pnpm workspaces, Turborepo, Nx. ამოვირჩიეთ npm workspaces რადგან zero config-ი და უკვე ვიცით.

---

## ADR-002: NestJS framework

**კონტექსტი:** Backend framework არჩევანი.

**გადაწყვეტილება:** NestJS 11.

**მიზეზი:**
- Built-in DI, modular architecture
- WebSocket support out of the box
- TypeScript-first
- კარგი ცოდნა Prisma-სთან მუშაობის
- Decorator-based — დიდი codebase-ი მართადი რჩება

**ალტერნატივები:** Express+TypeScript (overhead), Fastify (პატარა ekosistema), tRPC (overkill).

---

## ADR-003: PostgreSQL + Prisma

**კონტექსტი:** მონაცემთა ბაზა და ORM.

**გადაწყვეტილება:** PostgreSQL 16 + Prisma 6.

**მიზეზი:**
- PostgreSQL: JSON support, arrays, full-text search, PostGIS (მერე საჭირო გახდება geo-search-ისთვის)
- Prisma: type-safe, migrations, კარგი DX

**risk:** Prisma performance ხანდახან რთულდება. თუ saturation-ი დაიწყო, raw queries-ით გავაგრძელებთ.

---

## ADR-004: JWT + Refresh tokens

**კონტექსტი:** Auth strategy.

**გადაწყვეტილება:** Stateless JWT access tokens (15 წუთი) + stateful refresh tokens (30 დღე, hash-ი ბაზაში).

**მიზეზი:**
- Access token kbatchaa — შემოწმება დატაბაზის გარეშე
- Refresh token revoke-ვადი — logout-ი მუშაობს
- Refresh token rotation — სიხშირული გამოყენებისას new refresh issue-დება, ძველი revoke-დება

**alternative ჩაგდებული:** Session cookies — mobile app-ისთვის (Phase 2) რთული.

---

## ADR-005: Money as integer minor units

**კონტექსტი:** ფულის შენახვა.

**გადაწყვეტილება:** `Int` minor units-ში (tetri/cents), არასოდეს Decimal/Float.

**მიზეზი:**
- Float-ის rounding errors არ გვინდა
- Stripe, ბანკები, ფინანსური სისტემები ყველა ამ მიდგომას იყენებენ
- Integer comparison/sum-ი ზუსტი

**კოდის წესი:** field name suffix `*Minor` (`hourlyRateMinor`, `amountMinor`).

---

## ADR-006: Multi-tenancy via CompanyMember + Guards

**კონტექსტი:** ერთი user შეიძლება იყოს რამდენიმე company-ის წევრი სხვადასხვა role-ით.

**გადაწყვეტილება:** `CompanyMember` join table, runtime check `CompanyAccessGuard`-ით.

**მიზეზი:**
- Schema-level multi-tenancy (`companyId` column ყოველ entity-ში) — მარტივი
- Row-level security PostgreSQL-ში — overkill MVP-ისთვის
- Database-per-tenant — overkill საქართველოს ბაზრისთვის

---

## ADR-007: Open + Private shifts (visibility enum)

**კონტექსტი:** Company-ი ცვლას ან public-ად აქვეყნებს, ან private invitation-ით უგზავნის.

**გადაწყვეტილება:** `ShiftVisibility` enum (`OPEN` | `PRIVATE`). `PRIVATE` + `ShiftInvitation` ცხრილი.

**მიზეზი:**
- ერთიანი `Shift` entity, არ ვშლით ცალკე ცხრილებად
- Invitation-ი join table-ით — flexpool-ი ან individual worker

---

## ADR-008: Rate Rules (time-based pricing)

**კონტექსტი:** ცვლის ფასი იცვლება დროზე (დღე/ღამე, weekend, holiday).

**გადაწყვეტილება:** `ShiftRateRule` ცხრილი — დროითი ფანჯრები + amounts.

**Alternative:** ერთი `hourlyRate` field და frontend აკონვერტებს. Reject-ი — backend უნდა იყოს source of truth-ი ფასზე.

**Algorithm:** worker-ი ცვლის სრულდება → backend აერთიანებს overlap-ებს `startsAt/endsAt` ფანჯრიდან მოქმედი rates-ით → ჯამდება total.

**flatRate-ი escape hatch-ად** — მარტივი case-ისთვის (ერთიანი 15 GEL/საათი) არ გვინდა rate rule.

---

## ADR-009: cuid() over uuid()

**კონტექსტი:** ID generation.

**გადაწყვეტილება:** `cuid()` (Prisma default).

**მიზეზი:**
- უფრო მცირე ვიდრე UUID (25 vs 36 chars)
- Sortable (timestamp prefix)
- URL-friendly
- Collision-resistant

---

## ADR-010: Soft delete-ი არ ვაკეთებთ

**კონტექსტი:** Records წაშლის სტრატეგია.

**გადაწყვეტილება:** `isActive: Boolean` flag, ფაქტობრივი DELETE არ ვაკეთებთ MVP-ში.

**მიზეზი:**
- GDPR compliance-ი მერე იქნება, ცალკე policy-ით
- `deletedAt` field-ი + ყოველ query-ში `WHERE deletedAt IS NULL` — boilerplate-ი
- isActive flag მარტივი და საკმარისი

**Reevaluate:** თუ GDPR right-to-be-forgotten dare დაგვჭირდება.

---

## ADR-011: Refresh token storage strategy

**კონტექსტი:** Refresh tokens-ი სადმე უნდა ვინახოთ revocation-ისთვის.

**გადაწყვეტილება:** Raw token client-თანაა, DB-ში მხოლოდ SHA-256 hash (`RefreshToken.tokenHash`).

**მიზეზი:**
- DB breach-ის შემთხვევაში hash-ები უსარგებლოა — raw token-ებს ვერ ამოიღებ
- SHA-256 one-way function — hash-იდან raw-ის revert შეუძლებელია
- Lookup ეფექტური: tokenHash indexed unique column

---

## ADR-012: Refresh token rotation + reuse detection

**კონტექსტი:** Stolen token-ების detection.

**გადაწყვეტილება:** ყოველ refresh request-ზე ძველი token revoke-დება, ახალი issue-დება. Revoked token-ის გამოყენება → ყველა user session revoke.

**მიზეზი:**
- Token rotation ზღუდავს stolen refresh token-ის გამოყენების ფანჯარას
- Reuse detection: თუ revoked token მოდის, ეს attack სიგნალია → ყველა session-ის kill ანეიტრალებს stolen token-ს
- Implementation: `revokedAt` timestamp column; reuse check სანამ ახალ token-ს გამოვცემთ

---

## ADR-013: JwtStrategy.validate — DB query per request

**კონტექსტი:** JWT stateless-ია, მაგრამ user.isActive შეიძლება შეიცვალოს token-ის issue-ბის შემდეგ.

**გადაწყვეტილება:** `JwtStrategy.validate()` ყოველ authenticated request-ზე DB-ს query-ს (findById).

**მიზეზი:** Simplicity first. Token payload-ი საკმარისი იქნებოდა stateless-ისთვის, მაგრამ `isActive: false` user-ი უნდა დაიბლოკოს დაუყოვნებლივ.

**სამომავლო:** Redis cache user object-ისთვის TTL 60 წამით — DB hit-ი ყოველ request-ზე შეიცვლება cache hit-ით. Invalidation: user update → cache delete.

---

## ADR-014: Global JwtAuthGuard + `@Public()` opt-out

**კონტექსტი:** Default-ად ყველა endpoint-ი დაცული თუ opt-in?

**გადაწყვეტილება:** `APP_GUARD` provider-ად `JwtAuthGuard` — ყველა endpoint default-ად authenticated. `@Public()` decorator-ით ხელით opt-out.

**მიზეზი:**
- Default-secure: დავიწყებული `@UseGuards()` → unprotected endpoint production-ში. ეს risky.
- `@Public()` explicit და ნათელი — კოდ-review-ში ჩანს
- Reflector-ით `isPublic` metadata check `JwtAuthGuard.canActivate()`-ში

---

## ADR-015: Avatar storage — local filesystem (MVP)

**კონტექსტი:** Avatar-ების სად შენახვა.

**გადაწყვეტილება:** Local disk, `uploads/avatars/<userId>-<timestamp>.webp`. Sharp-ით resize (512×512 max, WebP q85). `UPLOADS_DIR` / `UPLOADS_BASE_URL` env-driven.

**მიზეზი:** MVP simplicity. Single-instance deployment. Cloud SDK dependency ამ ეტაპზე overkill.

**სამომავლო migration:** `StorageService` interface → local vs S3/R2 implementation swap. Env-driven strategy (`STORAGE_DRIVER=local|s3`). Existing URLs მოიცვა CDN prefix-ით.

---

## ADR-016: Password change revokes all sessions

**კონტექსტი:** Password change-ის შემდეგ სხვა devices-ი authorized უნდა დარჩეს?

**გადაწყვეტილება:** Password change → ყველა `RefreshToken.revokedAt = now()`. User-ს ახელახლა login ეთხოვება.

**მიზეზი:**
- Stolen credentials scenario: attacker შეძლო login, მსხვერპლი პაროლს ცვლის → ყველა stolen session კვდება
- Best practice (GitHub, Google, bank apps ყველა ასე იქცევა)
- User UX impact minimal — 1x re-login across devices

---

## ADR-017: Email/phone change does NOT revoke sessions

**კონტექსტი:** Email ან phone ცვლილება sessions-ს revoke-ავს?

**გადაწყვეტილება:** Sessions valid რჩება. JWT payload `sub` = userId (invariant), email არ არის payload-ში.

**მიზეზი:** Less disruptive UX. Email-ი identity-ის display ელემენტია, auth identifier არა (JWT-ში userId-ია).

**Trade-off:** თუ attacker-მა email შეცვალა (stolen session), user-ის ძველი tokens მაინც valid-ია — user-ს შეუძლია logout-all-ი.

**Mitigation (მომავალი):** Active sessions view + individual session revoke UI.

---

## ADR-018: Soft delete via `isActive` flag

**კონტექსტი:** Account deletion strategy.

**გადაწყვეტილება:** `User.isActive = false`, login blocked, მონაცემები რჩება. RefreshToken-ები revoke-დება.

**მიზეზი:**
- Referential integrity: User-ზე foreign key reference-ები (Shift, CompanyMember, etc.)
- Hard delete cascade-ი production risk-ია
- GDPR right-to-erasure ცალკე task — სპეციალური data scrubbing logic სჭირდება

**Reactivation:** Admin-ს შეუძლია `PATCH /api/users/:id/active` — `isActive: true`.

---

## ADR-019: CompanyAccessGuard role hierarchy (numeric)

**კონტექსტი:** Multi-tenant access control — `@RequireCompanyRole()` decorator-ის semantics.

**გადაწყვეტილება:** Numeric hierarchy — `OWNER=3`, `MANAGER=2`, `VIEWER=1`. `@RequireCompanyRole(MANAGER)` ნიშნავს "MANAGER ან მაღლა" (MANAGER, OWNER).

**მიზეზი:**
- Intuitive — "minimum required role" ბუნებრივი mental model
- Explicit role list-ით ვალიდაცია (`[OWNER, MANAGER]`) verbose-ია ყოველ endpoint-ზე
- Multiple decorators-ის შემთხვევაში — `Math.min` რომ ყველაზე ნაკლები requirement-იც დაკმაყოფილდეს

**Trade-off:** ვერ ვამბობთ "ZUSTAD VIEWER და OWNER, MANAGER არა" — დღევანდელ ბიზნეს-წესებში არ გვჭირდება.

---

## ADR-020: Non-member returns 403, not 404

**კონტექსტი:** Non-member user-ი ცდილობს company-ის access-ს.

**გადაწყვეტილება:** `ForbiddenException` (403) — `"Not a member of this company"`. იგივე response არსებული და არ-არსებული companyId-ისთვის.

**მიზეზი:**
- Company enumeration attack-ის prevention — 404 vs 403 difference leak-ავს რომ company არსებობს
- Symmetric response → attacker ვერ ააწყობს valid company id-ების სიას

**Side effect:** Owner-ი თუ შეცდომით wrong companyId გადასცემს, "not a member" message-ს იღებს — UX trade-off.

---

## ADR-021: Last owner protection in service layer

**კონტექსტი:** ბოლო OWNER-ის demote/remove/leave-ის აკრძალვა.

**გადაწყვეტილება:** Business rule `CompanyMembersService`-ში — count check ყოველი role-changing operation-ის წინ. DB constraint არ ვამატებთ.

**მიზეზი:**
- Prisma schema-ით ვერ გამოვხატავთ (cross-row constraint)
- PostgreSQL trigger-ი შესაძლებელია, მაგრამ business logic database-ში hidden გახდება
- Service layer transparent — code review-ში ჩანს
- Race condition risk: ორი concurrent OWNER demote — count check pre-mutation. ეს corner case acceptable MVP-ისთვის; უმოკლეს pessimistic-lock-ი Phase 3-ში

---

## ADR-022: ADMIN bypass in CompanyAccessGuard

**კონტექსტი:** Platform ADMIN-ი ნებისმიერ company-ში უნდა შევიდეს support-ისთვის.

**გადაწყვეტილება:** `CompanyAccessGuard`-ში ADMIN check — bypass-ი membership lookup-ისა. `request.companyMember` populate-დება synthetic OWNER-ით + `adminBypass: true` flag-ით.

**მიზეზი:**
- Support workflows: trouble-shooting, manual cleanup, GDPR requests
- Synthetic OWNER role საშუალებას აძლევს ADMIN-ს ნებისმიერი operation-ი ჩაატაროს guard re-tooling-ის გარეშე
- `adminBypass` flag მერე audit log-ისთვის გამოგვადგება

**Risk:** ADMIN-ის misuse. Mitigation — audit log Phase 2.5-ში (ყოველი admin-bypassed mutation ცალკე ცხრილში).

---

## ADR-023: Haversine raw SQL over PostGIS for geo search

**კონტექსტი:** Location geo search (radius-ით) — distance რომ გავიგოთ, PostGIS-ი თუ pure SQL?

**გადაწყვეტილება:** `Prisma.$queryRaw` + Haversine formula (`6371 * acos(...)`). PostGIS extension არ ვამატებთ.

**მიზეზი:**
- PostGIS adds operational complexity — extension install per DB, backup/restore care, migration coordination
- Haversine ≈ 0.5% accuracy radius < 100km-ისთვის — საქართველოს ბაზრისთვის სრულიად საკმარისი
- Schema-ში უკვე გვაქვს `@@index([latitude, longitude])` — PostgreSQL btree-ი planner-ისთვის
- ყველა parameter `Prisma.sql` template literal-ით (SQL injection-safe)

**Reevaluate:** location count > ~10k per company, polygon zones (service areas), nearest-neighbor performance regression.

---

## ADR-024: Location HARD delete with shift-reference guard

**კონტექსტი:** Location-ის წაშლის სტრატეგია — soft-delete (`isActive=false`) უკვე გვაქვს, რეალური `DELETE` მაინც გვინდა cleanup-ისთვის.

**გადაწყვეტილება:** `DELETE /api/companies/:companyId/locations/:id` ნამდვილ DB DELETE-ს აკეთებს, **მაგრამ ჯერ ამოწმებს** `Shift`/`ShiftSeries`-ის reference-ებს. თუ რომელიმე არსებობს → 409 Conflict ("Cannot delete location with associated shifts. Deactivate instead.").

**მიზეზი:**
- Historical shifts-ის locationId stable უნდა იყოს — analytics, payouts, dispute resolution
- ცარიელი/შეცდომით შექმნილი location-ის cleanup-ი მაინც საჭიროა — soft-delete-მა შესაძლოა garbage დააგროვოს
- `isActive=false` ნორმალური workflow, hard delete — escape hatch

**Trade-off:** check + delete არ არის atomic transaction — race condition (concurrent shift create + delete). MVP-ისთვის acceptable; Phase 3-ში pessimistic lock-ი ან `ON DELETE RESTRICT` FK policy.

---

## ADR-025: `packages/shared` workspace package for cross-package types

**კონტექსტი:** Backend აქამდე ერთადერთი source of truth-ი იყო, ფრონტენდ-ი ცალკე გადაიწერდა enums/types/validation-ს. ეს მაგრად risky — drift შეუმჩნევლად შევა.

**გადაწყვეტილება:** npm workspace package `@flexup/shared`:
- `enums/` — UserRole, CompanyMemberRole, JobCategory, ShiftStatus, etc. (string enums Prisma value-ებთან 1-1)
- `types/` — Request/Response interfaces, ApiErrorResponse, PaginatedResponse, ErrorCode
- `validation/` — Zod schemas (single-source validation for backend + frontend)

**მიზეზი:**
- Compile-time contract enforcement (backend ↔ frontend)
- Frontend-ი იყენებს იგივე Zod schemas-ს React Hook Form-ისთვის
- OpenAPI codegen alternative-ი — chosen workspace-ი DX-სა და refactor speed-ისთვის

**Trade-off:** Prisma generates its own enums; backend mappers cast at the boundary (`prismaUser.role as UserRole`). Acceptable, რადგან Prisma და shared enum-ი string-value-equal.

---

## ADR-026: Incremental Zod migration (hybrid validation in auth)

**კონტექსტი:** აქამდე class-validator-ით ვამოწმებდით ყველაფერს. shared/Zod schemas-ი frontend-ისთვის გვინდა — backend-მაც გამოიყენოს რომ schema drift არ მოხდეს.

**გადაწყვეტილება:** Hybrid pattern — DTO classes ისევ class-validator-ით ვალიდდება (NestJS `ValidationPipe` global), ცალკეული endpoint-ი ZodValidationPipe-ით ლეიერდება `@UsePipes(new ZodValidationPipe(schema))`. ჯერ მხოლოდ Auth controller-ი (`register`, `login`, `refresh`).

**მიზეზი:**
- Big-bang refactor risk-ი თავიდან აცილებული
- Auth-ი demonstrate-ს pattern-ს და highest-value endpoint-ია (frontend მუდმივად ეხება)
- Both validators რომ ერთსა და იმავე payload-ს იღებენ → double-safety net

**Migration target:** Phase 3 cleanup batch — სრული class-validator → Zod. ალბათ Joi-ც replaced.

---

## ADR-027: In-memory rate limiting MVP (@nestjs/throttler default storage)

**კონტექსტი:** Auth endpoints (`/api/auth/login`, `register`, `refresh`) brute-force-ისგან დაცული უნდა იყოს.

**გადაწყვეტილება:** `@nestjs/throttler` default in-memory storage. Global guard (APP_GUARD), `@Throttle({...})` per-endpoint override, `@SkipThrottle()` health-ისთვის.

Limits:
- `register` — 3/min
- `login` — 5/min
- `refresh` — 10/min
- Global — 10/sec, 100/min

**Limitation:** per-instance, lost on restart, doesn't work multi-pod. MVP single-instance, ეს არ არის blocker.

**Reevaluate:** scale > 1 instance → `@nest-lab/throttler-storage-redis` (Redis backend already running).

---

## ADR-029: Refresh token in HttpOnly cookie

**Decision:** Refresh token returned in `Set-Cookie` (HttpOnly, Secure, SameSite=lax/strict), not in JSON body.

**Reason:**
- XSS-resistant — JavaScript cannot read HttpOnly cookies
- Auto-sent with requests to `/api/auth/*` only (path-restricted via `path: '/api/auth'`)
- Industry standard for SPAs
- Access token remains in JSON body, stored in memory by frontend

**Trade-offs:**
- CSRF risk → mitigated by SameSite=lax (dev) / strict (production)
- Cross-origin in dev → requires CORS `credentials: true`
- Mobile apps (future) — need separate auth flow (token in Authorization header)

**Implementation:** `cookie-parser` middleware, `AuthCookieConfig` via `AppConfigService.cookies`, helper in `common/utils/auth-cookies.utils.ts`.

---

## ADR-030: Logout revokes only current session

**Decision:** `POST /logout` revokes only the session whose refresh cookie was sent (single-session revoke).

**Alternative:** `POST /logout-all` for all sessions — already implemented separately.

**Reason:** Principle of least surprise — user expects "logout this device", not all devices.

**Implementation:** `AuthService.logout(userId, refreshToken?)` — optional token arg; if missing (no cookie), no-op + cookie cleared.

---

## ADR-028: Standardized error response envelope with `code` field

**კონტექსტი:** Frontend-ს რომ reliable error handler ჰქონდეს — `message` ი18n-ში ექვემდებარება ცვლილებას, status code მარტო არასაკმარისია (400 ბევრად რამეს ნიშნავს).

**გადაწყვეტილება:** ერთიანი `ApiErrorResponse` envelope ყველა error-ისთვის:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [{ "field": "email", "message": "..." }],
  "timestamp": "...",
  "path": "/api/auth/login"
}
```

- `code` — machine-readable, `ErrorCode` enum (`@flexup/shared`)
- `message` — human-readable (i18n მერე)
- `details` — field-level validation errors (Zod ან class-validator)

Services-ი exception throw-ის დროს `{ code, message }` object გადასცემს NestJS HttpException-ს:
```ts
throw new BadRequestException({
  code: ErrorCode.LAST_OWNER_PROTECTION,
  message: 'Cannot demote the last owner',
});
```

`AllExceptionsFilter` რთავს envelope-ში; თუ `code` არ მოცემული — auto-derive from HTTP status (e.g., 429 → `RATE_LIMIT_EXCEEDED`).

**Reason:**
- Frontend-ი switch-ი code-ზე, არა fragile string-match message-ზე
- Stable contract — message text-ი შეიძლება შეიცვალოს, `code` invariant
- Self-describing — Swagger UI-ში ApiErrorResponse type-ი frontend developer-ს ხედავს

---

## ADR-031: Frontend stack — Vite + React 19 + TanStack

**Decision:** `apps/flexup-web` — Vite 6 + React 19 SPA. TanStack Router (file-based routes), TanStack Query 5, shadcn/ui, Tailwind 4.

**Reason:**
- Vite 6: fastest HMR, native ESM, excellent monorepo support
- React 19: latest, server actions-ready for future phases
- TanStack Router: fully type-safe routing with file-based convention, zero magic
- TanStack Query: server state management with caching, deduplication, background refetch
- shadcn/ui: copy-paste components — full control, no black-box library
- Tailwind 4: modern CSS-first approach, `@theme` inline variables

**Trade-off:** TanStack Router generates `routeTree.gen.ts` — must be committed or regenerated on each route change. Acceptable since Vite plugin auto-regenerates on dev server start.

**Note:** `@flexup/shared` resolved from source (`packages/shared/src/index.ts`) via Vite alias to avoid CJS/ESM bundling issues. TypeScript `paths` aligned to match.

---

## ADR-032: Access token in memory only

**Decision:** JWT access token stored exclusively in Zustand store (in-memory). No `localStorage`, no `sessionStorage`, no cookies.

**Reason:** Minimize XSS attack surface — a script injected via XSS cannot read memory state (only its own execution context). `localStorage` is readable by any script on the same origin.

**Trade-off:** Page reload loses the access token. Mitigated by app bootstrap: on mount, `POST /auth/refresh` fires automatically using the HttpOnly refresh cookie. User remains logged in across reloads within refresh token TTL (30 days).

---

## ADR-033: Vite proxy in development

**Decision:** Vite dev server proxies `/api/*` to `http://localhost:3002`. Frontend runs on `localhost:5173`.

**Reason:** Browsers treat proxied requests as same-origin. HttpOnly cookies set by backend on `localhost:3002/api/auth` are sent back on subsequent `/api` requests through the proxy without any CORS `credentials` dance. In production, a reverse proxy (nginx) or a same-domain deployment handles this.

**Production:** Backend and frontend on separate domains requires proper CORS `credentials: true` + `allowedOrigins` configuration (already in place in backend).

---

## ADR-034: i18n with namespaced JSON files

**Decision:** `react-i18next` with three namespaces: `common`, `auth`, `errors`. Language detection via `localStorage` key `flexup-lang`, fallback to browser language, default `ka` (Georgian).

**Reason:**
- Namespaces enable code-split-friendly lazy loading in future
- `errors` namespace maps 1-to-1 with backend `ErrorCode` enum — frontend does `t(errorCode)` with no custom mapping logic
- Georgian as default aligns with primary market (Georgia)

**Supported languages:** `ka` (Georgian), `en` (English). Easy to extend — add JSON file + `supportedLngs` entry.
