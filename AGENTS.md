<!-- GSD:project-start source:PROJECT.md -->
## Project

**Kindle Library — Navigation Improvement**

A personal Kindle highlights library built with Next.js, displaying books as a cover-tile grid with search. This milestone adds an A–Z jump bar and a sort-mode toggle so the user can quickly navigate to books by author surname initial or title initial without typing in the search box.

**Core Value:** Get to the right part of your library in one click — without scrolling or searching.

### Constraints

- **Tech stack**: Must use Tailwind for styling — no new CSS-in-JS or style libraries
- **No new routes**: All changes are within `app/page.tsx` and a new component; no API changes
- **TypeScript strict**: All new code must pass `tsc --noEmit`
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 - All source files (`.ts`, `.tsx`) across `app/`, `components/`, `lib/`
- CSS (via Tailwind utility classes) - Styling throughout all components
## Runtime
- Node.js v22.13.0
- npm 11.10.0
- Lockfile: `package-lock.json` present (lockfileVersion 3)
## Frameworks
- Next.js 16.1.1 - Full-stack React framework; App Router with Server Components and Route Handlers (`app/` directory)
- React 19.2.3 - UI library
- TypeScript compiler - `tsconfig.json` targets ES2017, strict mode enabled, `moduleResolution: "bundler"`
- PostCSS with `@tailwindcss/postcss` 4.1.17 - CSS processing pipeline (`postcss.config.mjs`)
- Tailwind CSS 4.1.17 - Utility-first CSS framework
- ESLint 9 with `eslint-config-next` 16.1.1 - Linting via `eslint.config.mjs` (Core Web Vitals + TypeScript rules)
- Not detected — no test framework configured, no test files present
## Key Dependencies
- `aws-amplify` 6.15.9 - AWS Amplify v6 client for Cognito authentication state management
- `@aws-amplify/adapter-nextjs` 1.6.12 - SSR-compatible Amplify adapter for Next.js server context (`lib/amplify-server.ts`)
- `@aws-amplify/ui-react` 6.13.2 - Pre-built `<Authenticator>` UI component with Google OAuth support (`app/login/page.tsx`, `components/AuthProvider.tsx`)
- `@aws-sdk/client-s3` 3.937.0 - AWS SDK v3 S3 client for all data persistence (`lib/s3.ts`, `lib/db.ts`)
- `framer-motion` 12.23.24 - Declarative animations (used in `app/page.tsx` for book grid transitions)
- `lucide-react` 0.554.0 - SVG icon library (used in `app/page.tsx`, `components/BookCard.tsx`, `components/UploadButton.tsx`)
- `uuid` 13.0.0 - UUID v4 generation for `Book`, `Highlight`, and history record IDs (`lib/parser.ts`, `lib/db.ts`)
- `dotenv` 17.2.3 - `.env` loading for standalone migration script (`migrate_to_s3.ts`)
## TypeScript Configuration
- `strict: true` — strict type checking enabled
- `paths: { "@/*": ["./*"] }` — root-relative path alias (used throughout as `@/lib/...`, `@/components/...`)
- `moduleResolution: "bundler"` — Next.js bundler resolution
- `isolatedModules: true` — required for SWC/transpiler compatibility
- `target: "ES2017"`
## Configuration Files
| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js config; allows remote images from `*.amazonaws.com` |
| `tsconfig.json` | TypeScript compiler options |
| `eslint.config.mjs` | ESLint flat config with Next.js presets |
| `postcss.config.mjs` | PostCSS pipeline pointing to Tailwind v4 |
| `amplify.yml` | AWS Amplify Hosting build spec |
| `netlify.toml` | Netlify deployment config with `@netlify/plugin-nextjs` |
## Platform Requirements
- Node.js v22+
- `.env.local` with S3 and Cognito credentials (see INTEGRATIONS.md)
- Deployed to **AWS Amplify Hosting** (primary — `amplify.yml` present with full build spec)
- **Netlify** also supported via `netlify.toml` with `@netlify/plugin-nextjs` plugin
- Build output: `.next/` directory (Next.js standard output)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase `.tsx` files (e.g., `BookCard.tsx`, `UploadButton.tsx`, `AuthProvider.tsx`)
- Library/utility modules: camelCase `.ts` files (e.g., `db.ts`, `parser.ts`, `covers.ts`, `amplify-server.ts`)
- API route files: always named `route.ts` following Next.js App Router convention
- Page files: always named `page.tsx` following Next.js App Router convention
- Configuration files: lowercase with relevant extension (e.g., `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`)
- Exported utility/lib functions: camelCase verbs (e.g., `getBooks`, `saveDb`, `deleteBook`, `parseClippings`, `fetchCover`, `checkAuth`)
- React components: PascalCase (e.g., `BookCard`, `UploadButton`, `HighlightList`, `AuthProvider`)
- API handler functions: HTTP method names in uppercase matching Next.js convention — `GET`, `POST`, `DELETE`
- Event handlers in components: camelCase prefixed with `handle` (e.g., `handleFileChange`, `handleDeleteBook`, `handleRename`, `handleCopy`, `handleCoverUpload`, `handleRestore`)
- Async data-fetch helpers within page components: camelCase prefixed with `fetch` (e.g., `fetchBook`, `fetchBooks`, `fetchHistory`)
- Local variables: camelCase (e.g., `parsedBooks`, `existingBook`, `newHighlightsCount`, `deletedBooksSet`)
- Constants / module-level config: SCREAMING_SNAKE_CASE for pure string constants (e.g., `DB_KEY`, `BUCKET_NAME`, `REGION`, `ACCESS_KEY`)
- State variables: camelCase noun + paired setter in `set` + PascalCase noun style (e.g., `[books, setBooks]`, `[loading, setLoading]`, `[isUploading, setIsUploading]`, `[copyingId, setCopyingId]`)
- Boolean state variables: prefixed with `is` (e.g., `isUploading`, `isEditing`, `isAuthenticated`, `savingRename`, `uploadingCover`)
- Interfaces: PascalCase prefixed with no `I` (e.g., `Book`, `Highlight`, `DbSchema`, `BookAlias`, `DeletedItem`, `RenamedItem`)
- Component prop interfaces: `[ComponentName]Props` (e.g., `BookCardProps`, `UploadButtonProps`, `SearchBarProps`, `HighlightListProps`)
- No `type` aliases observed — exclusively `interface` is used in `lib/types.ts`
- Feature areas: lowercase kebab-case where needed (e.g., `amplify-server.ts`)
- Next.js dynamic segments: bracket notation in directory names (e.g., `app/api/books/[id]/`, `app/book/[id]/`)
## Code Style
- No Prettier config file present — formatting is not enforced by tooling
- Indentation: 2 spaces in most files (app/, components/); 4 spaces observed in `lib/` files (`db.ts`, `parser.ts`, `s3.ts`, `amplify-server.ts`) — **inconsistency exists**
- Single quotes used in `lib/` files; double quotes used in `app/` page/component files — **no enforced quote style**
- Trailing commas: present in most multiline constructs
- Semicolons: always present
- ESLint 9.x configured via `eslint.config.mjs`
- Rules: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- No custom rule overrides — uses Next.js recommended defaults
- Run with: `npm run lint` (calls `eslint` directly)
## TypeScript Usage
- `strict: true` — all strict checks enabled
- `target: ES2017`
- `module: esnext` / `moduleResolution: bundler`
- `noEmit: true` — type checking only, Next.js handles compilation
- `resolveJsonModule: true`
- `isolatedModules: true`
- All function parameters and return types are explicitly typed in `lib/` utilities
- React component props use explicit interfaces (e.g., `BookCardProps`, `UploadButtonProps`)
- `useState` hooks are typed with generics where non-trivially inferred (e.g., `useState<Book[]>([])`, `useState<Book | null>(null)`, `useState<string | null>(null)`)
- Generic function typing: `Promise<T>` return types on all async functions in `lib/db.ts`
- Union types used for discriminated types: `DeletedItem | RenamedItem`, `Book | Highlight`, `'book' | 'highlight' | 'rename'`
- Optional fields marked with `?` in interfaces (e.g., `coverUrl?`, `location?`, `page?`, `aliases?`)
- `error: any` typed in catch blocks — widespread pattern (not ideal but consistent)
- Non-null assertion `!` used on Map `.get()` results after `.has()` check (e.g., `booksMap.get(bookKey)!`)
- Type narrowing via type predicates: `(item): item is DeletedItem => item.type === 'book'`
- `Readonly<{}>` used in layout for children props
- `@/*` maps to project root (configured in `tsconfig.json`)
- Used consistently throughout `app/` and `components/` for imports from `lib/` (e.g., `import { Book } from '@/lib/types'`)
## Import/Export Patterns
- All components use `export default function ComponentName` — no named exports for components
- Library functions use named exports: `export async function getBooks()`, `export function parseClippings()`
- Types/interfaces use named exports from `lib/types.ts`
- Re-exports: none observed — each consumer imports directly from source
- All interactive components include `'use client'` as first line: `BookCard.tsx`, `UploadButton.tsx`, `AuthProvider.tsx`, `AuthButton.tsx`, `SearchBar.tsx`, `HighlightList.tsx`
- All page components using hooks include `'use client'`: `app/page.tsx`, `app/book/[id]/page.tsx`, `app/history/page.tsx`, `app/login/page.tsx`
- `app/layout.tsx` does NOT have `'use client'` — it is a Server Component
## Error Handling
- All API routes wrap in try/catch
- Error typed as `error: any` to access `.message`
- `console.error` always called before returning error response
- Error responses always JSON: `{ error: string }`
- HTTP status codes used: 400 (bad input), 401 (unauthorized), 404 (not found), 500 (server error)
- Called as the very first statement in POST/DELETE handlers
- `unauthorizedResponse()` from `lib/amplify-server.ts` returns `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`
- try/catch in all async event handlers
- `console.error` for logging in catch blocks
- `alert()` used for user-facing error messages (e.g., `alert('Upload failed. Please try again.')`) — no toast/notification system
- Optimistic updates with rollback: `handleDeleteHighlight` in `app/book/[id]/page.tsx` applies optimistic state update and calls `fetchBook()` on error to revert
- Missing covers: handled by conditional rendering (show `BookIcon` placeholder if no `coverUrl`)
- Missing credentials: `console.warn` in `lib/s3.ts` at module load time rather than throwing
## Logging
- `console.error(description, error)` — used consistently for caught errors in both server and client code
- `console.warn(message)` — used in `lib/s3.ts` for missing credentials
- `console.log(label, value)` — used in `lib/amplify-server.ts` for debug-level auth diagnostics (left in production code)
- Pattern: always include a descriptive string prefix before the error object
## Comments
- Inline comments explain non-obvious logic (e.g., parsing regex patterns in `lib/parser.ts`, S3 key format in `app/api/upload/route.ts`)
- Section separators with numbered steps for complex multi-step operations (e.g., upload route uses `// 1. Map Existing Books`, `// 2. Map Deleted Books`)
- `// SMART IMPORT CHECK 1:` / `// SMART IMPORT CHECK 2:` annotate business logic guards
- TODO-like notes as inline comments (e.g., `// ACL: 'public-read' // ACLs are often disabled...`, `// Fallback or other sources could be added here`)
- No JSDoc/TSDoc annotations anywhere in the codebase
## Common Utility Patterns
## Module Design
- `lib/types.ts` — pure type definitions only
- `lib/db.ts` — all S3 JSON database read/write operations
- `lib/s3.ts` — S3 client singleton and bucket name export
- `lib/parser.ts` — pure parsing logic (no I/O)
- `lib/covers.ts` — cover image fetching from external APIs
- `lib/amplify-server.ts` — auth utilities for server context
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- All pages are client components (`'use client'`) that fetch data via internal REST API routes
- No server-side rendering for page content — pages fetch on mount via `useEffect` + `fetch`
- API routes act as the only server-side boundary; all data access goes through `lib/`
- Persistence is entirely in AWS S3: a single `db.json` file is the database, and cover images are stored as S3 objects
- Authentication is AWS Cognito (via Amplify), enforced per-route in API handlers
## Layers
- Purpose: Render views, manage local UI state, call internal API endpoints
- Location: `app/page.tsx`, `app/book/[id]/page.tsx`, `app/history/page.tsx`, `app/login/page.tsx`
- Contains: React client components with `useState`/`useEffect` for data fetching
- Depends on: `components/`, `lib/types.ts` (for TypeScript interfaces only)
- Used by: End users via browser
- Purpose: Shared UI building blocks consumed by pages
- Location: `components/`
- Contains: `BookCard.tsx`, `HighlightList.tsx`, `SearchBar.tsx`, `UploadButton.tsx`, `AuthButton.tsx`, `AuthProvider.tsx`
- Depends on: `lib/types.ts`, Amplify auth hooks
- Used by: Pages in `app/`
- Purpose: REST endpoints; the only server-side boundary — validates auth, delegates to `lib/db`
- Location: `app/api/`
- Contains: Next.js `route.ts` files exporting HTTP method functions (`GET`, `POST`, `DELETE`)
- Depends on: `lib/db.ts`, `lib/amplify-server.ts`, `lib/parser.ts`, `lib/covers.ts`, `lib/s3.ts`
- Used by: UI pages via `fetch('/api/...')`
- Purpose: Pure service/utility functions with no HTTP concerns
- Location: `lib/`
- Contains:
- Depends on: AWS SDK, external APIs (Open Library, Google Books)
- Used by: API route handlers only
## Data Flow
- No global client state manager (no Redux, Zustand, Context for data)
- Each page manages its own local state via `useState`
- Auth state provided globally via `<AuthProvider>` (Amplify `Authenticator.Provider` context) wrapping the entire app in `app/layout.tsx`
- Components subscribe to auth status via `useAuthenticator(context => [context.authStatus])` hook
- UI-level optimistic updates in `app/book/[id]/page.tsx` for highlight deletion
## Key Abstractions
- Purpose: The entire application database — a single JSON object stored as `db.json` in S3
- Defined in: `lib/types.ts`
- Structure: `{ books: Book[], history: (DeletedItem | RenamedItem)[], lastSync: string }`
- Accessed via: `getDb()` / `saveDb()` in `lib/db.ts` using a read-modify-write pattern
- Purpose: Core domain object representing a Kindle book with its highlights
- Defined in: `lib/types.ts`
- Fields: `id` (UUID), `title`, `author`, `coverUrl` (S3 URL), `highlights[]`, `lastUpdated`, `aliases[]`
- Aliases: stored to preserve import matching after renames
- Purpose: Audit/undo log for destructive operations; enables soft-delete and restore
- Defined in: `lib/types.ts`
- Both stored together in `db.history[]` discriminated by `type` field
- Purpose: Server-side auth enforcement on mutating API routes
- Location: `lib/amplify-server.ts`
- Pattern: `if (!await checkAuth()) return unauthorizedResponse();` at top of every write handler
## Entry Points
- Location: `app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Wraps entire app in `<AuthProvider>` (Amplify context), sets global fonts and CSS
- Location: `app/page.tsx`
- Triggers: Navigation to `/`
- Responsibilities: Fetches and displays all books, provides search and upload entry points
- Location: `app/api/*/route.ts`
- Triggers: HTTP requests from client pages
- Responsibilities: Auth enforcement (write routes), delegation to `lib/db.ts`
## Error Handling
- API routes: `try/catch` → `NextResponse.json({ error: message }, { status: 500 })`
- `lib/db.ts`: S3 `NoSuchKey` / `NotFound` errors handled gracefully (returns empty DB); other errors re-thrown
- Client pages: async errors caught in `try/catch`, user notified via `alert()` — no toast/error boundary pattern
- Auth errors: `checkAuth()` returns `false` on any exception; write routes return 401
## Cross-Cutting Concerns
- Client-side: Amplify `useAuthenticator` hook provides `authStatus`; UI conditionally renders actions (delete, upload, rename buttons hidden when not authenticated)
- Server-side: `checkAuth()` in `lib/amplify-server.ts` reads Cognito JWT from cookies and validates via `runWithAmplifyServerContext`
- Read operations (`GET /api/books`, `GET /api/books/[id]`, `GET /api/history`) are **public** — no auth required
- Write operations require auth: upload, delete book, delete highlight, rename, cover upload, restore
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
