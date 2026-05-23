# Locations Routes

Controller: `src/locations/locations.controller.ts`
Service: `src/locations/locations.service.ts`
Base path: `/api/companies/:companyId/locations`
All endpoints require authentication + `CompanyAccessGuard`.

---

## Shared response — `LocationResponse`
```json
{
  "id": "cuid",
  "companyId": "cuid",
  "name": "Saburtalo Branch",
  "address": "Vazha-Pshavela Ave 76",
  "city": "Tbilisi",
  "country": "GE",
  "postalCode": "0186",
  "latitude": 41.7232,
  "longitude": 44.7456,
  "isActive": true,
  "createdAt": "2026-05-23T10:00:00.000Z",
  "updatedAt": "2026-05-23T10:00:00.000Z"
}
```
`postalCode`, `latitude`, `longitude` can be `null`.

---

## Access control
- All routes require `JwtAuthGuard` + `CompanyAccessGuard` (membership). Non-members → 403.
- Role hierarchy: `OWNER > MANAGER > VIEWER`. See ADR-019.
- Cross-company access is blocked by `CompanyAccessGuard`; additionally every service query is scoped by `companyId`.

---

## POST /api/companies/:companyId/locations

Creates a location under the given company.

### Auth
`MANAGER`+ membership (or `ADMIN`).

### Request body
| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | yes | 1–200 chars |
| `address` | string | yes | 1–500 chars |
| `city` | string | yes | 1–100 chars |
| `country` | string | no | ISO 3166-1 alpha-2, default `GE` |
| `postalCode` | string | no | max 20 chars |
| `latitude` | number | no | -90..90 |
| `longitude` | number | no | -180..180 |

**Rule:** `latitude` and `longitude` must be provided together (both or neither). Partial → 400.

### Responses
| Code | Meaning |
|---|---|
| 201 | `LocationResponse` |
| 400 | Validation error, or unpaired coordinates |
| 401 | Not authenticated |
| 403 | Insufficient company role / not a member |

---

## GET /api/companies/:companyId/locations

Lists company locations with pagination, search, and optional geo-radius filter.

### Auth
`VIEWER`+ membership (or `ADMIN`).

### Query params
| Param | Type | Default | Rules |
|---|---|---|---|
| `page` | integer | `1` | min 1 |
| `limit` | integer | `20` | 1–100 |
| `search` | string | — | ILIKE on `name`, `address`, `city` |
| `city` | string | — | case-insensitive exact match |
| `isActive` | boolean | — | `true` / `false` |
| `nearLatitude` | number | — | -90..90; must accompany `nearLongitude` |
| `nearLongitude` | number | — | -180..180; must accompany `nearLatitude` |
| `radiusKm` | number | `10` (if geo given) | 1–100 |

**Geo mode:** when both `nearLatitude` and `nearLongitude` are present, results are filtered by Haversine distance ≤ `radiusKm` and sorted by distance ASC. Otherwise sorted by `createdAt DESC`. Only locations with non-null coordinates participate in geo mode (see ADR-023).

### Response 200
```json
{
  "data": [ /* LocationResponse[] */ ],
  "meta": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 }
}
```

### Error responses
| Code | Meaning |
|---|---|
| 400 | Only one of `nearLatitude` / `nearLongitude` given |
| 401 | Not authenticated |
| 403 | Not a member |

---

## GET /api/companies/:companyId/locations/:locationId

### Auth
`VIEWER`+ membership.

### Responses
| Code | Meaning |
|---|---|
| 200 | `LocationResponse` |
| 401 | Not authenticated |
| 403 | Not a member |
| 404 | Location not found in this company |

---

## PATCH /api/companies/:companyId/locations/:locationId

Updates fields. All optional. Coordinate pairing is validated against the resolved state (DB + payload).

### Auth
`MANAGER`+ membership.

### Request body
Same fields as `POST`, all optional.

### Responses
| Code | Meaning |
|---|---|
| 200 | `LocationResponse` |
| 400 | Validation / unpaired coordinates |
| 401 | Not authenticated |
| 403 | Insufficient company role |
| 404 | Location not found |

---

## PATCH /api/companies/:companyId/locations/:locationId/active

Toggles `isActive` without deleting. Used to temporarily disable a location.

### Auth
`MANAGER`+ membership.

### Request body
```json
{ "isActive": false }
```

### Responses
| Code | Meaning |
|---|---|
| 200 | `LocationResponse` |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Insufficient company role |
| 404 | Location not found |

---

## DELETE /api/companies/:companyId/locations/:locationId

**Hard delete.** Blocked when any `Shift` or `ShiftSeries` references this location — use the `active` toggle instead. See ADR-024.

### Auth
`OWNER` membership (or `ADMIN`).

### Responses
| Code | Meaning |
|---|---|
| 204 | No Content |
| 401 | Not authenticated |
| 403 | Insufficient company role |
| 404 | Location not found |
| 409 | Location has associated shifts — deactivate instead |
