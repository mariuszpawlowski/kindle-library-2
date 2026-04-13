# Architecture Research — A–Z Navigation

**Project:** Kindle Library — Navigation Improvement
**Researched:** 2026-04-14
**Confidence:** HIGH (based on direct codebase analysis)

---

## Component Structure

### Recommended: Extract `AlphabetBar.tsx` as a standalone component

**Verdict:** New file `components/AlphabetBar.tsx` — do not inline in `page.tsx`.

**Rationale:**
- `page.tsx` is already 100 lines doing fetch, sort, filter, and render. Adding 50+ lines of letter-bar rendering + active-letter logic would make it hard to scan.
- `SearchBar.tsx` (25 lines) sets the precedent: controlled inputs that receive state and callbacks from the page are extracted as their own components.
- The bar has non-trivial rendering logic (disabled letters, active highlight, responsive wrapping) that belongs in its own file.
- No shared state needed with any sibling component — it communicates purely via props.

**Component signature:**

```typescript
// components/AlphabetBar.tsx
interface AlphabetBarProps {
  letters: string[];          // active letters (have matching books in current view)
  activeLetter?: string;      // letter currently in viewport (optional, for future IntersectionObserver use)
  sortMode: 'author' | 'title'; // drives label, not behaviour — bar just displays
  onLetterClick: (letter: string) => void;
}
```

`letters` contains only the letters that have at least one book in `filteredBooks`. The full A–Z alphabet is rendered inside the component, with letters absent from `letters` shown as disabled. This keeps the interface clean: the parent computes the available set, the component decides how to render enabled vs disabled.

**Sort-mode toggle:** inline in `page.tsx` as a small `<button>` or `<div>` with two options — no need to extract. It is a single two-state control with no rendering complexity. Follow the same pattern as the History link in the existing header.

---

## State Design

### What lives in `page.tsx` (all of it — no lifting needed)

```typescript
// New state — add to existing useState block
const [sortMode, setSortMode] = useState<'author' | 'title'>('author');
```

`sortMode` is purely local to the home page. Nothing outside `page.tsx` cares about it — the book detail page, history page, and upload flow are unaffected. No Context, no URL param, no localStorage needed (PROJECT.md explicitly rules out persisting sort preference).

**Current state shape (existing):**
```
books: Book[]          — full fetched list, sorted once after fetch
searchTerm: string     — controlled search input
loading: boolean       — fetch guard
```

**New state shape (after milestone):**
```
books: Book[]          — full fetched list, re-sorted on sortMode change
sortMode: 'author' | 'title'   — NEW: drives sort and letter extraction
searchTerm: string     — unchanged
loading: boolean       — unchanged
```

### How sort re-applies

The existing sort runs inside `fetchBooks` and is baked into `books` state. With `sortMode`, sorting must move to a derived step that re-runs when either `books` (raw data) or `sortMode` changes.

**Cleanest approach — sort as a derived value, not state:**

```typescript
// Replace inline sort-after-fetch with a useMemo
const getSurname = (name: string) => {
  const parts = name.trim().split(' ');
  return parts[parts.length - 1].toLowerCase();
};

// fetchBooks stores raw data (no sort):
setBooks(data); // raw from API

// sortedBooks is derived:
const sortedBooks = useMemo(() => {
  return [...books].sort((a, b) => {
    const keyA = sortMode === 'author' ? getSurname(a.author) : a.title.toLowerCase();
    const keyB = sortMode === 'author' ? getSurname(b.author) : b.title.toLowerCase();
    return keyA.localeCompare(keyB);
  });
}, [books, sortMode]);

// filteredBooks derives from sortedBooks (unchanged logic):
const filteredBooks = sortedBooks.filter(book =>
  book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  book.author.toLowerCase().includes(searchTerm.toLowerCase())
);
```

This is a direct, minimal change: `books` becomes raw storage, `sortedBooks` replaces the mutated array, `filteredBooks` derives from `sortedBooks` exactly as before.

### Available letters derivation

```typescript
const availableLetters = useMemo(() => {
  const initials = filteredBooks.map(book => {
    const key = sortMode === 'author' ? getSurname(book.author) : book.title;
    return key[0]?.toUpperCase() ?? '#';
  });
  return [...new Set(initials)].sort();
}, [filteredBooks, sortMode]);
```

Derives from `filteredBooks` (not `sortedBooks`) so the bar respects active search — a letter turns gray when the search filter hides all books under it.

---

## Scroll Anchor Pattern

### Recommended: `data-letter` attribute on a wrapper `<div>` + `querySelector` + `scrollIntoView`

**Verdict:** Data attributes + `querySelector`. Do not use refs arrays.

**Why not refs arrays:**
- Requires `useRef<HTMLDivElement[]>([])` + index-based assignment in the render loop.
- Refs arrays are fragile when the list changes length (sort mode change, search change) — stale indices cause scrolling to wrong elements.
- React 19 does not change this; the problem is inherent to index-based ref management.

**Why not callback refs on BookCard:**
- `BookCard` is a `<Link>` wrapper — passing a `ref` to it requires `forwardRef` or the React 19 ref-as-prop pattern, which means modifying `BookCard.tsx`.
- `BookCard` shouldn't know about its role as a scroll target; that's the page's concern.

**Why not IntersectionObserver for click-to-scroll:**
- IntersectionObserver is the right tool for *detecting* what's visible (active letter highlighting during scroll). It is not the right tool for *triggering* scroll. Use it only if active-letter tracking is in scope.

**Recommended approach — wrapper div with data attribute:**

Wrap the `filteredBooks.map(...)` render so that the *first* book for each letter gets a `data-letter="A"` attribute on a containing `<div>`. The `BookCard` itself is untouched.

```tsx
// In page.tsx render, replace the flat .map() with a letter-grouped render:
{filteredBooks.map((book, index) => {
  const key = sortMode === 'author' ? getSurname(book.author) : book.title;
  const initial = key[0]?.toUpperCase() ?? '#';
  const prevKey = index > 0
    ? (sortMode === 'author' ? getSurname(filteredBooks[index - 1].author) : filteredBooks[index - 1].title)[0]?.toUpperCase()
    : null;
  const isFirstInGroup = initial !== prevKey;

  return (
    <div key={book.id} {...(isFirstInGroup ? { 'data-letter': initial } : {})}>
      <BookCard book={book} />
    </div>
  );
})}
```

**Scroll handler in `page.tsx`:**

```typescript
const handleLetterClick = (letter: string) => {
  const target = document.querySelector(`[data-letter="${letter}"]`);
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
```

**Why this works with Framer Motion:**
- The `motion.div` grid wrapper animates opacity/y on mount — a one-time transition on `initial → animate`. `scrollIntoView` runs on user click, after the animation has already settled. No conflict.
- The `data-letter` attributes live on child `<div>`s inside the grid, not on the `motion.div` itself — no interaction with Framer's internal DOM management.

**Why this works with the grid layout:**
- The wrapper `<div>` around each `BookCard` is a grid child. CSS Grid does not care about arbitrary `<div>` wrappers inside it — each wrapper becomes a grid item exactly as the bare `<BookCard>` did before.
- The wrapper has no classes of its own (no `display: contents` needed, no style props) — it is invisible to layout. Grid gap, column count, and responsive breakpoints are unaffected.
- **Important:** Do not use `display: contents` on the wrapper. While it would make the wrapper invisible to grid, it removes the element from the accessibility tree and from `querySelector` results in some browser implementations. A plain unstyled `<div>` is simpler and reliable.

---

## Data Flow

```
sortMode (state)
  │
  ├─► sortedBooks (useMemo) ─► filteredBooks (useMemo/derived)
  │                                  │
  │                                  ├─► availableLetters (useMemo)
  │                                  │        │
  │                                  │        └─► <AlphabetBar letters={availableLetters}
  │                                  │                         sortMode={sortMode}
  │                                  │                         onLetterClick={handleLetterClick} />
  │                                  │
  │                                  └─► grid render (filteredBooks.map)
  │                                           └─► <div data-letter="X"> (first per letter)
  │                                                 └─► <BookCard />
  │
  └─► sort toggle button (reads sortMode, calls setSortMode)
```

**On sort mode change:**
1. `setSortMode('title')` fires
2. `sortedBooks` recomputes (useMemo dependency changed)
3. `filteredBooks` recomputes (depends on sortedBooks)
4. `availableLetters` recomputes (depends on filteredBooks + sortMode)
5. Grid re-renders with new order and new `data-letter` assignments
6. `AlphabetBar` re-renders with new `letters` prop

All steps are synchronous derived computations — no extra effects needed.

**On search term change:**
- Only steps 3–6 fire (`sortedBooks` unchanged). The letter bar automatically grays out letters with no visible books. Correct behavior with no extra logic.

**On letter click:**
- `handleLetterClick` reads current DOM via `querySelector` — always reflects the current rendered state. No stale closure risk.

---

## Integration with Existing Code

### Changes to `app/page.tsx`

| Location | Change | Lines affected |
|----------|--------|----------------|
| State block | Add `sortMode` state | +1 line |
| `fetchBooks` | Remove inline `.sort()` call; store raw data | ~6 lines removed |
| After state block | Add `getSurname` helper (extracted from fetchBooks) | +4 lines |
| After state block | Add `sortedBooks` useMemo | +8 lines |
| `filteredBooks` | Change source from `books` to `sortedBooks` | 1 line changed |
| After state block | Add `availableLetters` useMemo | +6 lines |
| After state block | Add `handleLetterClick` function | +4 lines |
| JSX — after SearchBar | Add sort toggle button | +8 lines |
| JSX — after sort toggle | Add `<AlphabetBar>` | +6 lines |
| JSX — filteredBooks.map | Wrap `<BookCard>` in `<div data-letter>` | ~5 lines changed |
| Imports | Add `useMemo`; add `AlphabetBar` import | +2 lines |

**Net change to page.tsx:** ~+30 lines. File grows from 100 → ~130 lines. Stays readable.

### What stays the same in `app/page.tsx`

- `books` state declaration and `fetchBooks` async function (minus the sort)
- `loading` state and loading spinner JSX
- `searchTerm` state and `SearchBar` component usage
- `filteredBooks` filter logic (just changes source from `books` to `sortedBooks`)
- The `motion.div` grid wrapper and all its animation props
- The empty-state "No books found" block
- The footer `UploadButton`
- Header (History link, AuthButton)

### Changes to `components/BookCard.tsx`

**None.** BookCard is wrapped externally; it does not receive or expose refs. Its `<Link>` wrapper, hover animations, and rendering are completely unchanged.

### New file: `components/AlphabetBar.tsx`

Standalone, `'use client'`, no new dependencies (Tailwind only). Renders 26 letters A–Z. Letters not in `letters` prop render as `opacity-40 cursor-not-allowed pointer-events-none`. Active letter (if provided) renders with a filled background. Uses `<button>` elements for accessibility — keyboard navigable, screenreader-friendly.

Approximately 50–60 lines.

---

## Confidence Assessment

| Decision | Confidence | Basis |
|----------|------------|-------|
| Extract AlphabetBar as component | HIGH | Matches SearchBar precedent in codebase; clear boundary |
| sortMode state local to page.tsx | HIGH | PROJECT.md explicitly rules out persistence; no sibling needs it |
| Move sort to useMemo (not fetchBooks) | HIGH | Only correct approach when sort key changes at runtime |
| data attributes + querySelector | HIGH | PROJECT.md Key Decisions already points this direction; confirmed safe with grid |
| Wrapper div (not display:contents) | HIGH | querySelector + accessibility safety |
| No BookCard changes | HIGH | Confirmed by reading BookCard — no ref forwarding needed |
| No lifting state above page.tsx | HIGH | No other page or component consumes sort mode |
