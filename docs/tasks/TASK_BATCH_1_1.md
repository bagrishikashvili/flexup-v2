# Task Batch 1.1 — Backend Foundation

## ⚠ პირველი ნაბიჯი — წაიკითხე ეს ფაილები

წინასწარ წაიკითხე და დაიცავი:
1. `CLAUDE.md` (root-ში) — პროექტის constitution, კონვენციები, წითელი ხაზები
2. `docs/ARCHITECTURE.md` — გადაწყვეტილებები და მათი მიზეზები
3. `apps/flexup-backend/prisma/schema.prisma` — domain model

თუ ამ ფაილებში ჩაწერილს ეწინააღმდეგება შენი იდეა — შესთავაზე ცვლილება, არ წაშალო და არ შეცვალო.

---

## INPUT (კონტექსტი)

პროექტი: **flexup** — shifts marketplace platform (Temper.works-ის მსგავსი).
ფაზა: **MVP / Phase 1** — Companies side.

რა გვაქვს უკვე:
- Monorepo npm workspaces-ით (`apps/flexup-backend`)
- Prisma schema სრულად განსაზღვრული (User, Company, Shift, Flexpool, RateTemplate და ა.შ.)
- Docker compose (postgres + redis + backend)
- `.env.example` სრული
- Migration უკვე გაშვებული, ბაზაში tables არსებობს
- `apps/flexup-backend/src/` **ცარიელია** (გარდა NestJS-ის default-ისა, თუ რამე არსებობს)
- Package.json-ში NestJS 11, Prisma 6, Socket.io, Redis client უკვე dependencies-ში

რა გვაკლია (და რასაც ამ task-ში გავაკეთებთ): backend-ის ფუნდამენტი — config, services, filters, pipes, health.

---

## GOAL

ააშენე backend-ის ფუნდამენტური infrastructure რომელზე ყველა შემდეგი feature module დაშენდება. ეს არის "scaffolding only" task — auth/users/companies modules **არ შეიქმნება ამ batch-ში**.

### კონკრეტული deliverables

**1. `src/main.ts` — bootstrap**
- NestJS app, global prefix `api`
- CORS enabled from config
- Global `ValidationPipe` (`whitelist: true, forbidNonWhitelisted: true, transform: true`)
- Global exception filters (იხ. ქვემოთ)
- Listen on `PORT` env (default 3000)
- Graceful shutdown hooks (`app.enableShutdownHooks()`)

**2. `src/app.module.ts`**
- Imports: ConfigModule (global), PrismaModule, RedisModule, HealthModule
- ცარიელი controllers/providers — feature module-ები მერე იქნება

**3. `src/config/` — Config Module**
- `config.module.ts` — `@nestjs/config` global setup
- `config.schema.ts` — env validation. გამოიყენე **Joi** (უკვე NestJS-ის ekosistema-შია), ან თუ უპირატესობას ხედავ zod-ში, ჯერ მკითხე.
- ცვლადები რომ ვალიდირდეს:
  - `NODE_ENV` ('development' | 'production' | 'test')
  - `PORT` (number, default 3000)
  - `DATABASE_URL` (string, required)
  - `REDIS_URL` (string, required)
  - `JWT_ACCESS_SECRET` (string, min 32)
  - `JWT_REFRESH_SECRET` (string, min 32)
  - `JWT_ACCESS_TTL_SECONDS` (number, default 900)
  - `JWT_REFRESH_TTL_SECONDS` (number, default 2592000)
  - `CORS_ORIGIN` (string, default '*')
  - `LOG_LEVEL` (string, default 'info')
- `config.service.ts` — typed access (e.g., `configService.jwt.accessSecret`)
- Joi-ის ან zod-ის dependency-ი დაამატე `package.json`-ში. **ჯერ მკითხე სანამ npm install გაუშვებ.**

**4. `src/prisma/` — Prisma Module**
- `prisma.service.ts` — extends `PrismaClient`, `onModuleInit` → `$connect()`, `onModuleDestroy` → `$disconnect()`
- `prisma.module.ts` — `@Global()`, exports PrismaService
- Logger ჩართე development-ში (`log: ['query', 'info', 'warn', 'error']`)
- production-ში მხოლოდ `['warn', 'error']`

**5. `src/redis/` — Redis Module**
- გამოიყენე უკვე dependencies-ში არსებული `redis` package (v5)
- `redis.service.ts` — connection lifecycle, basic operations (get/set/del/expire)
- `redis.module.ts` — `@Global()`, exports RedisService
- Reconnection strategy: exponential backoff
- Error logging

**6. `src/common/filters/`**
- `all-exceptions.filter.ts` — catch-all
- `prisma-exception.filter.ts` — `PrismaClientKnownRequestError` → HTTP errors:
  - P2002 (unique constraint) → 409 Conflict
  - P2025 (not found) → 404 Not Found
  - P2003 (foreign key) → 400 Bad Request
- Standard response format:
  ```json
  {
    "statusCode": 400,
    "message": "...",
    "error": "Bad Request",
    "timestamp": "2026-05-23T10:00:00.000Z",
    "path": "/api/..."
  }
  ```

**7. `src/common/decorators/`**
- `public.decorator.ts` — `@Public()` decorator (sets metadata `isPublic: true`)
- (guards მერე იქნება, ეს placeholder-ია metadata-ისთვის)

**8. `src/health/` — Health Module**
- `GET /api/health` — public endpoint (`@Public()`)
- Returns:
  ```json
  {
    "status": "ok",
    "timestamp": "...",
    "services": {
      "database": "up",
      "redis": "up"
    },
    "uptime": 123.45
  }
  ```
- Postgres check: `prismaService.$queryRaw\`SELECT 1\``
- Redis check: `redisService.ping()`
- ერთ-ერთი ვერ მუშაობს → status 503, services.X = "down"

**9. Path alias setup**
- `tsconfig.json`-ში `paths`: `"@/*": ["src/*"]`
- ყველგან import-ი იყოს `@/...` ფორმით (არა relative `../../../`)

---

## ACCEPTANCE CRITERIA

შემდეგი ბრძანებები უნდა გავიდეს წარმატებით:

```bash
# 1. App build-დება
cd apps/flexup-backend && npm run build

# 2. App startup-დება ერორების გარეშე
npm run start:dev
# Console-ში უნდა გამოჩნდეს: "Nest application successfully started" 
# და "Listening on 3000"

# 3. Health endpoint მუშაობს
curl http://localhost:3002/api/health
# Response: status "ok", services.database "up", services.redis "up"

# 4. ESLint warning-ების გარეშე
npm run lint

# 5. TypeScript compile-ი strict mode-ში გადის
npx tsc --noEmit
```

---

## CONSTRAINTS (წითელი ხაზები)

1. **არ შეცვალო `prisma/schema.prisma`** — ჯერ მკითხე
2. **არ შეცვალო `docker-compose.yml`** — ჯერ მკითხე
3. **არ დაამატო dependencies** package.json-ში სანამ მკითხავ — განსაკუთრებით:
   - HTTP კლიენტი (axios, got, etc.) — არ გვჭირდება
   - სხვა ORM — Prisma-ს ვიყენებთ მხოლოდ
   - სხვა cache library — `redis` package უკვე გვაქვს
   - Pino/Winston — basic NestJS Logger საკმარისია ამ ფაზაში
4. **არ შეცვალო `tsconfig.json` strict settings** — strict mode ჩართულია
5. **არ გამოიყენო `any`** — explicit types ყოველთვის
6. **არ ჩასვა business logic feature module-ში** — ეს infrastructure-ია
7. **არ შექმნა auth/users/companies modules** — ეს Batch 1.2 და 1.3-ის task-ია
8. **არ გამოიყენო `process.env.X` პირდაპირ** — მხოლოდ ConfigService-ით

---

## OUT OF SCOPE (ამ batch-ში არ კეთდება)

- Authentication / JWT strategy / Guards (Batch 1.2)
- User registration / login (Batch 1.2)
- User profile management (Batch 1.3)
- Companies, Locations, Shifts (Phase 2 batches)
- Swagger/OpenAPI docs (მერე)
- Pino logger (მერე)
- Rate limiting (მერე)
- Tests — unit tests-ი ამ batch-ში არ ვაკეთებთ, მაგრამ struct ისეთი უნდა იყოს რომ მერე ადვილად დაიწეროს

---

## საჭიროების შემთხვევაში — დააფიქსირე გადაწყვეტილებები

თუ რაიმე ვერ გადაწყვიტე ცალსახად ან ალტერნატივა გაგიჩნდა, ნუ აიღებ რისკს — **შემაჩერე და მკითხე**. გადაწყვეტილებები რომ მერე reconstruct არ მოგვიხდეს, შენი არჩევანი ჩაწერე ASR-ად `docs/ARCHITECTURE.md`-ში (ADR-011, ADR-012, ...).

---

## დასასრულს

- დარწმუნდი რომ ყველა acceptance criterion გავიდა
- `npm run docker:up` მერე `curl http://localhost:3002/api/health` უნდა მუშაობდეს
- Commit message format: `feat: backend foundation (batch 1.1)`

თუ session ბოლომდე მიდის და კონტექსტი ცარიელდება, გამოიყენე `.claude/skills/handoff/SKILL.md` და შექმენი `docs/handoffs/HANDOFF_batch_1_1_<MM_DD>.md`.
