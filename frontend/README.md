# SportHub frontend

React 19 application built with Vite 8 and Tailwind CSS 3.4 (55 UI pages across public routes and 4 role portals: `/member`, `/receptionist`, `/coach`, `/admin`). Run commands from `frontend`:

- `npm run dev`: start the Vite development server on port `5174` (with `/api` proxied to `http://localhost:8080`).
- `npm run build`: build the production application.
- `npm run lint`: run Oxlint; unused variables and imports are errors.
- `npm run check:unused`: check unreferenced files, exports and dependencies with Knip.
- `npm run test:unit`: run the utility unit tests (`src/utils/*.test.js`) with Node.js.
- `npm run test:e2e`: run the 14 Playwright E2E specs in `e2e/` (`01`–`06`, `08`–`15`).
- `npm run generate:favicons`: regenerate the application icons using the installed Edge browser.
- `npm run record:demo`: run the demo recording script.

## Authentication API

The sign-in and registration forms call the Spring Boot backend at
`http://localhost:8080/api/v1` by default (or via Vite's `/api` proxy). Start SQL Server (seeded from `../DATABASEchuan.sql`) and the backend (`mvn spring-boot:run` from `backend`) before using these forms. Database settings are configured in `backend/src/main/resources/application.properties` and optional `.env` files.

If the backend uses a different address, set `VITE_API_BASE_URL` in a local `.env.local` file, including the `/api/v1` path, for example:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Self-registration creates a pending `MEMBER` awaiting 6-digit email OTP verification before becoming `ACTIVE`, while counter/admin onboarding can create `ACTIVE` accounts directly. Sign-in validates the submitted email address or phone number and password against `users`.

## Booking & portal browser tests (Playwright E2E)

With local SQL Server available, run the browser end-to-end suite from `frontend`:

```bash
npm run test:e2e
```

Playwright uses `http://127.0.0.1:5173` by default (configurable via `E2E_BASE_URL`) and starts the Spring Boot API and Vite app when they are not already running. The 14 suites cover authentication, court booking/maintenance, class scheduling & coach workflows, POS/inventory/receptionist & admin reporting, custom membership tiers, VNPay returns, and admin operations. Booking flows create `SANDBOX`/VNPay records in the configured database; if no bookable class exists, the class suite verifies the empty/full state cleanly rather than fabricating schedules.

## Public home-page content

The home page, `/sports`, `/facilities`, and `/pricing` pages load live content from `/api/v1/public/content/sports`, `/api/v1/public/content/facilities`, and `/api/v1/packages`. On backend startup, `backend/src/main/resources/schema.sql` and migration scripts ensure `public_sports`, `public_facilities`, and custom membership tier schema updates are applied idempotently.
