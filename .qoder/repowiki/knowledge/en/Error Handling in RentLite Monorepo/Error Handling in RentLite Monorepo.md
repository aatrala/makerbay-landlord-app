---
kind: error_handling
name: Error Handling in RentLite Monorepo
category: error_handling
scope:
    - '**'
source_files:
    - server/src/index.ts
    - server/src/auth/middleware.ts
    - server/src/routes/properties.ts
    - server/src/email/resend.ts
    - client/src/lib/api.ts
    - client/src/pages/Login.tsx
---

## Overview

RentLite uses a lightweight, convention-driven error handling approach across its Express server and React client. There is no centralized error class hierarchy or global exception middleware; instead, errors are handled locally per route with consistent JSON response shapes, and the client centralizes HTTP error normalization in a single `ApiClient`.

## Server-side (Express)

- **No global error handler**: `server/src/index.ts` mounts routers and starts the server but does not define an `app.use((err, req, res, next) => ...)` catch-all. Errors bubble as unhandled promise rejections.
- **Per-route explicit responses**: Each route returns structured JSON for error cases:
  - Validation failures use Zod's `safeParse` and return `{ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }` with status 400 (`server/src/routes/properties.ts`).
  - Missing resources return `{ message: "Not found", code: "NOT_FOUND" }` with status 404.
  - Auth failures from `authMiddleware` return `{ message: "Unauthorized", code: "UNAUTHORIZED" }` with status 401 (`server/src/auth/middleware.ts`).
- **External service calls wrap errors**: The email module (`server/src/email/resend.ts`) catches exceptions from Resend and returns a `{ success: boolean; error?: string }` result object rather than throwing, so callers can decide how to surface failures.
- **Input validation via Zod**: All request bodies are validated with Zod schemas defined at the top of each route file; invalid input never reaches database logic.
- **Auth middleware pattern**: Routes opt into authentication by calling `router.use(authMiddleware)` at the top of the router; optional auth uses `optionalAuth`, which attaches `session`/`userId` only when present.

## Client-side (React + Vite)

- **Centralized HTTP layer**: `client/src/lib/api.ts` defines an `ApiClient` class whose `request<T>` method normalizes all fetch responses:
  - Status 401 triggers a redirect to `/login` and throws `new Error("Unauthorized")`.
  - Any non-`ok` response parses the body (with `.catch(() => ({ message: response.statusText, code: "UNKNOWN" }))`) and throws `new Error(error.message || "Request failed")`.
  - Successful responses resolve to `response.json()`.
- **Page-level try/catch**: Pages like `Login.tsx` wrap async operations in try/catch blocks and surface user-facing messages via `sonner` toast notifications (`toast.error(...)`, `toast.success(...)`). They also handle structured error objects returned by the auth client (`result.error.message`).
- **No global error boundary shown**: No `ErrorBoundary` component was found in the scanned files; error presentation is page-scoped using toasts.

## Shared types

The shared package (`shared/src/types.ts`) contains domain interfaces (e.g., `CashFlowEntry`, `ScheduleEEntry`) but does not define any custom error types or error codes — error codes are ad-hoc strings (`UNAUTHORIZED`, `NOT_FOUND`, `VALIDATION`, `UNKNOWN`) used inline on the server side.

## Conventions observed

| Area | Convention | Evidence |
|---|---|---|
| Server error shape | `{ message, code, [details] }` JSON body | `auth/middleware.ts`, `routes/properties.ts` |
| Validation | Zod `safeParse` before DB access, 400 on failure | All route files use `createXxxSchema.safeParse(req.body)` |
| Auth failure | 401 JSON with `code: "UNAUTHORIZED"` | `auth/middleware.ts` |
| Not found | 404 JSON with `code: "NOT_FOUND"` | `routes/properties.ts` |
| Client HTTP errors | Centralized in `ApiClient.request`, thrown as `Error` | `client/src/lib/api.ts` |
| Client UI errors | Toasted via `sonner` at the page level | `pages/Login.tsx` and other pages |
| External I/O | Return `{ success, error? }` instead of throwing | `email/resend.ts` |

## Constraints / Gaps

- There is no repository-wide error class hierarchy (no `AppError`, `ValidationError`, etc.).
- There is no Express error-handling middleware (`err, req, res, next`) to centralize logging or default responses for unexpected exceptions.
- Error codes are inconsistent between client and server (the client falls back to `"UNKNOWN"` when the server response lacks a `code`).
- Unhandled promise rejections in routes will crash the process since no global `process.on('unhandledRejection')` was found.