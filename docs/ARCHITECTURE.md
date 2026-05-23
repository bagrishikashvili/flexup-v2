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
