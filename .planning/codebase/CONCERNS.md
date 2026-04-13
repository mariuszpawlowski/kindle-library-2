# Codebase Concerns

**Analysis Date:** 2026-04-13

---

## Security Concerns

### SEC-1: Debug Auth Endpoint Exposes Environment Config (High)
- **Category:** Security
- **Location:** `app/api/debug-auth/route.ts`
- **Description:** The `/api/debug-auth` endpoint is publicly accessible (no `checkAuth()` guard) and returns the set/missing status of Cognito and S3 environment variable names. While it doesn't expose values, it reveals the exact configuration surface area, confirming which vars are present to any unauthenticated caller.
- **Severity:** High
- **Suggested fix:** Either remove this endpoint entirely in production or add `if (!await checkAuth()) return unauthorizedResponse();` before the response.

---

### SEC-2: Error Stack Trace Leaked to HTTP Response (High)
- **Category:** Security
- **Location:** `app/api/image-proxy/route.ts:28`
- **Description:** The catch block explicitly serializes `error.stack` into the JSON error response sent to the client: `{ error: '...', details: error.message, stack: error.stack }`. This exposes internal server file paths, dependency names, and code structure to any user who triggers an error.
- **Severity:** High
- **Suggested fix:** Remove `stack` and `details` from the response. Return a generic message: `return NextResponse.json({ error: 'Internal server error' }, { status: 500 });`

---

### SEC-3: SSRF via Unvalidated Image Proxy URL (High)
- **Category:** Security
- **Location:** `app/api/image-proxy/route.ts:11`
- **Description:** The `/api/image-proxy?url=` endpoint fetches any arbitrary URL passed as a query parameter with no validation. This is a classic Server-Side Request Forgery (SSRF) vector — an attacker can use this endpoint to probe internal networks, AWS metadata endpoints (`http://169.254.169.254/`), or other internal services.
- **Severity:** High
- **Suggested fix:** Validate that the URL belongs to an allowlist of permitted hosts (e.g., `*.amazonaws.com`, `covers.openlibrary.org`, `books.google.com`). Reject all other hosts. Block private IP ranges.

---

### SEC-4: Unvalidated HTTP Redirect Chain in S3 Image Upload (Medium)
- **Category:** Security
- **Location:** `app/api/upload/route.ts:34-39`
- **Description:** The `uploadImageToS3` function recursively follows HTTP 301/302 redirects via `res.headers.location` with no depth limit, no allowlist check, and no loop detection. A malicious cover URL could redirect to an internal AWS metadata endpoint or trigger infinite redirect loops.
- **Severity:** Medium
- **Suggested fix:** Add a redirect counter (max 3), validate the redirect target URL is HTTPS and from an allowed host, and reject redirects to private/loopback IP addresses.

---

### SEC-5: Unauthenticated Read Access to Full Library Data (Medium)
- **Category:** Security
- **Location:** `app/api/books/route.ts`, `app/api/books/[id]/route.ts`, `app/api/history/route.ts`
- **Description:** All GET endpoints (`/api/books`, `/api/books/[id]`, `/api/history`) are publicly accessible with no authentication required. Anyone with the URL can enumerate all books, authors, highlights, and complete deletion history. This is by design for a personal library but may be unintended in certain deployment contexts.
- **Severity:** Medium
- **Suggested fix:** If this is a private library, add `checkAuth()` guards to all GET routes as well. If public reading is intentional, document this explicitly.

---

### SEC-6: Internal Error Messages Exposed to Client (Low)
- **Category:** Security
- **Location:** `app/api/books/route.ts:14`, `app/api/upload/route.ts:183`
- **Description:** These handlers return `error.message` directly in the API response: `{ error: error.message || 'fallback' }`. SDK error messages from AWS S3 or other services may contain bucket names, region info, or internal details.
- **Severity:** Low
- **Suggested fix:** Log the full error server-side, return a generic user-facing message in the response.

---

### SEC-7: No Security Headers Configured (Low)
- **Category:** Security
- **Location:** `next.config.ts`
- **Description:** The Next.js config has no `headers()` function defined. No `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, or `Content-Security-Policy` headers are set.
- **Severity:** Low
- **Suggested fix:** Add a `headers()` export in `next.config.ts` with standard security headers.

---

## Technical Debt

### DEBT-1: CommonJS `require()` Inside TypeScript ES Module Code (Medium)
- **Category:** Tech Debt
- **Location:** `lib/db.ts:87`, `lib/db.ts:111`
- **Description:** Two calls use `require('uuid').v4()` inside `deleteBook()` and `deleteHighlight()` functions, which is a CommonJS pattern mixing with the ESM import of `uuid` already used elsewhere (e.g., `lib/parser.ts` uses `import { v4 as uuidv4 } from 'uuid'`). This is inconsistent and may behave unexpectedly in strict ESM environments.
- **Severity:** Medium
- **Suggested fix:** Replace `require('uuid').v4()` with a proper import at the top of `lib/db.ts`: `import { v4 as uuidv4 } from 'uuid';`, then use `uuidv4()` in both call sites.

---

### DEBT-2: Debug `console.log` Statements Left in Production Auth Code (Medium)
- **Category:** Tech Debt
- **Location:** `lib/amplify-server.ts:20-25`, `lib/amplify-server.ts:32`
- **Description:** The `checkAuth()` function — which runs on every authenticated request — logs "Checking auth...", Pool ID status, all cookie names, and session token presence on every call. This generates significant noise in production logs and wastes I/O.
- **Severity:** Medium
- **Suggested fix:** Remove or gate these `console.log` calls behind `process.env.NODE_ENV === 'development'`.

---

### DEBT-3: Imports Placed Mid-File Instead of at Top (Low)
- **Category:** Tech Debt / Code Style
- **Location:** `app/api/books/[id]/route.ts:16`, `app/api/books/[id]/cover/route.ts:8`, `app/api/books/[id]/rename/route.ts:6`, `app/api/highlights/[id]/route.ts:4`, `app/api/history/[id]/restore/route.ts:4`, `app/api/upload/route.ts:49`
- **Description:** The `import { checkAuth, unauthorizedResponse }` statement is placed after the function definitions rather than at the top of the file. While JavaScript hoisting does not apply to ES module imports at runtime, this violates standard conventions and will trigger linting warnings.
- **Severity:** Low
- **Suggested fix:** Move all imports to the top of each file.

---

### DEBT-4: `AnimatePresence` Imported But Not Meaningfully Used (Low)
- **Category:** Tech Debt
- **Location:** `components/HighlightList.tsx:6`
- **Description:** `AnimatePresence` is imported from `framer-motion` and wraps the highlight list, but the children are plain `<div>` elements with no `motion.*` wrapper and no `exit` animation prop. The comment on line 6 itself notes "motion.div is removed". This import has no effect and adds bundle weight.
- **Severity:** Low
- **Suggested fix:** Remove the `AnimatePresence` import and wrapper, or replace `<div>` with `<motion.div>` with proper `initial`/`animate`/`exit` props if animation is desired.

---

### DEBT-5: `saveBooks()` Function Defined But Unused (Low)
- **Category:** Tech Debt
- **Location:** `lib/db.ts:68-73`
- **Description:** The `saveBooks()` exported function reads the DB, replaces `db.books`, and saves — but it is never called anywhere in the codebase. All save operations go through `saveDb()` directly.
- **Severity:** Low
- **Suggested fix:** Remove `saveBooks()` or use it consistently to reduce duplication.

---

### DEBT-6: Migration Script Left in Repository Root (Low)
- **Category:** Tech Debt
- **Location:** `migrate_to_s3.ts`
- **Description:** A one-time data migration script (`migrate_to_s3.ts`) exists in the project root, not in a `scripts/` directory. It has no way to be run via `npm run` and references hardcoded local paths. It has likely already been run and is now dead code.
- **Severity:** Low
- **Suggested fix:** Move to `scripts/migrate_to_s3.ts`, add a npm script entry, or delete if migration is complete.

---

## Performance Concerns

### PERF-1: S3 Read-Modify-Write on Every Mutation (High)
- **Category:** Performance / Reliability
- **Location:** `lib/db.ts` (all mutation functions)
- **Description:** Every write operation (`deleteBook`, `deleteHighlight`, `updateBookCover`, `restoreItem`) calls `getDb()` to fetch the entire JSON file from S3, then calls `saveDb()` to write it back. With a large library, this means every delete or update involves downloading and uploading the complete dataset. More critically, there is **no locking mechanism** — concurrent requests (e.g., two simultaneous deletes) will result in a race condition where one write overwrites the other's changes.
- **Severity:** High
- **Suggested fix:** For short term: serialize mutations with an in-memory queue or use a proper database (DynamoDB, Planetscale, Supabase). For minimum viable fix: add an ETag-based optimistic lock on S3 writes.

---

### PERF-2: Sequential Cover Fetching During Upload Blocks Response (Medium)
- **Category:** Performance
- **Location:** `app/api/upload/route.ts:144-153`
- **Description:** Inside the `for...of` loop over parsed books, each new book awaits `fetchCover()` and `uploadImageToS3()` sequentially before continuing to the next book. For a clippings file with 20+ new books, this can take tens of seconds, blocking the HTTP request. `fetchCover()` itself makes two serial HTTP requests (OpenLibrary → Google Books).
- **Severity:** Medium
- **Suggested fix:** Process cover fetching in parallel using `Promise.allSettled()`, or defer cover fetching to a background job after returning the initial success response.

---

### PERF-3: `ensureDb()` S3 HeadObject Call on Every `getDb()` (Medium)
- **Category:** Performance
- **Location:** `lib/db.ts:17-28`, `lib/db.ts:30-31`
- **Description:** Every call to `getDb()` first calls `ensureDb()` which issues an S3 `HeadObject` request to check if `db.json` exists. Once the file exists (which it always does after initial setup), this is an unnecessary network round-trip on every read.
- **Severity:** Medium
- **Suggested fix:** Remove the `ensureDb()` call from `getDb()`, handle the `NoSuchKey` case directly in `getDb()` by returning the empty schema, and only call `ensureDb()` at startup or in a dedicated initialization flow.

---

### PERF-4: `checkAuth()` Called Independently on Each API Request (Medium)
- **Category:** Performance
- **Location:** `lib/amplify-server.ts:17-38`, all authenticated API routes
- **Description:** Each authenticated request calls `checkAuth()` which invokes `runWithAmplifyServerContext` → `fetchAuthSession`, performing a full cookie parse and token validation. There is no caching, so repeated API calls from the same user re-verify auth from scratch each time.
- **Severity:** Medium
- **Suggested fix:** Consider using Next.js middleware for auth gating, which runs once per request before routing, rather than per-handler function calls.

---

### PERF-5: Client-Side Filtering on Full Book List (Low)
- **Category:** Performance
- **Location:** `app/page.tsx:44-47`
- **Description:** All books are fetched from the server and stored in state, then filtered client-side on every keystroke via the `searchTerm`. For very large libraries this is fine, but combined with PERF-1 the initial load is slow for large datasets.
- **Severity:** Low
- **Suggested fix:** Acceptable at current scale. If library grows >500 books, consider server-side pagination or filtering.

---

## Architectural Concerns

### ARCH-1: Flat JSON File as Database — No Indexing, No Transactions (High)
- **Category:** Architecture
- **Location:** `lib/db.ts`, `lib/s3.ts`
- **Description:** The entire application database is a single JSON file (`db.json`) stored in S3. This design has several fundamental limitations: (1) no atomic transactions — partial writes can corrupt state, (2) no indexes — all lookups are O(n) linear scans, (3) the whole file must be downloaded/uploaded on every operation, (4) size grows unboundedly as history accumulates, (5) concurrent request race conditions as noted in PERF-1.
- **Severity:** High
- **Suggested fix:** For a personal-scale library this is manageable, but any growth in users or data should prompt migration to a proper database (DynamoDB, Supabase, PlanetScale, etc.).

---

### ARCH-2: No Next.js Middleware — Auth Enforced Per-Handler (Medium)
- **Category:** Architecture
- **Location:** All `app/api/*/route.ts` files
- **Description:** Authentication is implemented by manually calling `checkAuth()` at the top of each mutating handler. There is no `middleware.ts` file that could centrally enforce auth. This means it's easy to add a new route and forget to add `checkAuth()` — resulting in an unauthenticated endpoint.
- **Severity:** Medium
- **Suggested fix:** Create `middleware.ts` in the project root to intercept protected routes (e.g., all mutating API paths) and redirect/block unauthenticated requests.

---

### ARCH-3: History Array Grows Unboundedly (Medium)
- **Category:** Architecture / Scalability
- **Location:** `lib/db.ts`, `lib/types.ts`
- **Description:** Every delete and rename operation appends an entry to `db.history`. There is no retention policy, pagination, or cleanup mechanism. Over time (especially after many clippings re-imports), the history array grows without bound, increasing JSON file size and memory usage on every load.
- **Severity:** Medium
- **Suggested fix:** Implement a history retention limit (e.g., last 500 entries) or add a "Clear History" API endpoint that prunes old entries.

---

### ARCH-4: Cover URL Construction Hardcodes S3 URL Format (Medium)
- **Category:** Architecture
- **Location:** `app/api/upload/route.ts:28`, `app/api/books/[id]/cover/route.ts:41`, `migrate_to_s3.ts:41`
- **Description:** S3 URLs are constructed by string concatenation in three separate places: `` `https://${BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${key}` ``. This pattern won't work with custom S3 endpoints (e.g., MinIO, S3-compatible providers, path-style URLs) and must be updated in three places if the URL format changes.
- **Severity:** Medium
- **Suggested fix:** Extract a `getS3Url(key: string): string` helper in `lib/s3.ts` and use it everywhere.

---

### ARCH-5: Duplicate Highlight Deduplication Logic in Two Places (Low)
- **Category:** Architecture
- **Location:** `lib/parser.ts:84`, `app/api/upload/route.ts:129`
- **Description:** Highlight deduplication by text (`h.text === highlight.text`) is performed both inside the parser (for within-file deduplication) and again in the upload route (for across-import deduplication). The logic is duplicated and the comment in `parser.ts` says "Avoid duplicates" — duplicating intent.
- **Severity:** Low
- **Suggested fix:** Consolidate deduplication in a single utility function or keep it only in the upload route where the authoritative check is needed.

---

## Missing Functionality

### MISS-1: No File Size Limit on Upload Endpoint (High)
- **Category:** Missing Validation
- **Location:** `app/api/upload/route.ts:56`
- **Description:** The upload handler reads the full file content into memory (`await file.text()`) with no size check. A malicious or accidental upload of a very large file could cause excessive memory usage or request timeouts. The clippings format can theoretically be very large (thousands of books).
- **Severity:** High
- **Suggested fix:** Check `file.size` before processing and reject files over a reasonable limit (e.g., 10MB): `if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large' }, { status: 413 });`

---

### MISS-2: No Cover Upload File Size Limit (Medium)
- **Category:** Missing Validation
- **Location:** `app/api/books/[id]/cover/route.ts:19-27`
- **Description:** The cover upload endpoint validates MIME type (`image/`) but does not limit file size. A user could upload a 100MB image. The `file.arrayBuffer()` call on line 30 would load it entirely into memory.
- **Severity:** Medium
- **Suggested fix:** Add `if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Image too large' }, { status: 413 });` after the MIME type check.

---

### MISS-3: No Input Validation on Rename Title/Author (Low)
- **Category:** Missing Validation
- **Location:** `app/api/books/[id]/rename/route.ts:18-23`
- **Description:** The rename endpoint only checks that `newTitle` and `newAuthor` are truthy. There are no length limits or character validation. Extremely long strings could cause issues with the JSON serialization or the `key` computation used for deduplication (`${title}|${author}`).
- **Severity:** Low
- **Suggested fix:** Add max-length checks: titles/authors > 500 characters should be rejected.

---

### MISS-4: Restore Logic Silently Ignores Orphaned Highlight (Low)
- **Category:** Missing Functionality
- **Location:** `lib/db.ts:163-168`
- **Description:** When restoring a deleted highlight whose parent book has also been deleted, the code logs a warning and returns `undefined` without removing the orphaned history entry. The highlight remains in history permanently but can never be restored.
- **Severity:** Low
- **Suggested fix:** When the parent book is missing, either remove the orphaned highlight from history (with a user-facing explanation), or surface an error through the API response rather than silently failing.

---

### MISS-5: No Error Feedback in `handleDeleteBook` on API Failure (Low)
- **Category:** Missing Error Handling
- **Location:** `app/book/[id]/page.tsx:81-92`
- **Description:** If the `DELETE /api/books/:id` request fails (non-ok response), the code catches nothing from the `res.ok` check — the user sees no error feedback and remains on the page without knowing the deletion failed.
- **Severity:** Low
- **Suggested fix:** Add `else { alert('Failed to delete book'); }` after `if (res.ok)`.

---

## Dependency Concerns

### DEP-1: 39 npm Vulnerabilities Including 8 Critical (High)
- **Category:** Dependencies
- **Location:** `package.json`, `node_modules/`
- **Description:** Running `npm audit` reports 39 vulnerabilities: 8 critical, 22 high, 5 moderate, 4 low. Critical issues include Next.js advisories (GHSA-jcc7-9wpm-mj36, GHSA-5f7q-jpqc-wp7h, GHSA-q4gf-8mx6-v5v3) and AWS SDK chain vulnerabilities via `@aws-amplify/analytics`. High issues include `picomatch` ReDoS vulnerabilities.
- **Severity:** High
- **Suggested fix:** Run `npm audit fix` to resolve auto-fixable issues. For the Next.js vulnerabilities, upgrade to the latest Next.js patch version. Review AWS Amplify and SDK dependency chain updates.

---

### DEP-2: `legacy-peer-deps=true` in `.npmrc` (Medium)
- **Category:** Dependencies
- **Location:** `.npmrc`
- **Description:** The `legacy-peer-deps=true` flag suppresses peer dependency conflict resolution, meaning npm silently allows incompatible package versions to coexist. This masks underlying dependency conflicts and can lead to subtle runtime bugs when packages expect specific peer versions.
- **Severity:** Medium
- **Suggested fix:** Investigate which packages trigger peer conflicts without this flag, resolve them properly by upgrading or pinning packages, and remove the flag from `.npmrc`.

---

### DEP-3: `dotenv` in Production Dependencies (Low)
- **Category:** Dependencies
- **Location:** `package.json:17`
- **Description:** `dotenv` is listed as a production dependency but is only used in the migration script (`migrate_to_s3.ts`). Next.js handles `.env.local` loading natively. Dotenv in production dependencies adds unnecessary package weight.
- **Severity:** Low
- **Suggested fix:** Move `dotenv` to `devDependencies` or remove it if the migration script is complete.

---

## Code Quality Concerns

### QUAL-1: `useEffect` with Missing Dependency in `app/book/[id]/page.tsx` (Low)
- **Category:** Code Quality
- **Location:** `app/book/[id]/page.tsx:75-79`
- **Description:** The `useEffect` that calls `fetchBook()` has `[id]` as its dependency but `fetchBook` is defined outside the `useEffect` and is also used elsewhere. This is a standard React anti-pattern that eslint-plugin-react-hooks would normally flag. The function is recreated on each render but not included in the dependency array.
- **Severity:** Low
- **Suggested fix:** Wrap `fetchBook` in `useCallback` with appropriate dependencies, or inline the fetch logic inside the `useEffect`.

---

### QUAL-2: `useEffect` with No Dependency Array in `app/history/page.tsx` (Low)
- **Category:** Code Quality
- **Location:** `app/history/page.tsx:16-18`
- **Description:** The `useEffect` calls `fetchHistory()` with an empty dependency array `[]`, which means it fetches once on mount. The `fetchHistory` function is referenced in the closure but not in the deps array. While this works at runtime, it will generate a React hooks lint warning.
- **Severity:** Low
- **Suggested fix:** Either add `fetchHistory` to deps (wrapping it in `useCallback`) or inline the fetch logic.

---

### QUAL-3: `alert()` Used for User Feedback Throughout UI (Low)
- **Category:** Code Quality / UX
- **Location:** `app/book/[id]/page.tsx:49`, `app/book/[id]/page.tsx:53`, `app/book/[id]/page.tsx:131`, `app/book/[id]/page.tsx:135`, `app/history/page.tsx:42`, `app/history/page.tsx:46`, `components/UploadButton.tsx:36`, `components/UploadButton.tsx:40`
- **Description:** Native `alert()` and `confirm()` dialogs are used for error messages and confirmation prompts. These block the UI thread, are not stylable, and provide a poor user experience.
- **Severity:** Low
- **Suggested fix:** Replace with a toast/notification component or a styled modal component for confirmations and errors.

---

*Concerns audit: 2026-04-13*
