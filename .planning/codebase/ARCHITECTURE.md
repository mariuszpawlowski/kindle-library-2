# Architecture

**Analysis Date:** 2026-04-13

## Pattern Overview

**Overall:** Next.js App Router full-stack application with a two-tier layered architecture (API layer + library layer) backed by S3-as-database.

**Key Characteristics:**
- All pages are client components (`'use client'`) that fetch data via internal REST API routes
- No server-side rendering for page content — pages fetch on mount via `useEffect` + `fetch`
- API routes act as the only server-side boundary; all data access goes through `lib/`
- Persistence is entirely in AWS S3: a single `db.json` file is the database, and cover images are stored as S3 objects
- Authentication is AWS Cognito (via Amplify), enforced per-route in API handlers

## Layers

**UI Layer (Pages):**
- Purpose: Render views, manage local UI state, call internal API endpoints
- Location: `app/page.tsx`, `app/book/[id]/page.tsx`, `app/history/page.tsx`, `app/login/page.tsx`
- Contains: React client components with `useState`/`useEffect` for data fetching
- Depends on: `components/`, `lib/types.ts` (for TypeScript interfaces only)
- Used by: End users via browser

**Reusable Component Layer:**
- Purpose: Shared UI building blocks consumed by pages
- Location: `components/`
- Contains: `BookCard.tsx`, `HighlightList.tsx`, `SearchBar.tsx`, `UploadButton.tsx`, `AuthButton.tsx`, `AuthProvider.tsx`
- Depends on: `lib/types.ts`, Amplify auth hooks
- Used by: Pages in `app/`

**API Layer (Route Handlers):**
- Purpose: REST endpoints; the only server-side boundary — validates auth, delegates to `lib/db`
- Location: `app/api/`
- Contains: Next.js `route.ts` files exporting HTTP method functions (`GET`, `POST`, `DELETE`)
- Depends on: `lib/db.ts`, `lib/amplify-server.ts`, `lib/parser.ts`, `lib/covers.ts`, `lib/s3.ts`
- Used by: UI pages via `fetch('/api/...')`

**Library Layer:**
- Purpose: Pure service/utility functions with no HTTP concerns
- Location: `lib/`
- Contains:
  - `db.ts` — all CRUD operations against the S3 JSON database
  - `s3.ts` — S3 client initialization and bucket config
  - `parser.ts` — Kindle `My Clippings.txt` file parser
  - `covers.ts` — book cover fetching from Open Library / Google Books
  - `amplify-server.ts` — server-side Cognito auth check helper
  - `types.ts` — shared TypeScript interfaces (no logic)
- Depends on: AWS SDK, external APIs (Open Library, Google Books)
- Used by: API route handlers only

## Data Flow

**Book Library Load (Home Page):**
1. `app/page.tsx` mounts → `useEffect` calls `fetch('/api/books')`
2. `app/api/books/route.ts` → calls `getBooks()` from `lib/db.ts`
3. `lib/db.ts` → calls `getDb()` → sends `GetObjectCommand` to S3 for `db.json`
4. S3 returns JSON → parsed into `DbSchema` → `books[]` returned as JSON response
5. Page sets `books` state → renders `<BookCard>` grid

**Kindle Clippings Upload (Smart Import):**
1. Authenticated user selects `.txt` file in `<UploadButton>`
2. `POST /api/upload` receives `FormData`
3. Auth checked via `checkAuth()` → `lib/amplify-server.ts` → Cognito cookie session
4. File text passed to `parseClippings()` → `lib/parser.ts` splits on `==========`, builds `Book[]`
5. Current `db.json` loaded from S3 → existing books and deleted history mapped
6. Smart import logic: skips deleted books/highlights, merges new highlights into existing books
7. For new books: `fetchCover()` (`lib/covers.ts`) queries Open Library then Google Books API
8. Cover image downloaded and uploaded to S3 at `covers/{bookId}.jpg`
9. Updated `DbSchema` saved back to S3 as `db.json`
10. Response with stats returned to client; page re-fetches book list

**Highlight/Book Delete with History:**
1. Authenticated action triggers `DELETE /api/books/[id]` or `DELETE /api/highlights/[id]?bookId=...`
2. `lib/db.ts` reads full `db.json`, creates a `DeletedItem` record with full original data
3. Item pushed to `db.history[]`, removed from `db.books[]`
4. Full updated `db.json` saved back to S3 (read-modify-write pattern)

**Restore from History:**
1. `POST /api/history/[id]/restore` → auth check → `restoreItem()` in `lib/db.ts`
2. History entry located by id; if `type === 'book'` the book is pushed back to `db.books[]`
3. If `type === 'highlight'` the highlight is pushed back to the parent book's `highlights[]`
4. History entry removed from `db.history[]`; full `db.json` saved back to S3

**State Management:**
- No global client state manager (no Redux, Zustand, Context for data)
- Each page manages its own local state via `useState`
- Auth state provided globally via `<AuthProvider>` (Amplify `Authenticator.Provider` context) wrapping the entire app in `app/layout.tsx`
- Components subscribe to auth status via `useAuthenticator(context => [context.authStatus])` hook
- UI-level optimistic updates in `app/book/[id]/page.tsx` for highlight deletion

## Key Abstractions

**`DbSchema` (S3 JSON Database):**
- Purpose: The entire application database — a single JSON object stored as `db.json` in S3
- Defined in: `lib/types.ts`
- Structure: `{ books: Book[], history: (DeletedItem | RenamedItem)[], lastSync: string }`
- Accessed via: `getDb()` / `saveDb()` in `lib/db.ts` using a read-modify-write pattern

**`Book` entity:**
- Purpose: Core domain object representing a Kindle book with its highlights
- Defined in: `lib/types.ts`
- Fields: `id` (UUID), `title`, `author`, `coverUrl` (S3 URL), `highlights[]`, `lastUpdated`, `aliases[]`
- Aliases: stored to preserve import matching after renames

**`DeletedItem` / `RenamedItem` (History):**
- Purpose: Audit/undo log for destructive operations; enables soft-delete and restore
- Defined in: `lib/types.ts`
- Both stored together in `db.history[]` discriminated by `type` field

**`checkAuth()` / `unauthorizedResponse()` (Auth Guard):**
- Purpose: Server-side auth enforcement on mutating API routes
- Location: `lib/amplify-server.ts`
- Pattern: `if (!await checkAuth()) return unauthorizedResponse();` at top of every write handler

## Entry Points

**Application Root:**
- Location: `app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Wraps entire app in `<AuthProvider>` (Amplify context), sets global fonts and CSS

**Home Page:**
- Location: `app/page.tsx`
- Triggers: Navigation to `/`
- Responsibilities: Fetches and displays all books, provides search and upload entry points

**API Base:**
- Location: `app/api/*/route.ts`
- Triggers: HTTP requests from client pages
- Responsibilities: Auth enforcement (write routes), delegation to `lib/db.ts`

## Error Handling

**Strategy:** Try/catch blocks in API handlers return JSON error responses with HTTP status codes. Client-side errors display `alert()` or `console.error`.

**Patterns:**
- API routes: `try/catch` → `NextResponse.json({ error: message }, { status: 500 })`
- `lib/db.ts`: S3 `NoSuchKey` / `NotFound` errors handled gracefully (returns empty DB); other errors re-thrown
- Client pages: async errors caught in `try/catch`, user notified via `alert()` — no toast/error boundary pattern
- Auth errors: `checkAuth()` returns `false` on any exception; write routes return 401

## Cross-Cutting Concerns

**Logging:** `console.error()` / `console.log()` throughout; no structured logging library. Auth check emits verbose debug logs (pool ID presence, cookie names, session token status).

**Validation:** Minimal — API routes check for required fields (e.g., `newTitle`, `newAuthor`, `bookId`) but there is no schema validation library. File type checked for cover upload (`file.type.startsWith('image/')`).

**Authentication:**
- Client-side: Amplify `useAuthenticator` hook provides `authStatus`; UI conditionally renders actions (delete, upload, rename buttons hidden when not authenticated)
- Server-side: `checkAuth()` in `lib/amplify-server.ts` reads Cognito JWT from cookies and validates via `runWithAmplifyServerContext`
- Read operations (`GET /api/books`, `GET /api/books/[id]`, `GET /api/history`) are **public** — no auth required
- Write operations require auth: upload, delete book, delete highlight, rename, cover upload, restore

---

*Architecture analysis: 2026-04-13*
