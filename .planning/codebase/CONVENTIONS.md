# Coding Conventions

**Analysis Date:** 2026-04-13

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` files (e.g., `BookCard.tsx`, `UploadButton.tsx`, `AuthProvider.tsx`)
- Library/utility modules: camelCase `.ts` files (e.g., `db.ts`, `parser.ts`, `covers.ts`, `amplify-server.ts`)
- API route files: always named `route.ts` following Next.js App Router convention
- Page files: always named `page.tsx` following Next.js App Router convention
- Configuration files: lowercase with relevant extension (e.g., `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`)

**Functions:**
- Exported utility/lib functions: camelCase verbs (e.g., `getBooks`, `saveDb`, `deleteBook`, `parseClippings`, `fetchCover`, `checkAuth`)
- React components: PascalCase (e.g., `BookCard`, `UploadButton`, `HighlightList`, `AuthProvider`)
- API handler functions: HTTP method names in uppercase matching Next.js convention — `GET`, `POST`, `DELETE`
- Event handlers in components: camelCase prefixed with `handle` (e.g., `handleFileChange`, `handleDeleteBook`, `handleRename`, `handleCopy`, `handleCoverUpload`, `handleRestore`)
- Async data-fetch helpers within page components: camelCase prefixed with `fetch` (e.g., `fetchBook`, `fetchBooks`, `fetchHistory`)

**Variables:**
- Local variables: camelCase (e.g., `parsedBooks`, `existingBook`, `newHighlightsCount`, `deletedBooksSet`)
- Constants / module-level config: SCREAMING_SNAKE_CASE for pure string constants (e.g., `DB_KEY`, `BUCKET_NAME`, `REGION`, `ACCESS_KEY`)
- State variables: camelCase noun + paired setter in `set` + PascalCase noun style (e.g., `[books, setBooks]`, `[loading, setLoading]`, `[isUploading, setIsUploading]`, `[copyingId, setCopyingId]`)
- Boolean state variables: prefixed with `is` (e.g., `isUploading`, `isEditing`, `isAuthenticated`, `savingRename`, `uploadingCover`)

**Types / Interfaces:**
- Interfaces: PascalCase prefixed with no `I` (e.g., `Book`, `Highlight`, `DbSchema`, `BookAlias`, `DeletedItem`, `RenamedItem`)
- Component prop interfaces: `[ComponentName]Props` (e.g., `BookCardProps`, `UploadButtonProps`, `SearchBarProps`, `HighlightListProps`)
- No `type` aliases observed — exclusively `interface` is used in `lib/types.ts`

**Directories:**
- Feature areas: lowercase kebab-case where needed (e.g., `amplify-server.ts`)
- Next.js dynamic segments: bracket notation in directory names (e.g., `app/api/books/[id]/`, `app/book/[id]/`)

## Code Style

**Formatting:**
- No Prettier config file present — formatting is not enforced by tooling
- Indentation: 2 spaces in most files (app/, components/); 4 spaces observed in `lib/` files (`db.ts`, `parser.ts`, `s3.ts`, `amplify-server.ts`) — **inconsistency exists**
- Single quotes used in `lib/` files; double quotes used in `app/` page/component files — **no enforced quote style**
- Trailing commas: present in most multiline constructs
- Semicolons: always present

**Linting:**
- ESLint 9.x configured via `eslint.config.mjs`
- Rules: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- No custom rule overrides — uses Next.js recommended defaults
- Run with: `npm run lint` (calls `eslint` directly)

## TypeScript Usage

**Compiler settings** (`tsconfig.json`):
- `strict: true` — all strict checks enabled
- `target: ES2017`
- `module: esnext` / `moduleResolution: bundler`
- `noEmit: true` — type checking only, Next.js handles compilation
- `resolveJsonModule: true`
- `isolatedModules: true`

**Type annotation patterns:**
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

**Path aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Used consistently throughout `app/` and `components/` for imports from `lib/` (e.g., `import { Book } from '@/lib/types'`)

## Import/Export Patterns

**Import organization (typical order observed):**
1. Next.js framework imports (`next/server`, `next/navigation`, `next/link`)
2. React imports (`react`, specific hooks)
3. Third-party libraries (`aws-amplify`, `framer-motion`, `lucide-react`, `uuid`)
4. Internal `@/lib/` imports
5. Internal `@/components/` imports
6. Relative imports (rare — only in API routes where imports sometimes appear mid-file)

**Imports mid-file:** Two API route files import `checkAuth` after the main imports block — `app/api/books/[id]/route.ts` and `app/api/upload/route.ts` have `import { checkAuth, unauthorizedResponse }` after helper function definitions. This is inconsistent with the top-of-file import pattern.

**Export style:**
- All components use `export default function ComponentName` — no named exports for components
- Library functions use named exports: `export async function getBooks()`, `export function parseClippings()`
- Types/interfaces use named exports from `lib/types.ts`
- Re-exports: none observed — each consumer imports directly from source

**CSS imports:** Component-scoped Amplify styles imported directly in component files (e.g., `import '@aws-amplify/ui-react/styles.css'`)

**'use client' directive:**
- All interactive components include `'use client'` as first line: `BookCard.tsx`, `UploadButton.tsx`, `AuthProvider.tsx`, `AuthButton.tsx`, `SearchBar.tsx`, `HighlightList.tsx`
- All page components using hooks include `'use client'`: `app/page.tsx`, `app/book/[id]/page.tsx`, `app/history/page.tsx`, `app/login/page.tsx`
- `app/layout.tsx` does NOT have `'use client'` — it is a Server Component

## Error Handling

**API route pattern (server-side):**
```typescript
export async function GET(req: NextRequest) {
    try {
        const data = await someOperation();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Descriptive prefix Error:', error);
        return NextResponse.json({ error: error.message || 'Fallback message' }, { status: 500 });
    }
}
```
- All API routes wrap in try/catch
- Error typed as `error: any` to access `.message`
- `console.error` always called before returning error response
- Error responses always JSON: `{ error: string }`
- HTTP status codes used: 400 (bad input), 401 (unauthorized), 404 (not found), 500 (server error)

**Authentication guard pattern (used in all mutating API routes):**
```typescript
if (!await checkAuth()) return unauthorizedResponse();
```
- Called as the very first statement in POST/DELETE handlers
- `unauthorizedResponse()` from `lib/amplify-server.ts` returns `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`

**Client-side error handling:**
- try/catch in all async event handlers
- `console.error` for logging in catch blocks
- `alert()` used for user-facing error messages (e.g., `alert('Upload failed. Please try again.')`) — no toast/notification system
- Optimistic updates with rollback: `handleDeleteHighlight` in `app/book/[id]/page.tsx` applies optimistic state update and calls `fetchBook()` on error to revert

**Graceful degradation:**
- Missing covers: handled by conditional rendering (show `BookIcon` placeholder if no `coverUrl`)
- Missing credentials: `console.warn` in `lib/s3.ts` at module load time rather than throwing

## Logging

**Framework:** `console` (no structured logging library)

**Patterns:**
- `console.error(description, error)` — used consistently for caught errors in both server and client code
- `console.warn(message)` — used in `lib/s3.ts` for missing credentials
- `console.log(label, value)` — used in `lib/amplify-server.ts` for debug-level auth diagnostics (left in production code)
- Pattern: always include a descriptive string prefix before the error object

## Comments

**When comments appear:**
- Inline comments explain non-obvious logic (e.g., parsing regex patterns in `lib/parser.ts`, S3 key format in `app/api/upload/route.ts`)
- Section separators with numbered steps for complex multi-step operations (e.g., upload route uses `// 1. Map Existing Books`, `// 2. Map Deleted Books`)
- `// SMART IMPORT CHECK 1:` / `// SMART IMPORT CHECK 2:` annotate business logic guards
- TODO-like notes as inline comments (e.g., `// ACL: 'public-read' // ACLs are often disabled...`, `// Fallback or other sources could be added here`)
- No JSDoc/TSDoc annotations anywhere in the codebase

**JSDoc/TSDoc:** Not used — zero `/** */` doc blocks present.

## Common Utility Patterns

**Date handling:** Always `new Date().toISOString()` for timestamps; `new Date(str).toLocaleDateString()` for display formatting. No date library used.

**UUID generation:** `import { v4 as uuidv4 } from 'uuid'` — named import aliased to `uuidv4`. Exception: `lib/db.ts` uses `require('uuid').v4()` inline (inconsistency).

**Map-based deduplication:** `Map<string, T>` used for O(1) lookup when merging books (e.g., `booksMap`, `existingBooksMap`) and `Set<string>` for tracking deleted items.

**Conditional rendering:** Early returns used for loading/empty states before main render in page components. Pattern:
```typescript
if (loading) return <Spinner />;
if (!data) return <NotFoundMessage />;
return <MainContent />;
```

**Auth-gated UI:** `authStatus === 'authenticated'` check from `useAuthenticator` hook used to conditionally render mutating controls (delete, upload, rename buttons).

**Environment variable fallbacks:** `process.env.PRIMARY_VAR || process.env.FALLBACK_VAR` pattern used in `lib/s3.ts` and `lib/amplify-server.ts`.

## Module Design

**Exports:** Named exports for all `lib/` functions; default exports for all React components.

**Barrel files:** None — no `index.ts` files. Each module imported directly by path.

**Separation of concerns:**
- `lib/types.ts` — pure type definitions only
- `lib/db.ts` — all S3 JSON database read/write operations
- `lib/s3.ts` — S3 client singleton and bucket name export
- `lib/parser.ts` — pure parsing logic (no I/O)
- `lib/covers.ts` — cover image fetching from external APIs
- `lib/amplify-server.ts` — auth utilities for server context

---

*Convention analysis: 2026-04-13*
