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

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── attendance-tracker/ # Attendance Tracker React frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Applications

### Attendance Tracker (`artifacts/attendance-tracker`)

React + Vite frontend at `/` for barcode-based attendance tracking. Features:
- Event setup screen (name, date/time, location)
- Camera-based barcode scanning using `@zxing/browser`
- First-time ID mapping: scan unknown barcode → searchable staff dropdown → assign
- Returning user: auto-record attendance with green success flash + beep
- Duplicate check: orange "Already checked in" message
- Attendance log with auto-refresh every 10 seconds
- CSV export of attendance per event
- Audio feedback (Web Audio API beep) and vibration on scan
- 30 preloaded staff members across multiple departments

### API Server (`artifacts/api-server`)

Express 5 API at `/api`. Routes:
- `GET /api/events` — list events
- `POST /api/events` — create event
- `GET /api/events/:id` — get event
- `GET /api/staff` — list all staff
- `POST /api/staff/scan` — process barcode scan (returns: not_found / already_checked_in / recorded)
- `PUT /api/staff/:id/barcode` — assign barcode to staff member
- `POST /api/attendance` — record attendance
- `GET /api/attendance/event/:id` — get attendance list for event
- `GET /api/attendance/event/:id/export` — download CSV

## Database Schema

### `events` table
- `id`, `name`, `date_time`, `location`, `created_at`

### `staff` table
- `id`, `name`, `barcode_id` (null until first scan), `department`

### `attendance` table
- `id`, `staff_id`, `event_id`, `checked_in_at`
- Unique constraint on `(staff_id, event_id)` — prevents duplicates

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json`. Run `pnpm run typecheck` from root.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build`
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`

## Packages

### `artifacts/api-server` (`@workspace/api-server`)
Express 5 API. Dev: `pnpm --filter @workspace/api-server run dev`

### `artifacts/attendance-tracker` (`@workspace/attendance-tracker`)
React + Vite frontend. Dev: `pnpm --filter @workspace/attendance-tracker run dev`

### `lib/api-spec` (`@workspace/api-spec`)
OpenAPI spec + Orval config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/db` (`@workspace/db`)
Drizzle ORM with PostgreSQL. Push schema: `pnpm --filter @workspace/db run push`
