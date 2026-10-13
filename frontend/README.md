# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Authentication API

The sign-in and registration forms call the Spring Boot backend at
`http://localhost:8080/api/v1` by default. Start SQL Server and the backend
(`mvn spring-boot:run` from `backend`) before using these forms. The backend's
database connection is configured in `backend/src/main/resources/application.properties`.

If the backend uses a different address, set `VITE_API_BASE_URL` in a local
`.env.local` file, including the `/api/v1` path, for example:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Registration creates an active `MEMBER` in the `users` table, and sign-in
validates the submitted email address or phone number and password against that
table.

## Public home-page content

The home page and the `/sports` and `/facilities` pages load their content from
the Spring Boot API endpoints `/api/v1/public/content/sports` and
`/api/v1/public/content/facilities`. On backend startup, `backend/src/main/resources/schema.sql`
creates the `public_sports` and `public_facilities` tables if needed and inserts
the initial public content only when its slug is not already present. The SQL
Server account configured for the backend therefore needs permission to create
tables the first time the backend starts.
