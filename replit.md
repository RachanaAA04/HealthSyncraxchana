# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Replit Auth (OIDC/PKCE)

## Project: HealthSync – AI-Powered Health Companion

A full-stack health management platform for women with PCOS/PCOD and thyroid disorders.

### Features
- User authentication (Replit Auth)
- Dashboard with health summary & daily stats
- Medication reminders (CRUD + mark as taken)
- Water intake tracker
- Exercise log
- Nutrition/meal tracker
- Symptom tracking (mood, energy, pain, weight, cycle)
- AI Risk Assessment (rule-based scoring → Low/Medium/High)
- AI Chatbot (PCOS/thyroid knowledge base)
- Hospital Locator page (placeholder for Google Maps API)
- Doctor Progress Report with charts (Recharts)
- Emergency SOS button

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── healthsync/         # React+Vite frontend (root path /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── replit-auth-web/    # Replit Auth browser hooks
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Database Schema (lib/db/src/schema/)

- `auth.ts` — users, sessions tables (Replit Auth)
- `healthsync.ts` — user_profiles, medications, medication_logs, water_intake, symptom_entries, exercise_entries, nutrition_entries, chat_messages, risk_assessments, emergency_logs

## API Routes (artifacts/api-server/src/routes/)

- `health.ts` — GET /healthz
- `auth.ts` — GET /auth/user, GET /login, GET /callback, GET /logout, mobile auth
- `profile.ts` — GET/PUT /profile
- `medications.ts` — CRUD /medications, POST /medications/:id/taken
- `water.ts` — GET/POST /water
- `symptoms.ts` — GET/POST /symptoms
- `exercise.ts` — GET/POST /exercise
- `nutrition.ts` — GET/POST /nutrition
- `chat.ts` — GET/POST /chat (rule-based AI responses)
- `risk.ts` — GET/POST /risk-assessment
- `dashboard.ts` — GET /dashboard
- `report.ts` — GET /report
- `emergency.ts` — POST /emergency/sos

## Packages

### `artifacts/healthsync` (`@workspace/healthsync`)

React+Vite frontend app served at root path `/`. Uses:
- Wouter for routing
- @tanstack/react-query for data fetching
- Recharts for health charts
- Lucide React for icons
- @workspace/replit-auth-web for authentication
- @workspace/api-client-react for generated API hooks

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes in `src/routes/`. Uses `@workspace/api-zod` for validation, `@workspace/db` for persistence.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- Push schema: `pnpm --filter @workspace/db run push`

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval config.

- Run codegen: `pnpm --filter @workspace/api-spec run codegen`
