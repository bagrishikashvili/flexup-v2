# API Routes Index

Base path: `/api`
All authenticated endpoints require `Authorization: Bearer <accessToken>` header.
Live OpenAPI docs (dev): [`/api/docs`](http://localhost:3002/api/docs).

## Error response envelope (ADR-028)

Every error returns the same shape — frontend should switch on `code`, not `message`:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [{ "field": "email", "message": "Invalid email" }],
  "timestamp": "2026-05-24T10:00:00.000Z",
  "path": "/api/auth/login"
}
```

`details` is present only for validation failures (Zod or class-validator). The full list of `code` values lives in `@flexup/shared` → `ErrorCode`.

## CORS & Rate limiting

- CORS origins are configurable via `CORS_ORIGINS` (comma-separated). Fallback: `CORS_ORIGIN` (single origin or `*`).
- Rate limiting (ADR-027): global 10 req/sec, 100 req/min. Auth endpoints stricter — `register` 3/min, `login` 5/min, `refresh` 10/min. `/api/health` skips throttle.

## Modules

| File | Module | Base path |
|------|--------|-----------|
| [health.md](health.md) | Health check | `/api/health` |
| [auth.md](auth.md) | Authentication | `/api/auth` |
| [users.md](users.md) | User profiles + admin | `/api/users` |
| [companies.md](companies.md) | Companies (CRUD + logo + admin) | `/api/companies`, `/api/admin/companies` |
| [company-members.md](company-members.md) | Company member management | `/api/companies/:companyId/members` |
| [locations.md](locations.md) | Company locations + geo search | `/api/companies/:companyId/locations` |

## Convention for new routes

When a new controller endpoint is added:
1. Find the matching file in `docs/routes/` (or create one named after the module).
2. Add a row to the table above.
3. Document the new endpoint following the same format used in the existing files.
4. Document any new `ErrorCode` value in `@flexup/shared` → `ErrorCode`.
