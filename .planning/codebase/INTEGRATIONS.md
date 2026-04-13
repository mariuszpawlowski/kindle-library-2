# External Integrations

**Analysis Date:** 2026-04-13

## APIs & External Services

### AWS Cognito (Authentication)
- **Purpose:** User authentication and session management
- **SDK/Client:** `aws-amplify` 6.15.9, `@aws-amplify/adapter-nextjs` 1.6.12, `@aws-amplify/ui-react` 6.13.2
- **Integration files:**
  - `components/AuthProvider.tsx` — Configures `Amplify.configure()` with Cognito pool settings; sets `CookieStorage` for SSR cookie-based token storage
  - `lib/amplify-server.ts` — Server-side `createServerRunner` + `checkAuth()` helper used by all protected API routes
  - `app/login/page.tsx` — Renders `<Authenticator>` UI component with Google social provider
- **OAuth:** Cognito Hosted UI with Google as federated identity provider; PKCE `code` flow
- **Session storage:** `CookieStorage` (required for Next.js SSR/server component access to tokens)
- **Auth check:** `checkAuth()` in `lib/amplify-server.ts` is called at the top of every mutating API route handler
- **Required env vars:**
  - `NEXT_PUBLIC_USER_POOL_ID` — Cognito User Pool ID
  - `NEXT_PUBLIC_USER_POOL_CLIENT_ID` — Cognito App Client ID
  - `NEXT_PUBLIC_COGNITO_DOMAIN` — Cognito hosted UI domain (e.g. `https://xxx.auth.region.amazoncognito.com`)

### AWS S3 (Primary Data Store)
- **Purpose:** All application data is stored in S3 — there is no traditional database. `db.json` is a flat JSON file stored in S3, and all book cover images are stored as objects under `covers/`.
- **SDK/Client:** `@aws-sdk/client-s3` 3.937.0 (AWS SDK v3)
- **Integration files:**
  - `lib/s3.ts` — Instantiates `S3Client` with credentials; exports `s3Client` and `BUCKET_NAME`
  - `lib/db.ts` — All CRUD operations (`getDb`, `saveDb`, `getBooks`, `deleteBook`, etc.) read/write `db.json` in S3 via `GetObjectCommand` / `PutObjectCommand`
  - `app/api/upload/route.ts` — Uploads book cover images fetched from Open Library/Google Books to S3 under `covers/<bookId>.jpg`
  - `app/api/books/[id]/cover/route.ts` — Uploads user-provided cover images to S3 under `covers/<bookId>-<uuid>.<ext>`
  - `migrate_to_s3.ts` — One-time migration script to move local `data/db.json` and `public/covers/` to S3
- **S3 object structure:**
  ```
  <bucket>/
  ├── db.json              # Entire app database as JSON
  └── covers/
      ├── <bookId>.jpg     # Auto-fetched covers
      └── <bookId>-<uuid>.<ext>  # User-uploaded covers
  ```
- **Image URL pattern:** `https://<BUCKET_NAME>.s3.<REGION>.amazonaws.com/<key>`
- **Required env vars (S3_ prefix used to avoid Amplify's reserved `AWS_` prefix):**
  - `S3_REGION` (fallback: `AWS_REGION`)
  - `S3_ACCESS_KEY_ID` (fallback: `AWS_ACCESS_KEY_ID`)
  - `S3_SECRET_ACCESS_KEY` (fallback: `AWS_SECRET_ACCESS_KEY`)
  - `S3_BUCKET_NAME` (fallback: `AWS_BUCKET_NAME`)

### Open Library API (Book Covers)
- **Purpose:** Fetch book cover images by title+author during file upload
- **SDK/Client:** Native `fetch` (no SDK)
- **Integration file:** `lib/covers.ts`
- **Endpoints used:**
  - `https://openlibrary.org/search.json?q=<title+author>&limit=1` — Search for book
  - `https://covers.openlibrary.org/b/id/<cover_i>-L.jpg` — Retrieve cover image
- **Auth:** None (public API, no key required)
- **Fallback:** Falls through to Google Books API if Open Library returns no cover

### Google Books API (Book Covers — Fallback)
- **Purpose:** Secondary cover source when Open Library has no cover
- **SDK/Client:** Native `fetch` (no SDK)
- **Integration file:** `lib/covers.ts`
- **Endpoint used:** `https://www.googleapis.com/books/v1/volumes?q=<title+author>`
- **Auth:** None — used without API key (low-usage, unauthenticated tier). Code comment notes key is required for higher limits.
- **Note:** Returns `volumeInfo.imageLinks.thumbnail`; HTTP URLs are normalized to HTTPS

### Google OAuth (Social Sign-In)
- **Purpose:** Federated identity — users sign in via "Continue with Google" button
- **SDK/Client:** Managed by AWS Cognito (configured as an identity provider in the User Pool)
- **Integration file:** `components/AuthProvider.tsx` — `providers: ['Google']` in Amplify OAuth config
- **Auth flow:** Cognito Hosted UI handles the OAuth redirect; app only interacts with Cognito tokens

## Data Storage

**Databases:**
- **AWS S3** — Serves as the sole persistent store. A single `db.json` file contains the entire `DbSchema` (books array, history array, lastSync timestamp). No relational database is used.
- **Schema location:** `lib/types.ts` (`DbSchema`, `Book`, `Highlight`, `DeletedItem`, `RenamedItem`)

**File Storage:**
- **AWS S3** — Book cover images stored under `covers/` prefix in the same bucket as `db.json`
- **Next.js image remote patterns:** `*.amazonaws.com` whitelisted in `next.config.ts` for `<Image>` optimization

**Caching:**
- In-memory only within a single request lifecycle (no Redis or external cache)
- Image proxy route (`app/api/image-proxy/route.ts`) sets `Cache-Control: public, max-age=86400` on proxied images

## Authentication & Identity

**Auth Provider:** AWS Cognito
- Implementation: Cookie-based token storage via `aws-amplify` `CookieStorage` for SSR compatibility
- Protected routes: All API mutation routes call `checkAuth()` from `lib/amplify-server.ts`
- Sign-up: Disabled (`hideSignUp={true}` in `<Authenticator>`) — login is Google OAuth only
- Sign-out: Handled by `AuthButton` component; redirects to `window.location.origin`

## Monitoring & Observability

**Error Tracking:** Not detected — no Sentry, Datadog, or similar service integrated

**Logs:** `console.log` / `console.error` / `console.warn` used directly throughout:
- Auth debug logging in `lib/amplify-server.ts` (verbose, logs cookie names and token presence)
- S3 errors in `lib/db.ts`, `lib/s3.ts`
- Cover fetch errors in `lib/covers.ts`
- Upload processing errors in `app/api/upload/route.ts`

**Analytics:** Not detected

## CI/CD & Deployment

**Primary Hosting:** AWS Amplify Hosting
- Build spec: `amplify.yml`
- Build command: `npm ci --legacy-peer-deps && npm run build`
- Env vars injected into `.env.production` during build phase (all 6 required vars)
- Artifact: `.next/` directory

**Secondary Hosting:** Netlify
- Config: `netlify.toml`
- Plugin: `@netlify/plugin-nextjs` (not listed in `package.json` — expected as Netlify-managed)
- Build: `npm run build`, publish dir `.next`

**CI Pipeline:** Not detected (no GitHub Actions, CircleCI, etc.)

## Webhooks & Callbacks

**Incoming:** None detected

**Outgoing:** None detected — the image proxy (`/api/image-proxy`) fetches external URLs on demand but is not a webhook

## Environment Configuration Summary

All configuration is via environment variables. No `.env.example` is committed. Required variables inferred from `amplify.yml` and source code:

| Variable | Where Used | Notes |
|----------|-----------|-------|
| `NEXT_PUBLIC_USER_POOL_ID` | `components/AuthProvider.tsx`, `lib/amplify-server.ts` | Public (browser-exposed) |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | `components/AuthProvider.tsx`, `lib/amplify-server.ts` | Public (browser-exposed) |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | `components/AuthProvider.tsx` | Public (browser-exposed) |
| `S3_REGION` | `lib/s3.ts`, `app/api/upload/route.ts` | Server-only |
| `S3_ACCESS_KEY_ID` | `lib/s3.ts` | Server-only secret |
| `S3_SECRET_ACCESS_KEY` | `lib/s3.ts` | Server-only secret |
| `S3_BUCKET_NAME` | `lib/s3.ts` | Server-only |

---

*Integration audit: 2026-04-13*
