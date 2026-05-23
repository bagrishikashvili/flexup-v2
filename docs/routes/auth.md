# Auth Routes

Controller: `src/auth/auth.controller.ts`  
Service: `src/auth/auth.service.ts`  
Base path: `/api/auth`

---

## Shared response type — `AuthTokensResponse`

```json
{
  "accessToken": "<JWT, 15min TTL>",
  "refreshToken": "<64-byte hex, 30d TTL>",
  "user": {
    "id": "cuid",
    "email": "user@example.com",
    "firstName": "Giorgi",
    "lastName": "Beridze",
    "role": "WORKER"
  }
}
```

---

## POST /api/auth/register

Registers a new user and issues tokens.

### Auth
Public — no token required.

### Request body
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | yes | valid email |
| `phoneNumber` | string | no | E.164 format (`+995...`) |
| `password` | string | yes | min 8 chars, must contain at least 1 letter and 1 number |
| `firstName` | string | yes | 1–100 chars |
| `lastName` | string | yes | 1–100 chars |
| `role` | enum | yes | `"WORKER"` or `"COMPANY_USER"` only |

```json
{
  "email": "giorgi@example.com",
  "phoneNumber": "+995599123456",
  "password": "Secret123",
  "firstName": "Giorgi",
  "lastName": "Beridze",
  "role": "WORKER"
}
```

### Responses
| Code | Meaning |
|------|---------|
| 201 | Created — returns `AuthTokensResponse` |
| 400 | Validation error |
| 409 | Email or phone already registered |

---

## POST /api/auth/login

Authenticates an existing user and issues tokens.

### Auth
Public — no token required.

### Request body
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | yes | valid email |
| `password` | string | yes | non-empty |

```json
{
  "email": "giorgi@example.com",
  "password": "Secret123"
}
```

### Responses
| Code | Meaning |
|------|---------|
| 200 | OK — returns `AuthTokensResponse` |
| 400 | Validation error |
| 401 | Invalid credentials or inactive account |

---

## POST /api/auth/refresh

Exchanges a valid refresh token for a new access token + rotated refresh token.  
Old refresh token is revoked. If a revoked token is reused, **all** user sessions are revoked (reuse detection).

### Auth
Public — no token required.

### Request body
| Field | Type | Required |
|-------|------|----------|
| `refreshToken` | string | yes |

```json
{
  "refreshToken": "<64-byte hex>"
}
```

### Responses
| Code | Meaning |
|------|---------|
| 200 | OK — returns `AuthTokensResponse` with new tokens |
| 400 | Validation error |
| 401 | Token not found, revoked, expired, or reuse detected |

---

## POST /api/auth/logout

Revokes the supplied refresh token (single-device logout).

### Auth
Required — `Authorization: Bearer <accessToken>`

### Request body
| Field | Type | Required |
|-------|------|----------|
| `refreshToken` | string | yes |

```json
{
  "refreshToken": "<64-byte hex>"
}
```

### Responses
| Code | Meaning |
|------|---------|
| 204 | No Content — token revoked |
| 401 | Missing or invalid access token |

---

## POST /api/auth/logout-all

Revokes **all** active refresh tokens for the current user (all-device logout).

### Auth
Required — `Authorization: Bearer <accessToken>`

### Request body
None.

### Responses
| Code | Meaning |
|------|---------|
| 204 | No Content — all sessions revoked |
| 401 | Missing or invalid access token |

---

## GET /api/auth/me

Returns the basic profile of the currently authenticated user (from JWT payload, no DB hit beyond guard).

### Auth
Required — `Authorization: Bearer <accessToken>`

### Request
No body, no query params.

### Response 200
```json
{
  "id": "cuid",
  "email": "giorgi@example.com",
  "firstName": "Giorgi",
  "lastName": "Beridze",
  "role": "WORKER"
}
```

### Error responses
| Code | Meaning |
|------|---------|
| 401 | Missing or invalid access token |
