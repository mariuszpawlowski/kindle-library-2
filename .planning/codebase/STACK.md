# Technology Stack

**Analysis Date:** 2026-04-13

## Languages

**Primary:**
- TypeScript 5.9.3 - All source files (`.ts`, `.tsx`) across `app/`, `components/`, `lib/`

**Secondary:**
- CSS (via Tailwind utility classes) - Styling throughout all components

## Runtime

**Environment:**
- Node.js v22.13.0

**Package Manager:**
- npm 11.10.0
- Lockfile: `package-lock.json` present (lockfileVersion 3)

## Frameworks

**Core:**
- Next.js 16.1.1 - Full-stack React framework; App Router with Server Components and Route Handlers (`app/` directory)
- React 19.2.3 - UI library

**Build/Dev:**
- TypeScript compiler - `tsconfig.json` targets ES2017, strict mode enabled, `moduleResolution: "bundler"`
- PostCSS with `@tailwindcss/postcss` 4.1.17 - CSS processing pipeline (`postcss.config.mjs`)
- Tailwind CSS 4.1.17 - Utility-first CSS framework
- ESLint 9 with `eslint-config-next` 16.1.1 - Linting via `eslint.config.mjs` (Core Web Vitals + TypeScript rules)

**Testing:**
- Not detected — no test framework configured, no test files present

## Key Dependencies

**Critical:**
- `aws-amplify` 6.15.9 - AWS Amplify v6 client for Cognito authentication state management
- `@aws-amplify/adapter-nextjs` 1.6.12 - SSR-compatible Amplify adapter for Next.js server context (`lib/amplify-server.ts`)
- `@aws-amplify/ui-react` 6.13.2 - Pre-built `<Authenticator>` UI component with Google OAuth support (`app/login/page.tsx`, `components/AuthProvider.tsx`)
- `@aws-sdk/client-s3` 3.937.0 - AWS SDK v3 S3 client for all data persistence (`lib/s3.ts`, `lib/db.ts`)

**UI:**
- `framer-motion` 12.23.24 - Declarative animations (used in `app/page.tsx` for book grid transitions)
- `lucide-react` 0.554.0 - SVG icon library (used in `app/page.tsx`, `components/BookCard.tsx`, `components/UploadButton.tsx`)

**Utilities:**
- `uuid` 13.0.0 - UUID v4 generation for `Book`, `Highlight`, and history record IDs (`lib/parser.ts`, `lib/db.ts`)
- `dotenv` 17.2.3 - `.env` loading for standalone migration script (`migrate_to_s3.ts`)

## TypeScript Configuration

**Key settings (`tsconfig.json`):**
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

**Development:**
- Node.js v22+
- `.env.local` with S3 and Cognito credentials (see INTEGRATIONS.md)

**Production:**
- Deployed to **AWS Amplify Hosting** (primary — `amplify.yml` present with full build spec)
- **Netlify** also supported via `netlify.toml` with `@netlify/plugin-nextjs` plugin
- Build output: `.next/` directory (Next.js standard output)

---

*Stack analysis: 2026-04-13*
