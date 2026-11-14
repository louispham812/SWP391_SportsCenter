# Runtime Validation Report

**Generated**: 2026-10-13  
**Target**: `C:\Users\nguye\OneDrive\Desktop\SWP391\SWP391_SportsCenter`

## Summary

| Step | Status | Exit Code | Details |
|------|--------|-----------|---------|
| Startup | PASS (teardown exit) | 1 | Spring Boot connected to local SQL Server and served the browser tests. Playwright teardown stopped the long-running Maven `spring-boot:run` process; Maven consequently logged `Process terminated with exit code: -1`. This was after the successful test run, not an application startup failure. |
| Backend tests | PASS | 0 | Maven: 8 tests, 0 failures, 0 errors |
| Frontend build | PASS | 0 | `npm run build`; Vite reports the existing >500 KB JavaScript chunk warning |
| Frontend lint | PASS WITH WARNINGS | 0 | `npm run lint`; existing unused-variable warnings remain outside this dashboard change |
| Browser E2E | PASS | 0 | Full suite: 4 passed. Follow-up class-only run: member setup and class checkout/read-back both passed. |

**Overall**: PASS — court and class booking flows both completed through SANDBOX checkout and were read back from the member's database-backed schedule.

## Environment

- Docker: UNAVAILABLE — Docker is not installed. The configured local SQL Server was available and used directly.
- Node.js: AVAILABLE — v24.15.0.
- Playwright: AVAILABLE — `@playwright/test` 1.64.0.
- Chromium: AVAILABLE — installed with Playwright.
- Browser tier: PRIMARY (Playwright).
- Infrastructure tier: local SQL Server, not a Docker fallback.

## Test Evidence

- `frontend/e2e/auth.setup.js`: register a database-backed member, verify the returned identity, refresh and verify the authenticated session.
- `frontend/e2e/court-booking.spec.js`: authenticate, load a court and free 60-minute slot from SQL-backed APIs, submit SANDBOX checkout, verify the authenticated schedule API contains the booking.
- `frontend/e2e/schedule-persistence.spec.js`: reload dashboard and time table and verify the same booking is read back.
- `frontend/e2e/class-options.spec.js`: choose an upcoming database-backed class with an available seat, verify its database price quote, submit SANDBOX checkout, verify `PAID`, and read the class back from the authenticated schedule API and schedule page.
- The final Playwright run exited 0 with 4 passed tests.
- A follow-up isolated run passed the member registration setup and full class checkout/read-back test (2 passed).
- The member-dashboard data and class/court catalogs came from the backend; no fixture data was injected by the browser tests.

## Issues Found and Fixed

| # | Severity | Description | Resolution |
|---|----------|-------------|------------|
| 1 | HIGH | Browser fetches to `/api/v1/booking-flow/**` failed CORS while direct API requests succeeded. | Added the controller's cross-origin policy and reran the browser suite successfully. |

## Test Data Retained

The initial failed browser attempt and subsequent successful runs registered three unique test members in the local database. One retained SANDBOX court booking and one retained SANDBOX class booking were created. Temporary test credentials and browser artifacts were removed after the successful runs. The class booking used an existing upcoming class with an available seat; no class or schedule fixture was inserted.
