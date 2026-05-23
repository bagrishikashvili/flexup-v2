# Users Routes

Controller: `src/users/users.controller.ts`  
Service: `src/users/users.service.ts`  
Base path: `/api/users`  
All endpoints require authentication unless noted.

---

## Shared response type — `UserPublicResponse`

```json
{
  "id": "cuid",
  "email": "giorgi@example.com",
  "phoneNumber": "+995599123456",
  "firstName": "Giorgi",
  "lastName": "Beridze",
  "avatarUrl": "http://localhost:3000/api/uploads/avatars/cuid-1716451200000.webp",
  "role": "WORKER",
  "emailVerified": false,
  "phoneVerified": false,
  "createdAt": "2026-05-23T10:00:00.000Z",
  "updatedAt": "2026-05-23T10:00:00.000Z"
}
```

`phoneNumber` and `avatarUrl` can be `null`.

---

# My Profile (authenticated user)

---

## GET /api/users/me

Returns the full profile of the currently authenticated user.

### Auth
Required.

### Request
No body, no query params.

### Responses
| Code | Meaning |
|------|---------|
| 200 | `UserPublicResponse` |
| 401 | Not authenticated |

---

## PATCH /api/users/me

Updates the display name of the authenticated user. All fields are optional; send only what should change.

### Auth
Required.

### Request body
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `firstName` | string | no | 1–100 chars |
| `lastName` | string | no | 1–100 chars |

```json
{
  "firstName": "Giorgi",
  "lastName": "Beridze"
}
```

### Responses
| Code | Meaning |
|------|---------|
| 200 | Updated `UserPublicResponse` |
| 400 | Validation error |
| 401 | Not authenticated |

---

## POST /api/users/me/avatar

Uploads a new avatar image. Replaces existing avatar if present. Image is processed by Sharp: resized to max 512×512, saved as WebP q85.

### Auth
Required.

### Request
`multipart/form-data` — field name: `file`

| Constraint | Value |
|-----------|-------|
| Allowed types | `image/jpeg`, `image/png`, `image/webp` |
| Max size | configured via `MAX_UPLOAD_SIZE_BYTES` (default 5 MB) |

### Responses
| Code | Meaning |
|------|---------|
| 200 | Updated `UserPublicResponse` (with new `avatarUrl`) |
| 400 | Invalid file type or file too large |
| 401 | Not authenticated |

---

## DELETE /api/users/me/avatar

Removes the avatar. Deletes the file from disk and sets `avatarUrl` to `null`.

### Auth
Required.

### Request
No body.

### Responses
| Code | Meaning |
|------|---------|
| 200 | Updated `UserPublicResponse` (`avatarUrl: null`) |
| 401 | Not authenticated |

---

## POST /api/users/me/change-password

Changes the password. Requires current password for verification.  
Side effect: **all refresh tokens for this user are revoked** (all sessions logged out).

### Auth
Required.

### Request body
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `currentPassword` | string | yes | non-empty |
| `newPassword` | string | yes | min 8 chars, must contain at least 1 letter and 1 number |

```json
{
  "currentPassword": "OldSecret123",
  "newPassword": "NewSecret456"
}
```

### Responses
| Code | Meaning |
|------|---------|
| 204 | No Content — password changed, all sessions revoked |
| 400 | Validation error |
| 401 | Wrong `currentPassword` |

---

## POST /api/users/me/change-email

Changes the email address. Requires current password for verification.  
Sets `emailVerified = false`. Sessions remain active.

### Auth
Required.

### Request body
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `currentPassword` | string | yes | non-empty |
| `newEmail` | string | yes | valid email |

```json
{
  "currentPassword": "Secret123",
  "newEmail": "new@example.com"
}
```

### Responses
| Code | Meaning |
|------|---------|
| 200 | Updated `UserPublicResponse` |
| 400 | Validation error |
| 401 | Wrong `currentPassword` |
| 409 | Email already in use by another account |

---

## POST /api/users/me/change-phone

Changes the phone number. Requires current password for verification.  
Sets `phoneVerified = false`. Sessions remain active.

### Auth
Required.

### Request body
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `currentPassword` | string | yes | non-empty |
| `newPhoneNumber` | string | yes | E.164 format (`+995...`) |

```json
{
  "currentPassword": "Secret123",
  "newPhoneNumber": "+995599000000"
}
```

### Responses
| Code | Meaning |
|------|---------|
| 200 | Updated `UserPublicResponse` |
| 400 | Validation error |
| 401 | Wrong `currentPassword` |
| 409 | Phone number already in use by another account |

---

## DELETE /api/users/me

Deactivates (soft-deletes) the authenticated user's own account. Requires password confirmation.  
Sets `isActive = false` and revokes all refresh tokens. Account can only be reactivated by an Admin.

### Auth
Required.

### Request body
| Field | Type | Required |
|-------|------|----------|
| `password` | string | yes |

```json
{
  "password": "Secret123"
}
```

### Responses
| Code | Meaning |
|------|---------|
| 204 | No Content — account deactivated |
| 401 | Wrong `password` |

---

# Admin Endpoints

All admin endpoints require `role: ADMIN`.

---

## GET /api/users

Lists all users with pagination and optional filters.

### Auth
Required + `ADMIN` role.

### Query params
| Param | Type | Default | Rules |
|-------|------|---------|-------|
| `page` | integer | `1` | min 1 |
| `limit` | integer | `20` | 1–100 |
| `role` | enum | — | `WORKER`, `COMPANY_USER`, `ADMIN` |
| `isActive` | boolean | — | `true` or `false` (string in query) |
| `search` | string | — | ILIKE search across email, firstName, lastName |

### Response 200
```json
{
  "data": [ /* UserPublicResponse[] */ ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### Error responses
| Code | Meaning |
|------|---------|
| 401 | Not authenticated |
| 403 | Not ADMIN |

---

## GET /api/users/:id

Returns a single user by ID.

### Auth
Required + `ADMIN` role.

### Path params
| Param | Type |
|-------|------|
| `id` | cuid string |

### Responses
| Code | Meaning |
|------|---------|
| 200 | `UserPublicResponse` |
| 401 | Not authenticated |
| 403 | Not ADMIN |
| 404 | User not found |

---

## PATCH /api/users/:id/active

Activates or deactivates a user account.

### Auth
Required + `ADMIN` role.

### Path params
| Param | Type |
|-------|------|
| `id` | cuid string |

### Request body
| Field | Type | Required |
|-------|------|----------|
| `isActive` | boolean | yes |

```json
{ "isActive": true }
```

### Responses
| Code | Meaning |
|------|---------|
| 200 | Updated `UserPublicResponse` |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Not ADMIN |
| 404 | User not found |
