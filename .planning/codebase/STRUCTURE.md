# Codebase Structure

**Analysis Date:** 2026-04-13

## Directory Layout

```
kindle-library-2/
├── app/                    # Next.js App Router — pages and API routes
│   ├── api/                # REST API route handlers (server-side)
│   │   ├── books/
│   │   │   ├── route.ts                  # GET /api/books
│   │   │   └── [id]/
│   │   │       ├── route.ts              # GET, DELETE /api/books/[id]
│   │   │       ├── cover/route.ts        # POST /api/books/[id]/cover
│   │   │       └── rename/route.ts       # POST /api/books/[id]/rename
│   │   ├── highlights/
│   │   │   └── [id]/route.ts            # DELETE /api/highlights/[id]
│   │   ├── history/
│   │   │   ├── route.ts                 # GET /api/history
│   │   │   └── [id]/restore/route.ts    # POST /api/history/[id]/restore
│   │   ├── upload/route.ts              # POST /api/upload
│   │   ├── image-proxy/route.ts         # GET /api/image-proxy
│   │   └── debug-auth/route.ts          # GET /api/debug-auth (env check)
│   ├── book/
│   │   └── [id]/page.tsx               # Book detail page
│   ├── history/
│   │   └── page.tsx                    # Deleted items / rename history page
│   ├── login/
│   │   └── page.tsx                    # Cognito/Amplify login page
│   ├── favicon.ico
│   ├── globals.css                     # Global Tailwind CSS
│   └── layout.tsx                      # Root layout — wraps app in AuthProvider
├── components/             # Reusable React client components
│   ├── AuthButton.tsx      # Login/logout button (auth-aware)
│   ├── AuthProvider.tsx    # Amplify Cognito context provider
│   ├── BookCard.tsx        # Book cover card with link to detail page
│   ├── HighlightList.tsx   # List of highlights with copy/delete actions
│   ├── SearchBar.tsx       # Controlled search input
│   └── UploadButton.tsx    # Kindle clippings file upload (auth-gated)
├── lib/                    # Shared server-side utilities and services
│   ├── amplify-server.ts   # Server-side Cognito auth check (checkAuth)
│   ├── covers.ts           # Book cover fetching (Open Library, Google Books)
│   ├── db.ts               # All data access — reads/writes S3 db.json
│   ├── parser.ts           # Kindle "My Clippings.txt" parser
│   ├── s3.ts               # AWS S3 client initialization + BUCKET_NAME
│   └── types.ts            # TypeScript interfaces (Book, Highlight, DbSchema, etc.)
├── data/
│   └── db.json             # Legacy local database (pre-S3 migration artefact)
├── public/
│   └── covers/             # Legacy local cover image storage (pre-S3 migration)
├── .planning/
│   └── codebase/           # GSD planning documents
├── migrate_to_s3.ts        # One-off migration script (local db.json → S3)
├── next.config.ts          # Next.js config (remote image patterns for *.amazonaws.com)
├── tsconfig.json           # TypeScript config (strict, path alias @/* → ./* )
├── package.json
├── postcss.config.mjs      # Tailwind PostCSS config
├── eslint.config.mjs       # ESLint config
├── amplify.yml             # AWS Amplify CI/CD build config
├── netlify.toml            # Netlify deployment config (alternative target)
└── .env.local              # Local environment variables (not committed)
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js App Router root — all pages and API routes live here
- Pages are `page.tsx` files; API handlers are `route.ts` files
- Key files: `app/layout.tsx` (root layout), `app/page.tsx` (home/library view)

**`app/api/`:**
- Purpose: Server-side REST API. Every file is a `route.ts` exporting named HTTP method functions
- Mutating endpoints (`POST`, `DELETE`) all call `checkAuth()` before proceeding
- Read-only endpoints (`GET /api/books`, `GET /api/history`) are public (no auth check)

**`components/`:**
- Purpose: Reusable React client components shared across pages
- All files use `'use client'` directive — none are server components
- All components import types from `@/lib/types` and auth state from `@aws-amplify/ui-react`

**`lib/`:**
- Purpose: Server-side service modules imported exclusively by API route handlers
- `db.ts` is the data access layer — the only place that reads/writes S3
- `types.ts` is the only `lib/` file imported by client components (type-only imports at build time)

**`data/`:**
- Purpose: Legacy artefact — contained the local `db.json` before S3 migration
- `data/db.json` is not actively used at runtime; `lib/db.ts` reads exclusively from S3
- Kept as a migration reference / fallback

**`public/covers/`:**
- Purpose: Legacy local cover image directory — predates S3 cover storage
- Cover images are now uploaded to and served from S3; this directory is no longer populated at runtime

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout, wraps entire app in Amplify `<AuthProvider>`
- `app/page.tsx`: Home page — book library grid

**Core Data Access:**
- `lib/db.ts`: All S3 CRUD operations (`getBooks`, `getBook`, `saveDb`, `deleteBook`, `deleteHighlight`, `updateBookCover`, `getHistory`, `restoreItem`)
- `lib/types.ts`: All TypeScript interfaces — import from here for type safety

**Configuration:**
- `next.config.ts`: Next.js config (remote image hostnames)
- `tsconfig.json`: TypeScript config — defines `@/*` path alias
- `.env.local`: Required env vars (S3 credentials, Cognito pool IDs) — see INTEGRATIONS.md
- `amplify.yml`: AWS Amplify CI/CD config
- `netlify.toml`: Netlify deployment config

**API Routes:**
- `app/api/books/route.ts`: `GET /api/books`
- `app/api/books/[id]/route.ts`: `GET`, `DELETE /api/books/:id`
- `app/api/books/[id]/cover/route.ts`: `POST /api/books/:id/cover`
- `app/api/books/[id]/rename/route.ts`: `POST /api/books/:id/rename`
- `app/api/highlights/[id]/route.ts`: `DELETE /api/highlights/:id?bookId=`
- `app/api/upload/route.ts`: `POST /api/upload`
- `app/api/history/route.ts`: `GET /api/history`
- `app/api/history/[id]/restore/route.ts`: `POST /api/history/:id/restore`
- `app/api/image-proxy/route.ts`: `GET /api/image-proxy?url=`
- `app/api/debug-auth/route.ts`: `GET /api/debug-auth` (env variable presence check)

**Testing:**
- No test files exist in this codebase. There is no test directory, no test framework configured, and no test scripts in `package.json`.

## Naming Conventions

**Files:**
- Pages: `page.tsx` (required by Next.js App Router convention)
- API handlers: `route.ts` (required by Next.js App Router convention)
- Components: `PascalCase.tsx` — e.g., `BookCard.tsx`, `AuthProvider.tsx`
- Library modules: `camelCase.ts` — e.g., `db.ts`, `amplify-server.ts`, `covers.ts`
- Types file: `types.ts` (flat, single file for all interfaces)

**Directories:**
- App Router segments: `kebab-case` or plain noun (`book`, `history`, `login`)
- Dynamic segments: `[id]` (Next.js convention)
- Nested API resources: mirror REST structure — `api/books/[id]/cover/`

**TypeScript Interfaces:**
- `PascalCase` — e.g., `Book`, `Highlight`, `DbSchema`, `DeletedItem`, `RenamedItem`
- Discriminated unions use a `type` string literal field: `type: 'book' | 'highlight' | 'rename'`

**Functions:**
- Library functions: `camelCase` verbs — `getBooks`, `saveDb`, `deleteHighlight`, `parseClippings`, `fetchCover`, `checkAuth`
- React components: `PascalCase` default exports — `BookCard`, `HighlightList`
- API handlers: Named exports matching HTTP methods — `export async function GET(...)`, `export async function DELETE(...)`

## How Features Are Organized

Features are **not** organized in feature folders. Instead the codebase uses a **role-based split**:
- UI pages → `app/<route>/page.tsx`
- Reusable UI → `components/<ComponentName>.tsx`
- API endpoints → `app/api/<resource>/route.ts`
- Business logic / data access → `lib/<module>.ts`

Each page file contains all UI logic for that route (fetch, state, render). There are no separate container/presenter splits or custom hooks extracted to a `hooks/` directory.

## Where to Add New Code

**New page / route:**
- Create `app/<route-name>/page.tsx` with `'use client'` if data fetching is needed
- Add a corresponding API route in `app/api/<resource>/route.ts` if new server data access is required

**New API endpoint:**
- Add `route.ts` under `app/api/<resource>/` or `app/api/<resource>/[id]/`
- Follow the pattern: auth check first for mutations, delegate to `lib/db.ts` for data, return `NextResponse.json(...)`

**New database operation:**
- Add function to `lib/db.ts` following the read-modify-write pattern: `getDb()` → mutate → `saveDb()`
- Export the function and import it in the relevant API route handler

**New TypeScript type:**
- Add interface to `lib/types.ts`

**New reusable UI component:**
- Add `components/<ComponentName>.tsx` with `'use client'` directive
- Accept props typed with inline interfaces or types from `lib/types.ts`

**New utility / service:**
- Add `lib/<module-name>.ts` for server-side logic
- Do NOT import `lib/db.ts` or `lib/s3.ts` from client components — these are server-only

## Special Directories

**`.planning/`:**
- Purpose: GSD planning documents and phase tracking
- Generated: No (manually created)
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output and dev cache
- Generated: Yes (by `npm run build` / `npm run dev`)
- Committed: No (in `.gitignore`)

**`data/`:**
- Purpose: Legacy local JSON database (pre-S3 migration)
- Generated: No
- Committed: Yes (contains legacy `db.json` snapshot)

**`public/covers/`:**
- Purpose: Legacy local cover images (pre-S3 migration)
- Generated: No
- Committed: Potentially (legacy files may exist here)

## Path Alias

The `@/*` alias resolves to the project root (`./`), configured in `tsconfig.json`:
```json
"paths": { "@/*": ["./*"] }
```

Use `@/lib/types`, `@/components/BookCard`, `@/lib/db` etc. — never use relative `../../` imports.

---

*Structure analysis: 2026-04-13*
