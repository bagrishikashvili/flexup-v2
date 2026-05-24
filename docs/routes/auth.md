# Auth Routes

Controller: `src/auth/auth.controller.ts`  
Service: `src/auth/auth.service.ts`  
Base path: `/api/auth`

---

## Response types

### `AuthResponseWithoutRefresh` (current — mini-batch 2.Y)

```json
{
  "accessToken": "<JWT, 15min TTL>",
  "user": {
    "id": "cuid",
    "email": "user@example.com",
    "firstName": "Giorgi",
    "lastName": "Beridze",
    "role": "WORKER"
  }
}
```

**Refresh token** is NOT in the JSON body. It is set as an **HttpOnly cookie** (`flexup_refresh`), path-restricted to `/api/auth`.

---

## POST /api/auth/register

Registers a new user, issues access token in body and refresh token as cookie.

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

### Responses
| Code | Meaning |
|------|---------|
| 201 | Created — body: `AuthResponseWithoutRefresh`, `Set-Cookie: flexup_refresh=...; HttpOnly; SameSite=Lax; Path=/api/auth` |
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

### Responses
| Code | Meaning |
|------|---------|
| 200 | OK — body: `AuthResponseWithoutRefresh`, `Set-Cookie: flexup_refresh` |
| 400 | Validation error |
| 401 | Invalid credentials or inactive account |

---

## POST /api/auth/refresh

Reads refresh token from HttpOnly cookie. Revokes old token, issues new access token and rotated cookie.  
If a revoked token is reused, **all** user sessions are revoked (reuse detection).

### Auth
Public — refresh token from cookie (`flexup_refresh`).

### Request body
None (cookie carries the token).

### Responses
| Code | Meaning |
|------|---------|
| 200 | OK — body: `AuthResponseWithoutRefresh`, rotated `Set-Cookie: flexup_refresh` |
| 401 | Cookie missing (`TOKEN_INVALID`), token revoked (`REFRESH_REUSE_DETECTED`), or expired (`TOKEN_EXPIRED`) |

---

## POST /api/auth/logout

Revokes the current session refresh token (from cookie) and clears the cookie.

### Auth
Required — `Authorization: Bearer <accessToken>`

### Request body
None.

### Responses
| Code | Meaning |
|------|---------|
| 204 | No Content — token revoked, cookie cleared |
| 401 | Missing or invalid access token |

---

## POST /api/auth/logout-all

Revokes **all** active refresh tokens for the current user (all-device logout) and clears the cookie.

### Auth
Required — `Authorization: Bearer <accessToken>`

### Request body
None.

### Responses
| Code | Meaning |
|------|---------|
| 204 | No Content — all sessions revoked, cookie cleared |
| 401 | Missing or invalid access token |

---

## GET /api/auth/me

Returns the basic profile of the currently authenticated user.

### Auth
Required — `Authorization: Bearer <accessToken>`

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
