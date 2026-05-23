# Company Members Routes

Controller: `src/company-members/company-members.controller.ts`
Service: `src/company-members/company-members.service.ts`
Base path: `/api/companies/:companyId/members`
All endpoints require authentication and `CompanyAccessGuard`.

---

## Shared response — `MemberResponse`
```json
{
  "id": "cuid",
  "userId": "cuid",
  "user": {
    "id": "cuid",
    "email": "manager@test.com",
    "firstName": "Manager",
    "lastName": "User",
    "avatarUrl": null
  },
  "role": "MANAGER",
  "createdAt": "2026-05-23T10:00:00.000Z"
}
```

---

## Role hierarchy and protected rules

- `OWNER > MANAGER > VIEWER` — `@RequireCompanyRole(MANAGER)` allows MANAGER+.
- **Last-owner protection (service layer):** cannot demote, remove, or leave when the actor is the only OWNER. Returns `400 BadRequest`.
- **Self-removal:** OWNERs/MANAGERs/VIEWERs cannot use `DELETE /members/:memberId` against themselves — they must use `DELETE /members/me`.
- **WORKER users** cannot be added as members (semantic constraint, `400 BadRequest`).

---

## GET /api/companies/:companyId/members

Lists members. Sorted by role (OWNER, MANAGER, VIEWER), then `createdAt ASC`.

### Auth
`VIEWER`+ membership (or `ADMIN`).

### Responses
| Code | Meaning |
|---|---|
| 200 | `MemberResponse[]` |
| 401 | Not authenticated |
| 403 | Not a member of this company |

---

## POST /api/companies/:companyId/members

Adds an existing registered user as a member. Looks up the user by lowercased email.

### Auth
`OWNER` membership (or `ADMIN`).

### Request body
| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | valid email |
| `role` | enum | yes | `OWNER` / `MANAGER` / `VIEWER` |

### Responses
| Code | Meaning |
|---|---|
| 201 | `MemberResponse` |
| 400 | Validation, or target user has `WORKER` role |
| 401 | Not authenticated |
| 403 | Insufficient company role |
| 404 | No registered user with that email |
| 409 | User is already a member of this company |

---

## PATCH /api/companies/:companyId/members/:memberId

Changes a member's role. Cannot demote the last OWNER.

### Auth
`OWNER` membership (or `ADMIN`).

### Request body
| Field | Type | Required |
|---|---|---|
| `role` | enum | yes (`OWNER` / `MANAGER` / `VIEWER`) |

### Responses
| Code | Meaning |
|---|---|
| 200 | `MemberResponse` |
| 400 | Validation, or attempting to demote the last owner |
| 401 | Not authenticated |
| 403 | Insufficient company role |
| 404 | Member not found |

---

## DELETE /api/companies/:companyId/members/:memberId

Removes a member. Cannot remove yourself (use `DELETE /members/me`). Cannot remove the last OWNER.

### Auth
`OWNER` membership (or `ADMIN`).

### Responses
| Code | Meaning |
|---|---|
| 204 | No Content |
| 400 | Cannot remove the last owner / cannot remove yourself this way |
| 401 | Not authenticated |
| 403 | Insufficient company role |
| 404 | Member not found |

---

## DELETE /api/companies/:companyId/members/me

The authenticated user leaves the company. The last OWNER must transfer ownership or deactivate the company first.

### Auth
`VIEWER`+ membership.

### Responses
| Code | Meaning |
|---|---|
| 204 | No Content |
| 400 | Last OWNER cannot leave |
| 401 | Not authenticated |
| 403 | Not a member of this company |
| 404 | Membership not found |
