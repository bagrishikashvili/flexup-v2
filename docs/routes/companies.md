# Companies Routes

Controller: `src/companies/companies.controller.ts`
Service: `src/companies/companies.service.ts`
Base path: `/api/companies` (+ admin endpoints under `/api/admin/companies`)
All endpoints require authentication.

---

## Shared response types

### `CompanyPublicResponse`
```json
{
  "id": "cuid",
  "name": "Test Cafe",
  "legalName": "Test Cafe LLC",
  "logoUrl": "http://localhost:3000/api/uploads/company-logos/<id>-<ts>.webp",
  "websiteUrl": "https://testcafe.ge",
  "defaultCurrency": "GEL",
  "isVerified": false,
  "isActive": true,
  "createdAt": "2026-05-23T10:00:00.000Z",
  "updatedAt": "2026-05-23T10:00:00.000Z",
  "currentUserRole": "OWNER"
}
```
`legalName`, `logoUrl`, `websiteUrl` can be `null`. `currentUserRole` is present only when the request was made by a member.

### `CompanyDetailResponse`
Extends `CompanyPublicResponse` with:
```json
{
  "registrationNumber": "12345678",
  "vatNumber": null,
  "memberCount": 1,
  "verifiedAt": null
}
```

---

## Access control

| Aspect | Guard |
|---|---|
| Authentication | global `JwtAuthGuard` |
| Membership + role | `CompanyAccessGuard` + `@RequireCompanyRole(...)` |
| Admin endpoints | `RolesGuard` + `@Roles(ADMIN)` |

Role hierarchy: `OWNER > MANAGER > VIEWER`. `@RequireCompanyRole(MANAGER)` allows MANAGER or OWNER. Non-members of a company always receive **403 Forbidden** (never 404) to avoid leaking company existence. `ADMIN` users bypass `CompanyAccessGuard` membership checks and are treated as synthetic OWNERs.

---

## POST /api/companies

Creates a company. The authenticated user is added as the first `OWNER` member atomically.

### Auth
Required. User's platform role must not be `WORKER`.

### Request body
| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | yes | 2–200 chars |
| `legalName` | string | no | max 200 chars |
| `registrationNumber` | string | no | max 50 chars |
| `vatNumber` | string | no | max 50 chars |
| `websiteUrl` | string | no | valid URL |
| `defaultCurrency` | string | no | ISO 4217 (3 uppercase letters), default `GEL` |

### Responses
| Code | Meaning |
|---|---|
| 201 | `CompanyDetailResponse` (`currentUserRole: "OWNER"`) |
| 400 | Validation error, or user has `WORKER` role |
| 401 | Not authenticated |

---

## GET /api/companies/mine

Lists every company the authenticated user is a member of, with their role on each. Sorted by `company.updatedAt DESC`.

### Responses
| Code | Meaning |
|---|---|
| 200 | `CompanyPublicResponse[]` (each with `currentUserRole`) |
| 401 | Not authenticated |

---

## GET /api/companies/:companyId

### Auth
Required + `VIEWER`+ membership (or `ADMIN`).

### Responses
| Code | Meaning |
|---|---|
| 200 | `CompanyDetailResponse` |
| 401 | Not authenticated |
| 403 | Not a member of this company |

---

## PATCH /api/companies/:companyId

Updates company info. All fields optional.

### Auth
Required + `MANAGER`+ membership (or `ADMIN`).

### Request body
Same fields as `POST /api/companies`, all optional.

### Responses
| Code | Meaning |
|---|---|
| 200 | `CompanyDetailResponse` |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Insufficient company role |

---

## POST /api/companies/:companyId/logo

Uploads a company logo. Replaces the existing one if present. Sharp resizes to max 512×512, encodes as WebP q85, stored at `uploads/company-logos/<companyId>-<ts>.webp`.

### Auth
Required + `MANAGER`+ membership (or `ADMIN`).

### Request
`multipart/form-data` — field `file`. Same constraints as user avatars (`image/jpeg|png|webp`, max `MAX_UPLOAD_SIZE_BYTES`).

### Responses
| Code | Meaning |
|---|---|
| 200 | `CompanyDetailResponse` (with new `logoUrl`) |
| 400 | Invalid type / file too large |
| 401 | Not authenticated |
| 403 | Insufficient company role |

---

## DELETE /api/companies/:companyId/logo

Removes the logo from disk and sets `logoUrl = null`.

### Auth
Required + `MANAGER`+ membership.

### Responses
| Code | Meaning |
|---|---|
| 200 | `CompanyDetailResponse` (`logoUrl: null`) |
| 401 | Not authenticated |
| 403 | Insufficient company role |

---

## DELETE /api/companies/:companyId

Soft-deactivates the company (`isActive = false`). Records remain.

### Auth
Required + `OWNER` membership (or `ADMIN`).

### Responses
| Code | Meaning |
|---|---|
| 204 | No Content |
| 401 | Not authenticated |
| 403 | Insufficient company role |

---

# Admin endpoints

All require platform `ADMIN` role.

## GET /api/admin/companies

Paginated listing.

### Query params
| Param | Type | Default | Rules |
|---|---|---|---|
| `page` | integer | `1` | min 1 |
| `limit` | integer | `20` | 1–100 |
| `search` | string | — | ILIKE on `name` |
| `isActive` | boolean | — | `true` / `false` |
| `isVerified` | boolean | — | `true` / `false` |

### Response 200
```json
{
  "data": [ /* CompanyDetailResponse[] */ ],
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

---

## POST /api/admin/companies/:companyId/verify

Marks the company as verified. Sets `isVerified = true`, `verifiedAt = now()`.

### Responses
| Code | Meaning |
|---|---|
| 200 | `CompanyDetailResponse` |
| 401 / 403 | Not authenticated / not ADMIN |
| 404 | Company not found |

---

## PATCH /api/admin/companies/:companyId/active

Activates or deactivates a company.

### Request body
```json
{ "isActive": true }
```

### Responses
| Code | Meaning |
|---|---|
| 200 | `CompanyDetailResponse` |
| 401 / 403 | Not authenticated / not ADMIN |
| 404 | Company not found |
