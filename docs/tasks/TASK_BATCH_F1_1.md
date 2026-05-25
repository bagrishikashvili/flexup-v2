# Frontend Batch F1.1 — Foundation Setup

## ⚠ პირველი ნაბიჯი — წაიკითხე ეს ფაილები

1. `CLAUDE.md` (root-ში)
2. `docs/ARCHITECTURE.md` — ყველა ADR (განსაკუთრებით ADR-025 shared, ADR-029 cookies)
3. Root `package.json` — workspaces config
4. `packages/shared/src/` — enums, types, schemas (ეს იქნება frontend-ის contract)
5. `apps/flexup-backend/src/auth/` — auth endpoints (frontend-ი მათ გამოიყენებს)

თუ რომელიმე ცვლილება ეწინააღმდეგება CLAUDE.md-ს — **შემაჩერე და მკითხე**.

---

## INPUT (კონტექსტი)

რა გვაქვს უკვე (backend):
- სრული Auth (cookies-based refresh)
- Users module (profile)
- Companies + Members + Locations
- `packages/shared` types/enums/zod schemas
- Swagger documented endpoints
- CORS configured for `http://localhost:5173`
- Standardized error format with `code` field

რა აშენდება (ამ batch-ში):
- `apps/flexup-web` — Vite + React 19 SPA
- Complete frontend foundation
- **Working Login page** — vertical slice end-to-end

---

## GOAL

ააშენე production-grade frontend foundation. ბოლოს Login page უნდა მუშაობდეს backend-თან: user-ი შევა, ნახულობს profile-ს, logout-ი მუშაობს.

---

## კონკრეტული deliverables

### Part A — Project Setup

#### 1. `apps/flexup-web/` workspace

დაამატე root `package.json`-ში workspaces პატერნი თუ აუცილებელია (`apps/*` უკვე გვაქვს).

`apps/flexup-web/package.json`:
```json
{
  "name": "@flexup/web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@flexup/shared": "*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.7.3",
    "vite": "^6.0.0"
  }
}
```

#### 2. Dependencies (მკითხე ჯერ ყველაფერი)

**Core:**
- `react@19`, `react-dom@19`
- `vite@6`, `@vitejs/plugin-react`
- `typescript@5.7`

**Routing:**
- `@tanstack/react-router`
- `@tanstack/router-plugin` (Vite plugin for file-based routes)
- `@tanstack/router-devtools` (dev)

**Server state:**
- `@tanstack/react-query@5`
- `@tanstack/react-query-devtools` (dev)

**Forms:**
- `react-hook-form@7`
- `@hookform/resolvers`
- `zod` (already in shared)

**UI:**
- `tailwindcss@4`
- `@tailwindcss/vite` (Tailwind 4 Vite plugin)
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react` (icons)
- `sonner` (toasts)
- `@radix-ui/react-*` packages (per shadcn component)

**i18n:**
- `i18next`
- `react-i18next`
- `i18next-browser-languagedetector`

**State:**
- `zustand`

**Utils:**
- `date-fns` (date manipulation)

**Linting (dev):**
- `eslint`, `@eslint/js`
- `typescript-eslint`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `prettier`
- `eslint-config-prettier`

#### 3. `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // backend API proxy in dev
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
});
```

**მნიშვნელოვანი:** Dev-ში frontend `localhost:5173`-ზე, backend `localhost:3002`-ზე. Vite proxy აყენებს `/api` request-ებს backend-ზე **same-origin-ად** რომ cookies მუშაობდეს ნორმალურად.

#### 4. `tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

`tsconfig.node.json` — config files-ისთვის, standard Vite template.

#### 5. `index.html`

```html
<!doctype html>
<html lang="ka">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>flexup</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Part B — Source Structure

```
apps/flexup-web/
├── public/
├── src/
│   ├── main.tsx                          ← entry point
│   ├── routeTree.gen.ts                  ← auto-generated by TanStack Router
│   ├── styles/
│   │   └── globals.css                   ← Tailwind + shadcn variables
│   ├── routes/                           ← file-based routes
│   │   ├── __root.tsx                    ← root layout
│   │   ├── index.tsx                     ← / (landing/redirect)
│   │   └── auth/
│   │       ├── login.tsx
│   │       └── register.tsx
│   ├── features/
│   │   └── auth/
│   │       ├── api/
│   │       │   ├── auth.api.ts           ← React Query hooks
│   │       │   └── auth.queries.ts       ← query keys
│   │       ├── components/
│   │       │   └── LoginForm.tsx
│   │       └── stores/
│   │           └── auth.store.ts         ← Zustand
│   ├── shared/
│   │   ├── api/
│   │   │   ├── client.ts                 ← fetch wrapper
│   │   │   ├── refresh-interceptor.ts    ← 401 → refresh → retry
│   │   │   └── errors.ts                 ← error handling utils
│   │   ├── components/
│   │   │   ├── ui/                       ← shadcn components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── sonner.tsx
│   │   │   │   └── ...
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── utils/
│   │       └── cn.ts                     ← className helper
│   ├── lib/
│   │   ├── query-client.ts               ← TanStack Query setup
│   │   ├── router.ts                     ← TanStack Router setup
│   │   └── i18n.ts                       ← i18next setup
│   └── locales/
│       ├── ka/
│       │   ├── common.json
│       │   ├── auth.json
│       │   └── errors.json
│       └── en/
│           ├── common.json
│           ├── auth.json
│           └── errors.json
├── components.json                       ← shadcn config
├── eslint.config.js
├── .prettierrc
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

### Part C — Tailwind + shadcn Setup

#### 1. `src/styles/globals.css`

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark theme variables */
  }
}

* {
  border-color: hsl(var(--border));
}

body {
  font-family: 'Noto Sans Georgian', system-ui, -apple-system, sans-serif;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

**მნიშვნელოვანი:** `Noto Sans Georgian` font ქართული ენისთვის. ან Inter + Noto Sans Georgian fallback-ით. Google Fonts import-ი HTML-ში ან `@import`.

#### 2. `components.json` — shadcn config

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/shared/components",
    "utils": "@/shared/utils/cn",
    "ui": "@/shared/components/ui"
  }
}
```

#### 3. shadcn components install

⚠ **მნიშვნელოვანი:** shadcn copy-paste model-ია. CLI ბრძანებით ვამატებთ components-ს. **ჯერ მკითხე რომელი components-ი დაამატო:**

ამ batch-ისთვის საჭიროა:
- `button`
- `input`
- `label`
- `form` (React Hook Form integration)
- `card`
- `sonner` (toast notifications)
- `dropdown-menu` (language switcher, user menu)
- `avatar`
- `skeleton`
- `separator`
- `alert`

CLI:
```bash
npx shadcn@latest init
npx shadcn@latest add button input label form card sonner dropdown-menu avatar skeleton separator alert
```

### Part D — i18n Setup

#### 1. `src/lib/i18n.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import kaCommon from '@/locales/ka/common.json';
import kaAuth from '@/locales/ka/auth.json';
import kaErrors from '@/locales/ka/errors.json';
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enErrors from '@/locales/en/errors.json';

export const SUPPORTED_LANGUAGES = ['ka', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ka',
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: ['common', 'auth', 'errors'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    resources: {
      ka: { common: kaCommon, auth: kaAuth, errors: kaErrors },
      en: { common: enCommon, auth: enAuth, errors: enErrors },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'flexup-lang',
    },
  });

export { i18n };
```

#### 2. Translation files

`src/locales/ka/common.json`:
```json
{
  "appName": "flexup",
  "loading": "იტვირთება...",
  "error": "შეცდომა",
  "save": "შენახვა",
  "cancel": "გაუქმება",
  "delete": "წაშლა",
  "edit": "რედაქტირება",
  "submit": "გაგზავნა",
  "language": "ენა",
  "languages": {
    "ka": "ქართული",
    "en": "ინგლისური"
  },
  "theme": {
    "light": "ღია",
    "dark": "მუქი",
    "system": "სისტემური"
  }
}
```

`src/locales/ka/auth.json`:
```json
{
  "login": {
    "title": "შესვლა",
    "subtitle": "შეიყვანეთ თქვენი მონაცემები",
    "email": "ელ.ფოსტა",
    "emailPlaceholder": "name@example.com",
    "password": "პაროლი",
    "passwordPlaceholder": "შეიყვანეთ პაროლი",
    "submit": "შესვლა",
    "loading": "შესვლა...",
    "noAccount": "არ გაქვს ანგარიში?",
    "register": "რეგისტრაცია",
    "forgotPassword": "დაგავიწყდა პაროლი?"
  },
  "register": {
    "title": "რეგისტრაცია",
    "subtitle": "შექმენი ახალი ანგარიში",
    "firstName": "სახელი",
    "lastName": "გვარი",
    "phoneNumber": "ტელეფონის ნომერი",
    "passwordHint": "მინიმუმ 8 სიმბოლო, ერთი ასო და ერთი ციფრი",
    "iAm": "მე ვარ",
    "role": {
      "WORKER": "მუშა (FreeFlexer)",
      "COMPANY_USER": "კომპანიის წარმომადგენელი"
    },
    "submit": "რეგისტრაცია",
    "hasAccount": "უკვე გაქვს ანგარიში?",
    "login": "შესვლა"
  },
  "logout": "გასვლა"
}
```

`src/locales/ka/errors.json`:
```json
{
  "VALIDATION_ERROR": "მონაცემები არასწორია",
  "INVALID_CREDENTIALS": "არასწორი ელ.ფოსტა ან პაროლი",
  "TOKEN_EXPIRED": "სესია ამოიწურა",
  "TOKEN_INVALID": "სესია არასწორია, გთხოვთ ხელახლა შეხვიდე",
  "REFRESH_REUSE_DETECTED": "უსაფრთხოების მიზნით ყველა სესია გათიშულია",
  "EMAIL_TAKEN": "ეს ელ.ფოსტა უკვე გამოყენებულია",
  "PHONE_TAKEN": "ეს ნომერი უკვე გამოყენებულია",
  "NOT_FOUND": "ვერ მოიძებნა",
  "FORBIDDEN": "წვდომა აკრძალულია",
  "RATE_LIMIT_EXCEEDED": "ძალიან ბევრი მცდელობა. სცადეთ მოგვიანებით",
  "INTERNAL_ERROR": "სერვერის შეცდომა",
  "NETWORK_ERROR": "კავშირის შეცდომა",
  "UNKNOWN_ERROR": "უცნობი შეცდომა"
}
```

English-ის version-ი ანალოგიური. **გადათარგმნე ცხადად** ერთი-ერთზე — არ მოიყვანო ხელოვნური ფრაზები.

### Part E — API Client

#### 1. `src/shared/api/client.ts`

```typescript
import type { ApiErrorResponse } from '@flexup/shared';

const API_BASE = '/api'; // proxied to backend in dev

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly response: ApiErrorResponse,
  ) {
    super(response.message);
    this.name = 'ApiError';
  }

  get code(): string {
    return this.response.code || 'UNKNOWN_ERROR';
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, skipAuth = false, headers = {}, ...rest } = options;

  const init: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',     // cookies for refresh token
  };

  // Add access token from auth store
  if (!skipAuth) {
    const { getAccessToken } = await import('@/features/auth/stores/auth.store');
    const token = getAccessToken();
    if (token) {
      (init.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, init);

  if (!response.ok) {
    let errorBody: ApiErrorResponse;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = {
        statusCode: response.status,
        error: response.statusText,
        message: 'Request failed',
        code: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
        path,
      };
    }
    throw new ApiError(response.status, errorBody);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
```

#### 2. `src/shared/api/refresh-interceptor.ts`

```typescript
import { ApiError, apiRequest } from './client';
import type { AuthResponseWithoutRefresh } from '@flexup/shared';

let refreshPromise: Promise<AuthResponseWithoutRefresh> | null = null;

/**
 * Wraps an API call with auto-refresh logic.
 * If the call returns 401 with TOKEN_EXPIRED, refresh and retry once.
 */
export async function withRefresh<T>(
  apiCall: () => Promise<T>,
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      (error.code === 'TOKEN_EXPIRED' || error.code === 'TOKEN_INVALID')
    ) {
      // Refresh in-flight? Wait for it
      if (!refreshPromise) {
        refreshPromise = apiRequest<AuthResponseWithoutRefresh>(
          '/auth/refresh',
          { method: 'POST', skipAuth: true },
        ).finally(() => {
          refreshPromise = null;
        });
      }

      try {
        const newAuth = await refreshPromise;
        // Update access token in store
        const { setAccessToken } = await import('@/features/auth/stores/auth.store');
        setAccessToken(newAuth.accessToken, newAuth.user);
        
        // Retry once with new token
        return await apiCall();
      } catch (refreshError) {
        // Refresh failed — force logout
        const { logout } = await import('@/features/auth/stores/auth.store');
        logout();
        throw refreshError;
      }
    }
    throw error;
  }
}
```

⚠ **მნიშვნელოვანი:** circular import-ის თავიდან ასაცილებლად dynamic imports გამოვიყენე. ცალკე solution — Zustand store-ი outside of React-ის გამოყენება vanilla function-ებით.

### Part F — Auth Store (Zustand)

#### `src/features/auth/stores/auth.store.ts`

```typescript
import { create } from 'zustand';
import type { AuthUserDto } from '@flexup/shared';

interface AuthState {
  accessToken: string | null;
  user: AuthUserDto | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUserDto) => void;
  setAccessToken: (token: string, user: AuthUserDto) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (token, user) => set({ 
    accessToken: token, 
    user, 
    isAuthenticated: true 
  }),
  setAccessToken: (token, user) => set({ 
    accessToken: token, 
    user, 
    isAuthenticated: true 
  }),
  logout: () => set({ 
    accessToken: null, 
    user: null, 
    isAuthenticated: false 
  }),
}));

// Vanilla accessors for use outside React
export const getAccessToken = () => useAuthStore.getState().accessToken;
export const setAccessToken = (token: string, user: AuthUserDto) =>
  useAuthStore.getState().setAuth(token, user);
export const logout = () => useAuthStore.getState().logout();
```

**მნიშვნელოვანი:** Access token მხოლოდ memory-ში — refresh-ი არ ხდება page reload-ისთვის ავტომატურად. გვერდის გადატვირთვის შემდეგ user-ი ისევ შესვლის გვერდს ხედავს, **მაგრამ** refresh cookie-ი ჯერ კიდევ valid-ია, ამიტომ:

**On app mount → check session:**
```typescript
// in main.tsx ან root layout
useEffect(() => {
  // Try to refresh on app boot
  apiRequest<AuthResponseWithoutRefresh>('/auth/refresh', {
    method: 'POST',
    skipAuth: true,
  })
    .then((auth) => setAccessToken(auth.accessToken, auth.user))
    .catch(() => {/* no session, stay logged out */});
}, []);
```

ეს იძლევა smooth UX-ს — user-ი remains logged in across reloads.

### Part G — Routing Setup

#### 1. `src/lib/router.ts`

```typescript
import { createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import { queryClient } from './query-client';

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

#### 2. `src/lib/query-client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,           // 1 წუთი
      gcTime: 5 * 60 * 1000,           // 5 წუთი
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // არ retry-ი validation/auth errors
        if (error instanceof ApiError && [400, 401, 403, 404].includes(error.status)) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
```

#### 3. Root route — `src/routes/__root.tsx`

```typescript
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { Toaster } from 'sonner';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster position="top-right" richColors />
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </>
      )}
    </>
  );
}
```

#### 4. Index route — `src/routes/index.tsx`

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/features/auth/stores/auth.store';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    throw redirect({
      to: isAuthenticated ? '/dashboard' : '/auth/login',
    });
  },
});
```

#### 5. Login route — `src/routes/auth/login.tsx`

```typescript
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@flexup/shared';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiRequest, ApiError } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import type { AuthResponseWithoutRefresh } from '@flexup/shared';

// shadcn imports
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: LoginInput) =>
      apiRequest<AuthResponseWithoutRefresh>('/auth/login', {
        method: 'POST',
        body: data,
        skipAuth: true,
      }),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      toast.success(t('login.title'));
      navigate({ to: '/dashboard' });
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : 'UNKNOWN_ERROR';
      toast.error(tErrors(code, { defaultValue: tErrors('UNKNOWN_ERROR') }));
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('login.title')}</CardTitle>
          <CardDescription>{t('login.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit((data) => mutation.mutate(data))} 
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.email')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder={t('login.emailPlaceholder')} 
                        autoComplete="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.password')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={t('login.passwordPlaceholder')} 
                        autoComplete="current-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? t('login.loading') : t('login.submit')}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t('login.noAccount')}{' '}
                <Link to="/auth/register" className="text-primary hover:underline">
                  {t('login.register')}
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 6. Dashboard route (placeholder) — `src/routes/dashboard.tsx`

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { apiRequest } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/button';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore — still log out client-side
    }
    logout();
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t('appName')}</h1>
          <Button variant="outline" onClick={handleLogout}>
            {t('logout', { ns: 'auth' })}
          </Button>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">გამარჯობა, {user?.firstName}!</h2>
          <p className="text-muted-foreground">
            Email: {user?.email}
          </p>
          <p className="text-muted-foreground">
            Role: {user?.role}
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Part H — Main Entry

#### `src/main.tsx`

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from '@/lib/router';
import { queryClient } from '@/lib/query-client';
import '@/lib/i18n';
import '@/styles/globals.css';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import type { AuthResponseWithoutRefresh } from '@flexup/shared';

// Try to restore session before rendering
const bootstrapAuth = async (): Promise<void> => {
  try {
    const auth = await apiRequest<AuthResponseWithoutRefresh>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    });
    useAuthStore.getState().setAuth(auth.accessToken, auth.user);
  } catch {
    // No active session — proceed unauthenticated
  }
};

bootstrapAuth().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
```

### Part I — Language Switcher Component

#### `src/shared/components/LanguageSwitcher.tsx`

```typescript
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGUAGES.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => i18n.changeLanguage(lng)}
            className={i18n.language === lng ? 'bg-accent' : ''}
          >
            {t(`languages.${lng}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## ACCEPTANCE CRITERIA

### Build & startup
```bash
# Root-დან
npm install
npm run build -w @flexup/shared
cd apps/flexup-web
npm run dev
```

### Manual E2E flow

**1. Frontend ხელმისაწვდომია:**
- Browser: `http://localhost:5173`
- Auto-redirect to `/auth/login`

**2. Login page იხსნება:**
- შრიფტი ქართული Noto Sans
- LanguageSwitcher header-ში (ka/en toggle)
- shadcn-style form

**3. Validation მუშაობს client-side-ად:**
- Submit empty form → field errors (Zod schemas)
- Invalid email → "valid email" error

**4. Login წარმატებული:**
- Use credentials of existing test user (Batch 1.2-დან)
- Browser DevTools → Application → Cookies: `flexup_refresh` cookie ჩანს (HttpOnly)
- Redirect to `/dashboard`
- Dashboard აჩვენებს user-ის სახელს, email-ს, role-ს

**5. Login არასწორი credentials-ით:**
- Toast notification: "არასწორი ელ.ფოსტა ან პაროლი" (ქართულად)
- ენის გადართვა → იგივე message ინგლისურად

**6. Refresh ფანჯრის გადატვირთვისას:**
- F5 reload
- Brief loading
- ისევ dashboard-ი (refresh cookie + bootstrap-ი მუშაობს)

**7. Logout:**
- Dashboard-ზე "გასვლა" ღილაკი
- Click → redirect to `/auth/login`
- DevTools → Cookies: `flexup_refresh` წაშლილია

**8. Rate limit-ი:**
- სცადე login 6-ჯერ wrong password-ით
- მე-6-ზე → toast "ძალიან ბევრი მცდელობა"

**9. Network error:**
- Backend dampaose (`docker compose stop backend`)
- Login attempt → toast "კავშირის შეცდომა" (ან network error)

**10. CORS-ი working:**
- Browser DevTools → Network tab
- ნახე რომ `Access-Control-Allow-Credentials: true` ბრუნდება

**11. Type-safety:**
- Try changing field name in LoginInput type
- TypeScript error in LoginForm.tsx

**12. Linter:**
```bash
npm run lint
```
**Expected:** no errors.

**13. TypeScript:**
```bash
npm run type-check
```
**Expected:** no errors.

---

## CONSTRAINTS

1. **არ შეცვალო backend code** — frontend მხოლოდ
2. **არ შეცვალო `packages/shared`** — გამოყენება მხოლოდ
3. **არ დაამატო state management library გარდა Zustand-ისა** — Redux/Jotai overkill
4. **არ შეცვალო Tailwind 4 setup-ი 3-ზე** — modern stack
5. **არ გამოიყენო `any`** — explicit types
6. **არ შენახო refresh token JavaScript-ში** — მხოლოდ HttpOnly cookie
7. **არ შენახო access token localStorage-ში** — only Zustand (memory)
8. **არ შექმნა frontend-side schemas** — shared-დან მოდის
9. **არ გამოიყენო class components** — function only
10. **არ შექმნა components without translations** — ყოველი text `t('key')`

---

## SECURITY REVIEW

- [ ] Access token მხოლოდ memory-ში (არა localStorage)
- [ ] Refresh token cookie-ში მუშაობს automatic-ად
- [ ] CORS-ი credentials-ით მუშაობს
- [ ] Auth bootstrap-ი app start-ზე
- [ ] Refresh interceptor 401-ზე ერთხელ
- [ ] Failed refresh → forced logout
- [ ] XSS — DOMPurify არ გვჭირდება ჯერ (no user-generated HTML displayed)

---

## OUT OF SCOPE (ამ batch-ში არ კეთდება)

- Register page (next batch — F1.2)
- Profile page (F1.3)
- Forgot password (V2)
- Email verification UI (V2)
- Theme switcher (light/dark) — placeholder ready, switcher next batch
- Tests (Vitest setup next batch)
- E2E (Playwright next batch)
- Companies, Locations UI (F1.4-F1.7)
- WebSocket integration (later)
- PWA / offline support (later)

---

## ADR-ი

`docs/ARCHITECTURE.md`-ში დაამატე:

**ADR-031: Frontend stack — Vite + React 19 + TanStack**
- Decision: Vite + React 19, TanStack Router (file-based), TanStack Query, shadcn/ui, Tailwind 4
- Reason: modern, type-safe, production-grade SPA stack with minimal magic

**ADR-032: Access token in memory only**
- Decision: Zustand store, no localStorage persistence
- Reason: minimize XSS attack surface
- Trade-off: requires refresh on every page load (mitigated by bootstrap-ი)

**ADR-033: Vite proxy in development**
- Decision: `/api/*` proxied to `http://localhost:3002`
- Reason: cookies work same-origin without complex CORS dance in dev
- Production: separate domains via proper CORS

**ADR-034: i18n with namespaces**
- Decision: `react-i18next`, namespaces: `common`, `auth`, `errors`
- Reason: code-split-friendly, error codes map directly to error.json keys

---

## დასასრულს

- ყველა 13 acceptance criterion უნდა გავიდეს
- Security review სრულად
- ADR-31 to ADR-34 ჩაწერილი
- Commit: `feat: frontend foundation + login (batch f1.1)`

🎉 **First vertical slice complete!** შემდეგი — Register page, Profile, Theme switcher.

---

## **შემაჩერე** თუ:
- Dependencies დასადასტურებლად (ბევრია — გადახედე list-ი)
- shadcn components install-ი (CLI ცარიელ ფოლდერშია გასაშვები)
- Tailwind 4 vs 3 (Tailwind 4 chosen — modern)
- TanStack Router file-based config-ი (Vite plugin ცარიელად მუშაობს)
- Google Fonts import (HTML-ში თუ CSS-ში?)
