# Research Summary — A–Z Navigation Bar

**Project:** Kindle Library — Navigation Improvement
**Synthesized:** 2026-04-14

---

## Recommended Approach

Build a custom `AlphabetBar.tsx` component (~50–60 lines) that renders all 26 letters with inactive ones grayed out, housed in a sticky bar above the book grid alongside a two-state sort toggle ("Author" / "Title"). Use `data-letter` attributes on wrapper `<div>`s around `BookCard` for scroll anchors, driven by `element.scrollIntoView({ behavior: 'smooth' })` — no third-party library needed or available. All sorting and letter-availability logic lives in `useMemo` chains in `page.tsx`; no state needs to leave the page.

---

## Stack Decisions

- **No library — build from scratch** — Every npm alphabet-nav package is abandoned or has <300 weekly downloads; the component is ~50 lines of TSX
- **`data-letter` attributes + `querySelector`** — Survives filter and sort changes without ref synchronisation; avoids modifying `BookCard`
- **`scrollIntoView({ behavior: 'smooth', block: 'start' })`** — 97% browser support (Chrome 61+, Firefox 36+, Safari 16+); no polyfill needed
- **`scroll-mt-{n}` (CSS `scroll-margin-top`) on anchor wrappers** — Compensates for sticky bar height; pure CSS, no JS offset math
- **Framer Motion: no changes; add 500ms `ready` guard** — Existing `motion.div` entry animation is a one-shot; race condition is real but easy to guard via `onAnimationComplete` or `initial={false}`
- **Tailwind v4: full literal strings only** — Dynamic class construction (template literals) is purged at build time; use ternary with complete class strings

---

## Feature Scope (v1)

### In

| Feature | Notes |
|---------|-------|
| All 26 letters always rendered | Inactive = `opacity-30 cursor-not-allowed disabled` |
| Inactive letters visually distinguished | Grayed, non-interactive — universal convention (iOS Contacts, Apple Music) |
| Click active letter → smooth scroll to first matching book | Core purpose |
| Sort toggle: "Author" / "Title" segmented control | Two-state pill; co-located in sticky bar left of letters |
| Bar updates on sort-mode change | `availableLetters` derived from `filteredBooks` + `sortMode` |
| Bar works correctly when search filter is active | Derives from `filteredBooks`, not `books` |
| Sticky bar (position: sticky) | `sticky top-0 z-10 bg-background`; one band for toggle + letters |
| Keyboard accessible | `<nav>` element, `<button>` per letter, `aria-label`, `disabled` attribute |
| `#` bucket for null/unknown authors | Authors with empty/null/`"Unknown"` surname → `#` slot |

### Out (v1 → defer)

| Feature | Reason |
|---------|--------|
| Bidirectional scroll sync (active letter tracks scroll) | Med–High complexity; not a baseline expectation; Phase 2 candidate |
| Grouped section headers in the grid | Conflicts with tile-grid layout; adds noise |
| URL hash routing per letter | Breaks "no new routes" constraint; Next.js App Router + Framer Motion conflict |
| Keyboard letter press jumps to section | Conflicts with existing search-by-typing behavior |
| Persist sort preference across sessions | Explicitly out of scope in PROJECT.md |
| Animated sort transition (grid crossfade) | Low priority; Framer Motion `layout` on grid risks scale distortion |
| Count badge / hover tooltip per letter | Zero value at personal-library scale |

---

## Architecture Notes

### Component Structure

```
app/page.tsx
├── state: books, sortMode (NEW), searchTerm, loading
├── useMemo: sortedBooks  ← [books, sortMode]
├── useMemo: filteredBooks ← [sortedBooks, searchTerm]
├── useMemo: availableLetters ← [filteredBooks, sortMode]
├── handler: handleLetterClick → querySelector + scrollIntoView
├── <AlphabetBar letters={availableLetters} sortMode={sortMode} onLetterClick={handleLetterClick} />
├── Sort toggle (inline — no extraction needed, 2-state only)
└── grid: filteredBooks.map → <div data-letter="X"> → <BookCard />
                                     ↑ first per letter only
components/AlphabetBar.tsx   ← NEW, ~50–60 lines, 'use client', Tailwind only
lib/utils.ts (or inline)     ← getSurname() extracted and shared
```

### State Design

- `sortMode: 'author' | 'title'` — local to `page.tsx`; no context/URL/localStorage needed
- `books` — stores raw API data (remove inline sort from `fetchBooks`)
- `sortedBooks` — `useMemo([books, sortMode])` — replaces the one-time sort
- `filteredBooks` — `useMemo([sortedBooks, searchTerm])` — source unchanged, input swapped
- `availableLetters` — `Set<string>` from `filteredBooks` using `getSurname()` in author mode, `title[0]` in title mode

### Key Integration Points

- **`BookCard.tsx`**: zero changes — wrap externally in `<div data-letter>`, no ref forwarding
- **`page.tsx`**: net +~30 lines (100 → ~130 lines); all existing state/logic/JSX preserved
- **`AlphabetBar.tsx`**: new file; receives all needed data via props; no internal state except optional `activeLetter` for future bidirectional sync

### `getSurname()` — Critical Shared Dependency

Must be extracted to `lib/utils.ts` (or inlined identically) so the sort order and the bar letter derivation use exactly the same logic. Mismatch causes silent wrong-letter scroll targets.

---

## Critical Pitfalls to Avoid

### 1. Framer Motion Animation Race (Critical)
**Risk:** `scrollIntoView` called during the 500ms `y: 20 → 0` entry animation lands 10–20px short.
**Prevention:** Add `gridReady` state set in `onAnimationComplete` callback, or set `initial={false}` on the `motion.div` after first mount. Do not allow letter clicks until the grid has settled.

### 2. `availableLetters` Derived from Wrong Source (Critical)
**Risk:** Computing active letters from `books` instead of `filteredBooks` causes active-looking letters that scroll to nothing when search is active.
**Prevention:** Always `useMemo(() => ..., [filteredBooks, sortMode])`. Letter is active iff `filteredBooks` contains a book whose key starts with that letter.

### 3. `getSurname()` Not Shared — Sort/Bar Mismatch (Critical)
**Risk:** Bar shows "V" as active for "Van Morrison" but grid places him under "M". Clicking "V" finds no books.
**Prevention:** Extract `getSurname()` to `lib/utils.ts`. Import in both `page.tsx` and `AlphabetBar.tsx`. In author mode: `getSurname(book.author)[0].toUpperCase()` everywhere.

### 4. `scroll-margin-top` Missing on Anchor Wrappers (Moderate)
**Risk:** `scrollIntoView({ block: 'start' })` scrolls the target behind the sticky A–Z bar, appearing as if nothing happened.
**Prevention:** Add `className="scroll-mt-16"` (adjust to actual bar height) to each `<div data-letter>` wrapper. `scroll-margin-top` is CSS-native and interacts with `scrollIntoView` automatically.

### 5. Tailwind v4 Dynamic Class Purge (Moderate)
**Risk:** `className={`opacity-${isActive ? '100' : '30'}`}` silently produces unstyled buttons in production.
**Prevention:** Use ternary with complete literal class strings: `className={isActive ? 'opacity-100 ...' : 'opacity-30 cursor-not-allowed'}`. No template literals for class names.

### Bonus: ARIA / Accessibility (Non-negotiable)
**Risk:** 26 unlabeled single-letter `<button>` elements inside a `<div>` fail WCAG and screen readers.
**Prevention:** Use `<nav aria-label="Jump to books by letter">`, native `disabled` attribute (not CSS-only), and `aria-current="true"` on the active letter.

---

## Confidence

**Overall: HIGH**

| Area | Confidence | Basis |
|------|------------|-------|
| Stack (no library, data-attr scroll) | HIGH | npm checked directly; PROJECT.md pre-aligned; MDN/caniuse verified |
| Features (scope, conventions) | HIGH | iOS Contacts, Goodreads, Kindle, Apple Music surveyed directly |
| Architecture (state, components) | HIGH | Based on direct codebase reading; all file changes enumerated |
| Pitfalls | HIGH | Grounded in actual `page.tsx` code + well-documented React/Tailwind/Framer patterns |
| 500ms race condition guard (exact approach) | MEDIUM | Derived from animation duration; needs verification in running app |
| IntersectionObserver + Framer Motion interaction | MEDIUM | Known pattern; untested in this specific setup |

**Gaps for implementation:**
- Actual rendered height of the sticky bar (needed to set correct `scroll-mt-{n}` value)
- Whether `initial={false}` or `onAnimationComplete` guard feels better UX in context
- `"#"` bucket: confirm whether any books in the actual library have null/unknown authors before building it

---

## Sources

- codebase: `app/page.tsx`, `components/BookCard.tsx`, `components/SearchBar.tsx` (direct inspection)
- npm registry: `react-alphabet-list`, `react-native-section-alphabet-list` (checked April 2026)
- MDN: `Element.scrollIntoView()`, `scroll-margin-top`, ARIA `aria-current`
- caniuse.com: `scrollIntoView` (97.02% global, April 2026)
- Tailwind v4 docs: detecting classes in source files
- Framer Motion docs: `onAnimationComplete`, GitHub issue #1593
- Reference apps: iOS Contacts, Apple Music/iTunes, Goodreads My Books, Amazon Kindle app, Apple Books, library catalogs (Koha, Ex Libris Primo)
- WCAG 2.1 AA; W3C ARIA Authoring Practices Guide
