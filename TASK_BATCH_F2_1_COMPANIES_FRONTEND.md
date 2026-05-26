# Frontend Batch F2.1 — Companies Onboarding + Company Management

## ⚠ პირველი ნაბიჯი — წაიკითხე ეს ფაილები

წინასწარ წაიკითხე და დაიცავი:

1. `CLAUDE.md` (root-ში)
2. `DESIGN.md` (root-ში) — UI/style source of truth
3. `docs/ARCHITECTURE.md` — განსაკუთრებით ADR-006, ADR-019, ADR-020, ADR-025, ADR-028, ADR-031, ADR-032
4. `docs/routes/README.md` — error envelope და API routes index
5. `docs/routes/auth.md` — current auth/session behavior
6. `docs/routes/companies.md` — company CRUD endpoints
7. `docs/routes/company-members.md` — role hierarchy reference only
8. `docs/routes/locations.md` — future company-scoped modules reference only
9. `apps/flexup-web/src/` — F1.1/F1.2 foundation
10. `packages/shared/src/` — company types, enums, zod schemas

თუ რომელიმე ცვლილება ეწინააღმდეგება `CLAUDE.md`-ს ან `docs/ARCHITECTURE.md`-ს — **შემაჩერე და მკითხე**.

---

## INPUT (კონტექსტი)

რა გვაქვს უკვე:

### Backend
- Auth cookies-based refresh flow
- Email verification flow
- Users module
- Companies CRUD
- Company logo upload/remove
- Company member backend
- Locations backend
- `CompanyAccessGuard` backend მხარეს
- `@flexup/shared` package types/schemas/enums
- Standardized API error format `{ statusCode, error, message, code, details?, timestamp, path }`
- OpenAPI docs dev-ში `/api/docs`

### Frontend
- `apps/flexup-web` Vite + React 19 SPA
- TanStack Router file-based routing
- TanStack Query
- React Hook Form + Zod
- Zustand auth store
- API client with access token in memory
- 401 refresh + retry flow
- Login/Register/Email verification frontend
- i18n `ka` / `en`
- shadcn-style UI primitives
- DESIGN.md style direction

რა გვაკლია ამ batch-ში:

- Company onboarding after login/register
- Company creation UI
- Company list/load current user's companies
- Active company selection/persistence
- Minimal dashboard shell with sidebar/topbar
- Company detail/settings page
- Company edit form
- Company logo upload/remove
- Empty-state flow: user has no company → create first company
- Proper error handling using `ErrorCode`
- i18n texts for company screens

---

## CRITICAL CONSTRAINT — Web Scope

**ეს web app არის COMPANY_USER-ისთვის.**

ამიტომ:

- `WORKER` role არ უნდა შევიდეს company onboarding/dashboard flow-ში.
- თუ authenticated user role არის `WORKER`, frontend-მა უნდა აჩვენოს blocked state ან logout action.
- Company creation უნდა იყოს ხელმისაწვდომი მხოლოდ `COMPANY_USER`/`ADMIN` user-ისთვის.
- არ დაამატო worker/mobile-specific UI.
- არ დაამატო shift/flexpool/rate-template UI ამ batch-ში.

---

## GOAL

ააშენე company onboarding და company management-ის პირველი frontend vertical slice:

1. User login/register/verification-ის შემდეგ გადადის app dashboard-ში.
2. Frontend იტვირთავს `GET /api/companies/mine`.
3. თუ user-ს company არ აქვს — აჩვენებს onboarding screen-ს: “Create your first company”.
4. User ქმნის company-ს `POST /api/companies`.
5. Created company ხდება active company.
6. User ხედავს dashboard shell-ს active company selector-ით.
7. User შეუძლია:
   - companies list-ის ნახვა
   - active company-ის გადართვა
   - company detail/settings-ის ნახვა
   - company info update
   - logo upload/remove
8. Frontend იყენებს `@flexup/shared` types/schemas-ს და backend error envelope-ს.

---

# PART 1 — FRONTEND ARCHITECTURE

## A. Source structure

დაამატე/გააფართოვე შემდეგი structure:

```txt
apps/flexup-web/src/
├── routes/
│   ├── _app.tsx                                  # protected app layout
│   ├── app/
│   │   ├── index.tsx                             # app home redirect/dashboard
│   │   ├── onboarding/
│   │   │   └── company.tsx                       # create first company
│   │   └── companies/
│   │       ├── index.tsx                         # companies list
│   │       ├── new.tsx                           # create company page
│   │       └── $companyId/
│   │           ├── index.tsx                     # company overview/settings
│   │           └── settings.tsx                  # edit + logo
│   ├── auth/
│   │   └── ...existing files
│   └── __root.tsx
├── features/
│   ├── auth/
│   │   └── ...existing files
│   └── companies/
│       ├── api/
│       │   ├── companies.api.ts
│       │   └── companies.queries.ts
│       ├── components/
│       │   ├── CompanyCard.tsx
│       │   ├── CompanyCreateForm.tsx
│       │   ├── CompanyEditForm.tsx
│       │   ├── CompanyLogoUploader.tsx
│       │   ├── CompanySelector.tsx
│       │   ├── CompanyEmptyState.tsx
│       │   └── CompanyRoleBadge.tsx
│       ├── hooks/
│       │   ├── useActiveCompany.ts
│       │   └── useCompanyPermissions.ts
│       └── stores/
│           └── company.store.ts
├── shared/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── AppSidebar.tsx
│   │   │   ├── AppTopbar.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── ui/
│   │       └── ...existing shadcn components
│   └── api/
│       └── ...existing client/error utils
└── locales/
    ├── ka/
    │   ├── companies.json
    │   └── navigation.json
    └── en/
        ├── companies.json
        └── navigation.json
```

თუ project-ში უკვე სხვა route/layout pattern არსებობს, არსებული pattern დაიცავი და ეს structure მას მოარგე. არ დაანგრიო F1.1/F1.2 route setup.

---

## B. Routing rules

### Protected app routes

ყველა `/app/*` route უნდა იყოს authenticated.

თუ user არაა authenticated:
- redirect `/auth/login`

თუ user authenticated მაგრამ email არაა verified:
- redirect existing verification gate page-ზე

თუ user role არის `WORKER`:
- აჩვენე unsupported web role screen:
  - title: “Web dashboard is for companies”
  - text: “Worker app will be available separately.”
  - logout button
  - language switcher

თუ user role არის `COMPANY_USER` ან `ADMIN`:
- allow app routes

### App index behavior

`/app`:

1. Load companies via `GET /api/companies/mine`.
2. If loading → skeleton dashboard.
3. If empty list → redirect `/app/onboarding/company`.
4. If active company exists in store and still appears in list → redirect `/app/companies/:companyId`.
5. Else set first company as active and redirect `/app/companies/:companyId`.

### Company onboarding route

`/app/onboarding/company`:

- Protected.
- If user already has at least one company:
  - show option: “Continue to dashboard”
  - or auto redirect `/app`
- If no company:
  - show onboarding create form.
- After successful create:
  - set created company as active
  - invalidate `companies.mine`
  - redirect `/app/companies/:companyId`

### Company routes

| Route | Purpose |
|---|---|
| `/app/companies` | List all user companies |
| `/app/companies/new` | Create additional company |
| `/app/companies/:companyId` | Company overview |
| `/app/companies/:companyId/settings` | Edit company + logo |

---

# PART 2 — API LAYER

## A. Query keys

`features/companies/api/companies.queries.ts`

```ts
export const companyQueryKeys = {
  all: ['companies'] as const,
  mine: () => [...companyQueryKeys.all, 'mine'] as const,
  detail: (companyId: string) => [...companyQueryKeys.all, 'detail', companyId] as const,
};
```

## B. API functions

`features/companies/api/companies.api.ts`

Implement functions using existing `apiRequest` wrapper:

```ts
import type {
  CompanyPublicResponse,
  CompanyDetailResponse,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from '@flexup/shared';

export async function getMyCompanies(): Promise<CompanyPublicResponse[]> {
  return apiRequest<CompanyPublicResponse[]>('/companies/mine');
}

export async function getCompany(companyId: string): Promise<CompanyDetailResponse> {
  return apiRequest<CompanyDetailResponse>(`/companies/${companyId}`);
}

export async function createCompany(payload: CreateCompanyRequest): Promise<CompanyDetailResponse> {
  return apiRequest<CompanyDetailResponse>('/companies', {
    method: 'POST',
    body: payload,
  });
}

export async function updateCompany(
  companyId: string,
  payload: UpdateCompanyRequest,
): Promise<CompanyDetailResponse> {
  return apiRequest<CompanyDetailResponse>(`/companies/${companyId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deactivateCompany(companyId: string): Promise<void> {
  return apiRequest<void>(`/companies/${companyId}`, {
    method: 'DELETE',
  });
}

export async function uploadCompanyLogo(
  companyId: string,
  file: File,
): Promise<CompanyDetailResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<CompanyDetailResponse>(`/companies/${companyId}/logo`, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

export async function removeCompanyLogo(companyId: string): Promise<CompanyDetailResponse> {
  return apiRequest<CompanyDetailResponse>(`/companies/${companyId}/logo`, {
    method: 'DELETE',
  });
}
```

### მნიშვნელოვანი — FormData support

თუ existing `apiRequest` FormData-ს სწორად არ უჭერს მხარს, დაამატე:

- `body` შეიძლება იყოს object ან `FormData`
- თუ `body instanceof FormData`, არ დააყენო `Content-Type: application/json`
- browser თვითონ დააყენებს multipart boundary-ს
- Authorization header მაინც უნდა დაემატოს access token-ით
- refresh/retry logic უნდა მუშაობდეს FormData request-ზეც

---

# PART 3 — STATE MANAGEMENT

## A. Company store

`features/companies/stores/company.store.ts`

Zustand store:

```ts
interface CompanyState {
  activeCompanyId: string | null;
  setActiveCompanyId: (companyId: string | null) => void;
  clearActiveCompany: () => void;
}
```

Rules:

- Persist only `activeCompanyId` in `localStorage`.
- Do **not** persist full company object.
- On logout, clear active company.
- If active company no longer exists in `GET /companies/mine` result, replace with first available company or `null`.

Storage key:
```ts
flexup.activeCompanyId
```

## B. useActiveCompany hook

`features/companies/hooks/useActiveCompany.ts`

Responsibilities:

- read activeCompanyId from store
- load `companies.mine`
- compute `activeCompany`
- expose:
  ```ts
  {
    companies,
    activeCompany,
    activeCompanyId,
    setActiveCompanyId,
    isLoading,
    isEmpty,
  }
  ```

## C. useCompanyPermissions hook

`features/companies/hooks/useCompanyPermissions.ts`

Input: `CompanyMemberRole | undefined`

Return:

```ts
{
  canView: boolean;
  canManage: boolean;   // MANAGER or OWNER
  canOwn: boolean;      // OWNER
}
```

Role hierarchy:

- OWNER → all true
- MANAGER → canView + canManage
- VIEWER → canView only
- undefined → false

This is frontend UX only. Backend remains source of truth.

---

# PART 4 — FORMS + VALIDATION

## A. Use shared schemas

Use existing `@flexup/shared` company schemas if they exist:

- `createCompanySchema`
- `updateCompanySchema`

If missing from shared package:
1. Add them to `packages/shared/src/validation/company.schemas.ts`
2. Export from `packages/shared/src/validation/index.ts`
3. Export from `packages/shared/src/index.ts`
4. Keep rules aligned with backend docs:
   - `name`: required, 2–200 chars
   - `legalName`: optional, max 200
   - `registrationNumber`: optional, max 50
   - `vatNumber`: optional, max 50
   - `websiteUrl`: optional URL
   - `defaultCurrency`: optional, regex `/^[A-Z]{3}$/`, default `GEL`

Do not duplicate validation logic inside frontend if shared schema already exists.

## B. CompanyCreateForm

Fields:

| Field | Required | UI |
|---|---:|---|
| `name` | yes | Input |
| `legalName` | no | Input |
| `registrationNumber` | no | Input |
| `vatNumber` | no | Input |
| `websiteUrl` | no | Input |
| `defaultCurrency` | no | Select/Input default `GEL` |

UX:
- Georgian labels by default
- English translations available
- submit button loading state
- client-side validation errors under fields
- server validation details mapped to fields if available
- on success toast + redirect
- on error toast using translated `ErrorCode`

### Suggested Georgian labels

```json
{
  "companyName": "კომპანიის სახელი",
  "legalName": "იურიდიული სახელი",
  "registrationNumber": "საიდენტიფიკაციო კოდი",
  "vatNumber": "დღგ ნომერი",
  "websiteUrl": "ვებსაიტი",
  "defaultCurrency": "ვალუტა",
  "createCompany": "კომპანიის შექმნა",
  "creating": "იქმნება..."
}
```

## C. CompanyEditForm

Same fields as create, all optional/patch behavior.

Rules:
- Load current company detail.
- Form default values from detail.
- Submit only changed fields if practical. If simpler, submit full patch object with same values — backend accepts optional fields.
- Success invalidates:
  - `companyQueryKeys.mine()`
  - `companyQueryKeys.detail(companyId)`

## D. CompanyLogoUploader

Features:
- current logo preview
- fallback avatar/card with company initials
- file picker
- drag/drop optional, not required
- allowed types: jpeg/png/webp
- max size: use backend configured default 5MB in UI copy
- upload loading state
- remove logo button if logo exists
- after upload/remove:
  - update detail cache
  - invalidate companies mine
  - toast success

Do client-side pre-check:
- reject file if MIME not image/jpeg/png/webp
- reject if size > 5MB
Backend still validates.

---

# PART 5 — UI / DESIGN

Use `DESIGN.md` as source of truth.

## A. AppShell

Create `shared/components/layout/AppShell.tsx`.

Desktop layout:
- left sidebar 260px
- main content flexible
- topbar 56px
- subtle background `#F9FAFB`
- content container max width 1200px
- cards with 12px radius, 1px border, subtle shadow

Mobile:
- sidebar hidden
- topbar has hamburger
- primary create action can be a full-width button or FAB
- touch targets min 44px

## B. Sidebar

Items for this batch:

| Label KA | Label EN | Route | Icon |
|---|---|---|---|
| მთავარი | Home | `/app` | Home |
| კომპანიები | Companies | `/app/companies` | Building2 |
| პარამეტრები | Settings | `/app/companies/:activeCompanyId/settings` | Settings |

Rules:
- If no active company, Settings disabled/hidden.
- Active item uses ClickUp-style active state:
  - light purple background
  - purple text
  - 3px left accent

## C. Topbar

Includes:
- breadcrumb
- CompanySelector
- LanguageSwitcher
- user menu / logout

CompanySelector:
- Shows active company name
- Dropdown lists companies
- "Create company" item at bottom
- On select:
  - setActiveCompanyId
  - navigate to `/app/companies/:companyId`

## D. Company cards

CompanyCard should show:
- logo or initials
- company name
- currentUserRole badge
- website if exists
- verified badge if `isVerified`
- inactive badge if `!isActive`
- CTA: "Open"

Style:
- white card
- border `#E5E7EB`
- radius 12
- hover shadow
- status badges as pills
- no heavy enterprise gray look

## E. Empty state

When no companies:
- friendly illustration/icon
- title: “Create your first company”
- text explaining that shifts, locations and members will belong to this company
- primary CTA gradient button

Do not create dummy company automatically. User must explicitly submit form.

---

# PART 6 — PAGES

## 1. `/app/onboarding/company`

Purpose: first company creation.

Layout:
- centered card, max-width 720
- left/above explanatory content
- CompanyCreateForm
- no full sidebar required if no company exists, but topbar with language/logout is OK

Copy KA:
- Title: `პირველი კომპანიის შექმნა`
- Subtitle: `კომპანიის დამატების შემდეგ შეძლებთ ლოკაციების, წევრების და ცვლების მართვას.`
- CTA: `კომპანიის შექმნა`

Success:
- toast: `კომპანია წარმატებით შეიქმნა`
- redirect to company overview

## 2. `/app/companies`

Purpose: list user companies.

States:
- loading skeleton
- empty state
- error state with retry
- list/grid of CompanyCard
- Create company button

## 3. `/app/companies/new`

Purpose: create additional company.

After success:
- set as active company
- redirect to detail

## 4. `/app/companies/:companyId`

Purpose: company overview.

Display:
- logo/name
- role
- verified/inactive badges
- legal info
- website
- default currency
- memberCount if using detail endpoint
- quick actions:
  - Settings
  - Members placeholder
  - Locations placeholder

Important:
- Members/Locations full UI is **out of scope**, but quick action cards can be disabled or link to future routes with "Coming soon".
- Do not implement members/locations CRUD in this batch.

## 5. `/app/companies/:companyId/settings`

Purpose: company settings.

Sections:
1. General info — CompanyEditForm
2. Logo — CompanyLogoUploader
3. Danger zone — deactivate company

### Danger zone

Show deactivate button only for OWNER role.

Flow:
- Click "Deactivate company"
- Confirmation dialog:
  - text explains this only sets `isActive=false`
  - user must confirm
- Call `DELETE /api/companies/:companyId`
- On success:
  - invalidate companies mine
  - clear active if current was deactivated
  - redirect `/app/companies`
  - toast success

---

# PART 7 — ERROR HANDLING

Use existing API error utilities.

Rules:

- Never string-match backend `message`.
- Switch on `error.code` where possible.
- Field validation:
  - If `details[]` contains field-level errors, map into React Hook Form `setError`.
- Generic fallback:
  - KA: `რაღაც შეცდომა მოხდა. სცადეთ თავიდან.`
  - EN: `Something went wrong. Please try again.`

Expected cases:

| Backend status/code | Frontend behavior |
|---|---|
| 400 / `VALIDATION_ERROR` | field errors |
| 401 | existing refresh flow; if refresh fails → login |
| 403 | show forbidden state |
| 409 | show conflict toast/field error |
| 413 or upload-size error | show file too large |
| network error | retry option |

Forbidden page copy:
- KA: `ამ კომპანიაზე წვდომა არ გაქვთ`
- EN: `You do not have access to this company`

---

# PART 8 — i18n

Add translations:

```txt
locales/ka/companies.json
locales/en/companies.json
locales/ka/navigation.json
locales/en/navigation.json
```

Example KA:

```json
{
  "title": "კომპანიები",
  "createFirstTitle": "პირველი კომპანიის შექმნა",
  "createFirstDescription": "კომპანიის დამატების შემდეგ შეძლებთ ლოკაციების, წევრების და ცვლების მართვას.",
  "createCompany": "კომპანიის შექმნა",
  "newCompany": "ახალი კომპანია",
  "companyName": "კომპანიის სახელი",
  "legalName": "იურიდიული სახელი",
  "registrationNumber": "საიდენტიფიკაციო კოდი",
  "vatNumber": "დღგ ნომერი",
  "websiteUrl": "ვებსაიტი",
  "defaultCurrency": "ვალუტა",
  "settings": "პარამეტრები",
  "logo": "ლოგო",
  "uploadLogo": "ლოგოს ატვირთვა",
  "removeLogo": "ლოგოს წაშლა",
  "deactivateCompany": "კომპანიის დეაქტივაცია",
  "companyCreated": "კომპანია წარმატებით შეიქმნა",
  "companyUpdated": "კომპანია განახლდა",
  "logoUpdated": "ლოგო განახლდა",
  "logoRemoved": "ლოგო წაიშალა",
  "owner": "მფლობელი",
  "manager": "მენეჯერი",
  "viewer": "მნახველი",
  "verified": "ვერიფიცირებული",
  "notVerified": "არავერიფიცირებული",
  "inactive": "არააქტიური"
}
```

Example EN:

```json
{
  "title": "Companies",
  "createFirstTitle": "Create your first company",
  "createFirstDescription": "After adding a company, you will be able to manage locations, members and shifts.",
  "createCompany": "Create company",
  "newCompany": "New company",
  "companyName": "Company name",
  "legalName": "Legal name",
  "registrationNumber": "Registration number",
  "vatNumber": "VAT number",
  "websiteUrl": "Website",
  "defaultCurrency": "Currency",
  "settings": "Settings",
  "logo": "Logo",
  "uploadLogo": "Upload logo",
  "removeLogo": "Remove logo",
  "deactivateCompany": "Deactivate company",
  "companyCreated": "Company created successfully",
  "companyUpdated": "Company updated",
  "logoUpdated": "Logo updated",
  "logoRemoved": "Logo removed",
  "owner": "Owner",
  "manager": "Manager",
  "viewer": "Viewer",
  "verified": "Verified",
  "notVerified": "Not verified",
  "inactive": "Inactive"
}
```

Register namespaces in `lib/i18n.ts`.

---

# PART 9 — CACHE / INVALIDATION

TanStack Query rules:

- `getMyCompanies`:
  - staleTime: 30s
  - refetch on window focus: true
- company detail:
  - staleTime: 30s
- after create:
  - invalidate `mine`
  - set active company
- after update:
  - invalidate `mine`
  - invalidate `detail(companyId)`
- after logo upload/remove:
  - invalidate `mine`
  - invalidate `detail(companyId)`
- after deactivate:
  - invalidate `mine`
  - remove/clear detail cache for that company if possible

Do not overuse global invalidation.

---

# PART 10 — ACCESS / PERMISSIONS UX

Backend remains source of truth, but frontend should hide/disable actions for clarity.

| Action | Required role |
|---|---|
| View company | VIEWER+ |
| Edit company | MANAGER+ |
| Upload/remove logo | MANAGER+ |
| Deactivate company | OWNER |
| Add/manage members | OWNER — placeholder only this batch |
| Manage locations | MANAGER+ — placeholder only this batch |

If role insufficient:
- hide destructive actions
- disable edit actions with tooltip or helper text
- if user navigates manually and backend returns 403, show forbidden state

---

# PART 11 — TESTING

Add tests if testing setup exists. If not, at least keep code structured so tests can be added.

Recommended tests:

### Unit/component
- `useCompanyPermissions`
- `CompanyCreateForm` validation
- `CompanySelector` renders active company and switches
- `CompanyEmptyState` CTA

### Manual E2E checklist

1. User logs in as COMPANY_USER.
2. `/app` loads.
3. If no companies exist, redirects to `/app/onboarding/company`.
4. Empty submit shows validation errors.
5. Valid form calls `POST /api/companies`.
6. Created company becomes active.
7. User lands on `/app/companies/:companyId`.
8. `/app/companies` lists the created company.
9. CompanySelector displays company and can switch between multiple companies.
10. `/app/companies/new` creates second company.
11. `/app/companies/:companyId/settings` updates company fields.
12. Logo upload works with jpeg/png/webp.
13. Invalid file type rejected client-side.
14. Large file rejected client-side.
15. Remove logo works.
16. OWNER can see deactivate danger zone.
17. MANAGER/VIEWER cannot see OWNER-only danger zone.
18. 403 from backend shows forbidden state.
19. Logout clears activeCompanyId.
20. Refresh page restores session and active company.

---

# ACCEPTANCE CRITERIA

## Build

```bash
npm run type-check -w @flexup/web
npm run build -w @flexup/web
```

თუ shared package შეიცვალა:

```bash
npm run build -w @flexup/shared
```

## Runtime

```bash
cd apps/flexup-web
npm run dev
```

Frontend:
- `http://localhost:5173`

Backend:
- `http://localhost:3002`

## Functional

- `/app` protected route მუშაობს.
- unauthenticated user redirects login-ზე.
- unverified user redirects verification gate-ზე.
- COMPANY_USER with no company sees onboarding.
- Company create works end-to-end.
- Active company persists after refresh.
- Company list works.
- Company selector works.
- Company detail/settings works.
- Company edit works.
- Logo upload/remove works.
- Deactivate flow works for OWNER.
- UI handles backend validation/conflict/forbidden errors.
- i18n works ka/en.
- No worker-specific company flow.

## Design

- Uses DESIGN.md style:
  - ClickUp-like dashboard shell
  - cool gradient primary buttons
  - 12px cards
  - subtle borders/shadows
  - responsive sidebar behavior
- No heavy enterprise gray UI.
- Mobile is usable.

---

# OUT OF SCOPE

ამ batch-ში არ გააკეთო:

- Company members full frontend CRUD
- Locations full frontend CRUD
- Shifts/Flexpools/RateTemplates UI
- Admin companies UI
- Invitation token flow
- Billing/subscription
- Audit log
- Real-time updates
- Worker dashboard/mobile UI
- Backend API changes, გარდა shared schema/type export-ისა თუ frontend-ს სჭირდება

---

# SECURITY / CORRECTNESS CHECK

- [ ] Access token არ ინახება localStorage/sessionStorage-ში.
- [ ] Refresh token frontend-იდან არ იკითხება — HttpOnly cookie backend-managed რჩება.
- [ ] Active company store-ში ინახება მხოლოდ ID, არა sensitive data.
- [ ] Every company API call uses backend authorization; frontend role checks only UX-ია.
- [ ] FormData upload არ აყენებს manual `Content-Type`.
- [ ] API error handling uses `code`, not fragile message text.
- [ ] Logout clears active company.
- [ ] Worker role cannot access company dashboard.
- [ ] `@flexup/shared` types/schemas used where available.
- [ ] No secrets or tokens logged.

---

# ბოლოს

- ყველა acceptance criterion გაატარე.
- თუ რაიმე shared schema/type აკლია, დაამატე მინიმალურად და export გაასწორე.
- თუ route naming ან existing frontend pattern განსხვავდება, ჯერ არსებული pattern დაიცავი.
- Commit message:
  ```bash
  feat(web): add company onboarding and management dashboard (batch f2.1)
  ```
