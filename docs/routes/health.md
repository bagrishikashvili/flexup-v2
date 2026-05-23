# Health Routes

Controller: `src/health/health.controller.ts`  
Service: `src/health/health.service.ts`  
Base path: `/api/health`  
Auth: none (all endpoints are `@Public()`)

---

## GET /api/health

Checks liveness of the application and its dependencies.

### Auth
Public — no token required.

### Request
No body, no query params.

### Response 200 — all services up
```json
{
  "status": "ok",
  "timestamp": "2026-05-23T10:00:00.000Z",
  "services": {
    "database": "up",
    "redis": "up"
  },
  "uptime": 3600.42
}
```

### Response 503 — any service down
```json
{
  "status": "degraded",
  "timestamp": "2026-05-23T10:00:00.000Z",
  "services": {
    "database": "down",
    "redis": "up"
  },
  "uptime": 3600.42
}
```
