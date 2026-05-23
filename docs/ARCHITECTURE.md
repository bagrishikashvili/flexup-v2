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
