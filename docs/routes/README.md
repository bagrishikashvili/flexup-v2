# API Routes Index

Base path: `/api`  
All authenticated endpoints require `Authorization: Bearer <accessToken>` header.  
Error response shape: `{ statusCode, message, error, timestamp, path }`

## Modules

| File | Module | Base path |
|------|--------|-----------|
| [health.md](health.md) | Health check | `/api/health` |
| [auth.md](auth.md) | Authentication | `/api/auth` |
| [users.md](users.md) | User profiles + admin | `/api/users` |
| [companies.md](companies.md) | Companies (CRUD + logo + admin) | `/api/companies`, `/api/admin/companies` |
| [company-members.md](company-members.md) | Company member management | `/api/companies/:companyId/members` |

## Convention for new routes

When a new controller endpoint is added:
1. Find the matching file in `docs/routes/` (or create one named after the module).
2. Add a row to the table above.
3. Document the new endpoint following the same format used in the existing files.
