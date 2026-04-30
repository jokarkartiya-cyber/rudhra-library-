# Rudhra Library

## Overview

Rudhra Library is a premium study library website for the library owned by Ankit Kumar in Agra, Uttar Pradesh. The site has a public landing page, an admin dashboard for managing students and fees, a card verification page used at the library entrance, and downloadable PDF student ID cards.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Frontend**: React + Vite + Tailwind v4 + shadcn/ui + framer-motion + recharts + wouter + react-hook-form + zod + jsPDF
- **File storage**: Replit Object Storage (presigned URL upload from the form, served via `/api/storage/objects/*`). Used for student photos shown on the ID card and admin pages.
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)

## Artifacts

- `artifacts/rudhra-library` — public website + admin dashboard (served at `/`)
- `artifacts/api-server` — REST API (served at `/api`)

## Domain

- Library name: Rudhra Library
- Owner: Ankit Kumar
- Phone: +91 9528335124, +91 7900799154
- Location: Agra, Uttar Pradesh (lat 27.0032965, lng 78.5823932)
- Shifts: Morning, Afternoon, Evening, Night, Full Day

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
