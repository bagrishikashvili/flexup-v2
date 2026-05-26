# Graph Report - flexup  (2026-05-26)

## Corpus Check
- 177 files · ~55,655 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1243 nodes · 1804 edges · 89 communities (69 shown, 20 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e463b48f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend NestJS Core|Backend NestJS Core]]
- [[_COMMUNITY_Frontend Auth & Forms|Frontend Auth & Forms]]
- [[_COMMUNITY_User Profile DTOs|User Profile DTOs]]
- [[_COMMUNITY_Companies Module|Companies Module]]
- [[_COMMUNITY_Backend Tech Stack|Backend Tech Stack]]
- [[_COMMUNITY_Company Members Access Control|Company Members Access Control]]
- [[_COMMUNITY_Locations Module|Locations Module]]
- [[_COMMUNITY_Backend Package Config|Backend Package Config]]
- [[_COMMUNITY_Backend Runtime Dependencies|Backend Runtime Dependencies]]
- [[_COMMUNITY_Web Frontend Dependencies|Web Frontend Dependencies]]
- [[_COMMUNITY_ESLint & Dev Tooling|ESLint & Dev Tooling]]
- [[_COMMUNITY_Web UI Libraries|Web UI Libraries]]
- [[_COMMUNITY_App Config & Bootstrap|App Config & Bootstrap]]
- [[_COMMUNITY_Auth Module|Auth Module]]
- [[_COMMUNITY_Architecture Decision Records|Architecture Decision Records]]
- [[_COMMUNITY_Backend TypeScript Config|Backend TypeScript Config]]
- [[_COMMUNITY_Web TypeScript Config|Web TypeScript Config]]
- [[_COMMUNITY_EN Error Translations|EN Error Translations]]
- [[_COMMUNITY_KA Error Translations|KA Error Translations]]
- [[_COMMUNITY_UI Components|UI Components]]
- [[_COMMUNITY_EN Auth Translations|EN Auth Translations]]
- [[_COMMUNITY_KA Auth Translations|KA Auth Translations]]
- [[_COMMUNITY_Shared Package TS Config|Shared Package TS Config]]
- [[_COMMUNITY_ESLint Web Config|ESLint Web Config]]
- [[_COMMUNITY_Domain Enums|Domain Enums]]
- [[_COMMUNITY_EN Common Translations|EN Common Translations]]
- [[_COMMUNITY_KA Common Translations|KA Common Translations]]
- [[_COMMUNITY_Shared Package Dependencies|Shared Package Dependencies]]
- [[_COMMUNITY_API Client & Error Handling|API Client & Error Handling]]
- [[_COMMUNITY_Vite Node TS Config|Vite Node TS Config]]
- [[_COMMUNITY_Email Module & Providers|Email Module & Providers]]
- [[_COMMUNITY_Config & Email Templates|Config & Email Templates]]
- [[_COMMUNITY_shadcnui Component Config|shadcn/ui Component Config]]
- [[_COMMUNITY_ADRs — Error & Rate Limiting|ADRs — Error & Rate Limiting]]
- [[_COMMUNITY_ADRs — Auth Security|ADRs — Auth Security]]
- [[_COMMUNITY_EN Login Translations|EN Login Translations]]
- [[_COMMUNITY_KA Login Translations|KA Login Translations]]
- [[_COMMUNITY_React Hook Form Components|React Hook Form Components]]
- [[_COMMUNITY_Email Verification Controller|Email Verification Controller]]
- [[_COMMUNITY_Shared Auth Types|Shared Auth Types]]
- [[_COMMUNITY_User Validation Schemas|User Validation Schemas]]
- [[_COMMUNITY_Auth Validation Schemas|Auth Validation Schemas]]
- [[_COMMUNITY_EN Verify Gate Translations|EN Verify Gate Translations]]
- [[_COMMUNITY_KA Verify Gate Translations|KA Verify Gate Translations]]
- [[_COMMUNITY_AuthService Methods|AuthService Methods]]
- [[_COMMUNITY_EN Verify Email Translations|EN Verify Email Translations]]
- [[_COMMUNITY_EN Validation Translations|EN Validation Translations]]
- [[_COMMUNITY_KA Verify Email Translations|KA Verify Email Translations]]
- [[_COMMUNITY_KA Validation Translations|KA Validation Translations]]
- [[_COMMUNITY_Company Validation Schemas|Company Validation Schemas]]
- [[_COMMUNITY_Location Schemas & Index|Location Schemas & Index]]
- [[_COMMUNITY_ADRs — Multi-tenancy Guards|ADRs — Multi-tenancy Guards]]
- [[_COMMUNITY_ADRs — Guard & Geo Decisions|ADRs — Guard & Geo Decisions]]
- [[_COMMUNITY_Shared Auth Response Types|Shared Auth Response Types]]
- [[_COMMUNITY_Shared Error & Pagination Types|Shared Error & Pagination Types]]
- [[_COMMUNITY_NestJS CLI Config|NestJS CLI Config]]
- [[_COMMUNITY_Card UI Component|Card UI Component]]
- [[_COMMUNITY_Build Scripts|Build Scripts]]
- [[_COMMUNITY_JWT Strategy|JWT Strategy]]
- [[_COMMUNITY_Email Verification Service|Email Verification Service]]
- [[_COMMUNITY_Email Verification Concepts|Email Verification Concepts]]
- [[_COMMUNITY_Location Types|Location Types]]
- [[_COMMUNITY_Shared Package Root|Shared Package Root]]
- [[_COMMUNITY_Router & Query Client|Router & Query Client]]
- [[_COMMUNITY_Alert UI Component|Alert UI Component]]
- [[_COMMUNITY_Claude Settings Permissions|Claude Settings Permissions]]
- [[_COMMUNITY_Shared TS Compiler Settings|Shared TS Compiler Settings]]
- [[_COMMUNITY_Avatar UI Component|Avatar UI Component]]
- [[_COMMUNITY_Email Verified Guard|Email Verified Guard]]
- [[_COMMUNITY_Backend Build TS Config|Backend Build TS Config]]
- [[_COMMUNITY_Frontend Bootstrap|Frontend Bootstrap]]
- [[_COMMUNITY_Label UI Component|Label UI Component]]
- [[_COMMUNITY_Web TS References|Web TS References]]
- [[_COMMUNITY_Shared Build TS Config|Shared Build TS Config]]
- [[_COMMUNITY_Sonner Toast Component|Sonner Toast Component]]
- [[_COMMUNITY_Refresh DTO|Refresh DTO]]
- [[_COMMUNITY_EN Logout Translations|EN Logout Translations]]
- [[_COMMUNITY_KA Logout Translations|KA Logout Translations]]
- [[_COMMUNITY_Input UI Component|Input UI Component]]
- [[_COMMUNITY_Backend TS Config Files|Backend TS Config Files]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_Separator UI Component|Separator UI Component]]
- [[_COMMUNITY_Project README|Project README]]
- [[_COMMUNITY_Claude Permissions Config|Claude Permissions Config]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]

## God Nodes (most connected - your core abstractions)
1. `AppConfigService` - 39 edges
2. `Architecture Decisions (ADRs)` - 37 edges
3. `UsersService` - 29 edges
4. `UserPublicResponse` - 22 edges
5. `PrismaService` - 21 edges
6. `CompanyDetailResponse` - 21 edges
7. `compilerOptions` - 20 edges
8. `register` - 19 edges
9. `register` - 19 edges
10. `scripts` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Mailpit SMTP Dev Email Service` --conceptually_related_to--> `Email Verification Flow`  [INFERRED]
  docker-compose.yml → apps/flexup-web/src/locales/en/auth.json
- `ClickUp-Inspired Design System for flexup-web` --conceptually_related_to--> `Tailwind CSS 4`  [INFERRED]
  DESIGN.md → apps/flexup-web/package.json
- `Mailpit SMTP Dev Email Service` --conceptually_related_to--> `Nodemailer Email Transport`  [INFERRED]
  docker-compose.yml → apps/flexup-backend/package.json
- `Task Batch F1.1 — Frontend Foundation` --references--> `Georgian Common Translations`  [EXTRACTED]
  docs/tasks/TASK_BATCH_F1_1.md → apps/flexup-web/src/locales/ka/common.json
- `Task Batch F1.1 — Frontend Foundation` --references--> `Georgian Auth Translations`  [EXTRACTED]
  docs/tasks/TASK_BATCH_F1_1.md → apps/flexup-web/src/locales/ka/auth.json

## Hyperedges (group relationships)
- **Auth & Email Verification Flow (backend JWT + nodemailer + frontend i18n)** — concept_jwt_auth_flow, concept_email_verification, backend_dep_nodemailer, docker_service_mailpit, web_locales_en_auth [INFERRED 0.85]
- **Frontend Form Validation Stack (React Hook Form + Zod + i18n errors)** — web_dep_react_hook_form, web_dep_zod, web_locales_en_validation, web_locales_en_errors [INFERRED 0.85]
- **Backend Data & Cache Services (NestJS + Prisma + PostgreSQL + Redis)** — backend_dep_nestjs, backend_dep_prisma, docker_service_postgres, docker_service_redis [EXTRACTED 0.95]
- **Auth Security Chain: JWT + Refresh Rotation + HttpOnly Cookie** — concept_jwt_auth_guard, concept_refresh_token_rotation, concept_httponly_cookie [INFERRED 0.85]
- **Multi-tenant Access Control: CompanyAccessGuard + Role Hierarchy + Admin Bypass** — concept_company_access_guard, concept_require_company_role, adr_022_admin_bypass [EXTRACTED 0.95]
- **Frontend Auth Flow: Zustand Store + Bootstrap + Verify Gate** — concept_zustand_auth_store, concept_auth_bootstrap, concept_verify_gate_route [INFERRED 0.85]

## Communities (89 total, 20 thin omitted)

### Community 0 - "Backend NestJS Core"
Cohesion: 0.07
Nodes (20): AuthModule, CompaniesModule, CompanyMembersModule, Public(), EmailModule, EmailService, JwtAuthGuard, HealthController (+12 more)

### Community 1 - "Frontend Auth & Forms"
Cohesion: 0.05
Nodes (40): LoginPage(), Route, RegisterPage(), Route, Route, searchSchema, VerifyEmailPage(), VerifyState (+32 more)

### Community 2 - "User Profile DTOs"
Cohesion: 0.08
Nodes (15): Roles(), ChangeEmailDto, ChangePhoneDto, DeactivateAccountDto, UpdateProfileDto, UserListQueryDto, UserPublicResponse, RolesGuard (+7 more)

### Community 3 - "Companies Module"
Cohesion: 0.13
Nodes (11): AuthUser, CompaniesController, toCompanyDetail(), toCompanyPublic(), ALLOWED_LOGO_MIME, CompaniesService, CompanyDetailResponse, CompanyListQueryDto (+3 more)

### Community 4 - "Backend Tech Stack"
Cohesion: 0.07
Nodes (36): NestJS 11 Framework, Nodemailer Email Transport, Prisma 6 ORM, NestJS Swagger / OpenAPI, Zod 3 Schema Validation (backend), NestJS CLI Config (nest-cli.json), Backend package.json (@flexup/backend), ClickUp-Inspired Design System for flexup-web (+28 more)

### Community 5 - "Company Members Access Control"
Cohesion: 0.09
Nodes (15): AuthUser, CompanyMembersController, MemberWithUser, toMemberResponse(), CompanyMembersService, ROLE_ORDER, CurrentMembership, CurrentMembershipPayload (+7 more)

### Community 6 - "Locations Module"
Cohesion: 0.14
Nodes (11): CreateLocationDto, LocationQueryDto, LocationResponse, SetUserActiveDto, UpdateLocationDto, LocationsController, toLocationResponse(), LocationsService (+3 more)

### Community 7 - "Backend Package Config"
Cohesion: 0.06
Nodes (33): author, description, jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment (+25 more)

### Community 8 - "Backend Runtime Dependencies"
Cohesion: 0.06
Nodes (33): dependencies, bcryptjs, class-transformer, class-validator, cookie-parser, dotenv, @flexup/shared, joi (+25 more)

### Community 9 - "Web Frontend Dependencies"
Cohesion: 0.06
Nodes (32): devDependencies, patch-package, react, react-dom, engines, node, name, overrides (+24 more)

### Community 10 - "ESLint & Dev Tooling"
Cohesion: 0.06
Nodes (31): devDependencies, eslint, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier, globals, jest (+23 more)

### Community 11 - "Web UI Libraries"
Cohesion: 0.07
Nodes (27): dependencies, class-variance-authority, clsx, date-fns, @flexup/shared, @hookform/resolvers, i18next, i18next-browser-languagedetector (+19 more)

### Community 13 - "Auth Module"
Cohesion: 0.14
Nodes (9): AuthController, CurrentUser, LoginDto, RegisterDto, ZodValidationPipe, AuthCookieConfig, clearRefreshTokenCookie(), getRefreshTokenFromCookie() (+1 more)

### Community 14 - "Architecture Decision Records"
Cohesion: 0.13
Nodes (22): ADR-001: Monorepo with npm workspaces, ADR-002: NestJS Framework, ADR-003: PostgreSQL + Prisma, ADR-005: Money as Integer Minor Units, ADR-007: Open + Private Shifts (visibility enum), ADR-008: Rate Rules (time-based pricing), ADR-010: Soft delete via isActive flag, ADR-011: Refresh Token SHA-256 Hash Storage (+14 more)

### Community 15 - "Backend TypeScript Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+13 more)

### Community 16 - "Web TypeScript Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 17 - "EN Error Translations"
Cohesion: 0.10
Nodes (20): EMAIL_ALREADY_VERIFIED, EMAIL_NOT_VERIFIED, EMAIL_TAKEN, FORBIDDEN, INTERNAL_ERROR, INVALID_CREDENTIALS, NETWORK_ERROR, NOT_FOUND (+12 more)

### Community 18 - "KA Error Translations"
Cohesion: 0.10
Nodes (20): EMAIL_ALREADY_VERIFIED, EMAIL_NOT_VERIFIED, EMAIL_TAKEN, FORBIDDEN, INTERNAL_ERROR, INVALID_CREDENTIALS, NETWORK_ERROR, NOT_FOUND (+12 more)

### Community 19 - "UI Components"
Cohesion: 0.11
Nodes (15): NavLink(), Button, ButtonProps, buttonVariants, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel (+7 more)

### Community 20 - "EN Auth Translations"
Cohesion: 0.11
Nodes (19): register, email, emailPlaceholder, firstName, firstNamePlaceholder, hasAccount, lastName, lastNamePlaceholder (+11 more)

### Community 21 - "KA Auth Translations"
Cohesion: 0.11
Nodes (19): register, email, emailPlaceholder, firstName, firstNamePlaceholder, hasAccount, lastName, lastNamePlaceholder (+11 more)

### Community 22 - "Shared Package TS Config"
Cohesion: 0.11
Nodes (18): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+10 more)

### Community 23 - "ESLint Web Config"
Cohesion: 0.11
Nodes (18): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, prettier, tailwindcss (+10 more)

### Community 24 - "Domain Enums"
Cohesion: 0.15
Nodes (15): ApplicationStatus, CompanyMemberRole, DayOfWeek, JobCategory, ShiftStatus, ShiftVisibility, CompanyDetailResponse, CompanyListQuery (+7 more)

### Community 25 - "EN Common Translations"
Cohesion: 0.12
Nodes (16): appName, cancel, delete, edit, error, language, languages, en (+8 more)

### Community 26 - "KA Common Translations"
Cohesion: 0.12
Nodes (16): appName, cancel, delete, edit, error, language, languages, en (+8 more)

### Community 27 - "Shared Package Dependencies"
Cohesion: 0.13
Nodes (15): default, dependencies, zod, devDependencies, typescript, exports, main, name (+7 more)

### Community 28 - "API Client & Error Handling"
Cohesion: 0.18
Nodes (7): ApiError, apiRequest(), RequestOptions, withRefresh(), AuthState, getAccessToken(), setAccessToken()

### Community 29 - "Vite Node TS Config"
Cohesion: 0.13
Nodes (14): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noUnusedLocals (+6 more)

### Community 30 - "Email Module & Providers"
Cohesion: 0.09
Nodes (21): API კონვენციები, Auth flow, Backend-ის სტრუქტურის წესები, code:block1 (/                           — root workspace), code:block2 (src/), code:json ({ "statusCode": 400, "message": "...", "error": "Bad Request), Database წესები, Error handling (+13 more)

### Community 31 - "Config & Email Templates"
Cohesion: 0.21
Nodes (6): RequestMeta, AppConfigModule, validationSchema, EmailVerificationModule, JwtStrategy, JwtPayload

### Community 32 - "shadcn/ui Component Config"
Cohesion: 0.14
Nodes (13): aliases, components, ui, utils, rsc, $schema, style, tailwind (+5 more)

### Community 33 - "ADRs — Error & Rate Limiting"
Cohesion: 0.19
Nodes (14): ADR-025: packages/shared Workspace Package, ADR-026: Incremental Zod Migration (Hybrid Validation), ADR-027: In-memory Rate Limiting MVP, ADR-028: Standardized Error Response Envelope with Code Field, Standardized API Error Response with Code, Swagger/OpenAPI Live Docs, Zod Shared Schemas (Single Source of Validation), Auth API Routes Documentation (+6 more)

### Community 34 - "ADRs — Auth Security"
Cohesion: 0.16
Nodes (14): ADR-004: JWT + Refresh Tokens, ADR-029: Refresh Token in HttpOnly Cookie, ADR-030: Logout Revokes Only Current Session, ADR-031: Frontend Stack — Vite + React 19 + TanStack, ADR-032: Access Token in Memory Only, ADR-033: Vite Proxy in Development, ADR-034: i18n with Namespaced JSON Files, App Bootstrap Auth (Refresh on Mount) (+6 more)

### Community 35 - "EN Login Translations"
Cohesion: 0.17
Nodes (12): login, email, emailPlaceholder, forgotPassword, loading, noAccount, password, passwordPlaceholder (+4 more)

### Community 36 - "KA Login Translations"
Cohesion: 0.17
Nodes (12): login, email, emailPlaceholder, forgotPassword, loading, noAccount, password, passwordPlaceholder (+4 more)

### Community 37 - "React Hook Form Components"
Cohesion: 0.17
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 38 - "Email Verification Controller"
Cohesion: 0.33
Nodes (3): ResendVerificationDto, VerifyEmailDto, EmailVerificationController

### Community 39 - "Shared Auth Types"
Cohesion: 0.22
Nodes (10): UserRole, AuthUserDto, ChangeEmailRequest, ChangePasswordRequest, ChangePhoneRequest, DeactivateAccountRequest, SetUserActiveRequest, UpdateProfileRequest (+2 more)

### Community 40 - "User Validation Schemas"
Cohesion: 0.18
Nodes (10): ChangeEmailInput, changeEmailSchema, ChangePasswordInput, changePasswordSchema, ChangePhoneInput, changePhoneSchema, DeactivateAccountInput, deactivateAccountSchema (+2 more)

### Community 41 - "Auth Validation Schemas"
Cohesion: 0.18
Nodes (10): LoginInput, loginSchema, RefreshInput, refreshSchema, RegisterInput, registerSchema, ResendVerificationInput, resendVerificationSchema (+2 more)

### Community 42 - "EN Verify Gate Translations"
Cohesion: 0.20
Nodes (10): verifyGate, body, logoutAndRegister, resend, resendCooldown, resending, resendSuccess, subtitle (+2 more)

### Community 43 - "KA Verify Gate Translations"
Cohesion: 0.20
Nodes (10): verifyGate, body, logoutAndRegister, resend, resendCooldown, resending, resendSuccess, subtitle (+2 more)

### Community 45 - "EN Verify Email Translations"
Cohesion: 0.22
Nodes (9): verifyEmail, errorExpired, errorInvalid, errorTitle, errorUsed, goToLogin, successBody, successTitle (+1 more)

### Community 46 - "EN Validation Translations"
Cohesion: 0.22
Nodes (8): invalidEmail, invalidFormat, invalidOption, invalidPhone, passwordWeak, required, tooLong, tooShort

### Community 47 - "KA Verify Email Translations"
Cohesion: 0.22
Nodes (9): verifyEmail, errorExpired, errorInvalid, errorTitle, errorUsed, goToLogin, successBody, successTitle (+1 more)

### Community 48 - "KA Validation Translations"
Cohesion: 0.22
Nodes (8): invalidEmail, invalidFormat, invalidOption, invalidPhone, passwordWeak, required, tooLong, tooShort

### Community 49 - "Company Validation Schemas"
Cohesion: 0.22
Nodes (8): AddMemberInput, addMemberSchema, CreateCompanyInput, createCompanySchema, UpdateCompanyInput, updateCompanySchema, UpdateMemberRoleInput, updateMemberRoleSchema

### Community 50 - "Location Schemas & Index"
Cohesion: 0.22
Nodes (6): CreateLocationInput, createLocationSchema, SetActiveInput, setActiveSchema, UpdateLocationInput, updateLocationSchema

### Community 51 - "ADRs — Multi-tenancy Guards"
Cohesion: 0.36
Nodes (8): ADR-006: Multi-tenancy via CompanyMember + Guards, ADR-021: Last Owner Protection in Service Layer, ADR-022: ADMIN Bypass in CompanyAccessGuard, CompanyAccessGuard — Multi-tenant Access Control, Last Owner Protection Rule, @RequireCompanyRole Decorator, Company Members API Routes Documentation, Task Batch 2.1 — Companies + Members

### Community 52 - "ADRs — Guard & Geo Decisions"
Cohesion: 0.39
Nodes (8): ADR-019: CompanyAccessGuard Role Hierarchy (numeric), ADR-020: Non-member Returns 403 not 404, ADR-023: Haversine Raw SQL over PostGIS for Geo Search, ADR-024: Location Hard Delete with Shift Guard, Haversine Raw SQL Geo Search, Companies API Routes Documentation, Locations API Routes Documentation, Task Batch 2.2 — Locations

### Community 53 - "Shared Auth Response Types"
Cohesion: 0.25
Nodes (7): AuthResponseWithoutRefresh, AuthTokensResponse, LoginRequest, RefreshRequest, RegisterRequest, ResendVerificationRequest, VerifyEmailRequest

### Community 54 - "Shared Error & Pagination Types"
Cohesion: 0.25
Nodes (5): ApiErrorResponse, ErrorCode, ValidationError, PaginatedMeta, PaginatedResponse

### Community 55 - "NestJS CLI Config"
Cohesion: 0.29
Nodes (6): collection, compilerOptions, deleteOutDir, plugins, $schema, sourceRoot

### Community 56 - "Card UI Component"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 57 - "Build Scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, type-check

### Community 58 - "JWT Strategy"
Cohesion: 0.21
Nodes (5): AllExceptionsFilter, HttpExceptionBody, PRISMA_ERROR_MAP, PrismaExceptionFilter, AppModule

### Community 59 - "Email Verification Service"
Cohesion: 0.29
Nodes (4): EmailVerificationService, escapeHtml(), renderVerificationEmail(), VerificationEmailParams

### Community 60 - "Email Verification Concepts"
Cohesion: 0.47
Nodes (6): Email Verification Flow (Gate + Token), SMTP Email Provider with Mailpit Dev, Verify Gate Route (Email Not Verified Block), Georgian Auth Translations, Georgian Validation Translations, Task Batch 2.Z+F1.2 — Email Verification

### Community 61 - "Location Types"
Cohesion: 0.33
Nodes (5): CreateLocationRequest, LocationListQuery, LocationResponse, SetLocationActiveRequest, UpdateLocationRequest

### Community 62 - "Shared Package Root"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 63 - "Router & Query Client"
Cohesion: 0.50
Nodes (3): queryClient, Register, router

### Community 64 - "Alert UI Component"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 65 - "Claude Settings Permissions"
Cohesion: 0.50
Nodes (3): permissions, additionalDirectories, allow

### Community 66 - "Shared TS Compiler Settings"
Cohesion: 0.67
Nodes (4): ES2022 Compilation Target, packages/shared Package, packages/shared tsconfig.json, TypeScript Strict Mode

### Community 67 - "Avatar UI Component"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

## Knowledge Gaps
- **640 isolated node(s):** `PreToolUse`, `პროექტი`, `Tech Stack (ფიქსირებული — არ შეცვალო)`, `code:block1 (/                           — root workspace)`, `code:block2 (src/)` (+635 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `T` connect `Frontend Auth & Forms` to `Email Verification Service`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `App Config & Bootstrap` to `Backend NestJS Core`, `User Profile DTOs`, `Companies Module`, `Company Members Access Control`, `Locations Module`, `Email Verification Service`, `Config & Email Templates`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `AppConfigService` connect `App Config & Bootstrap` to `Backend NestJS Core`, `User Profile DTOs`, `Companies Module`, `Auth Module`, `JWT Strategy`, `Email Verification Service`, `Config & Email Templates`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `PreToolUse`, `პროექტი`, `Tech Stack (ფიქსირებული — არ შეცვალო)` to the rest of the system?**
  _646 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend NestJS Core` be split into smaller, more focused modules?**
  _Cohesion score 0.06516290726817042 - nodes in this community are weakly interconnected._
- **Should `Frontend Auth & Forms` be split into smaller, more focused modules?**
  _Cohesion score 0.052597402597402594 - nodes in this community are weakly interconnected._
- **Should `User Profile DTOs` be split into smaller, more focused modules?**
  _Cohesion score 0.07540983606557378 - nodes in this community are weakly interconnected._