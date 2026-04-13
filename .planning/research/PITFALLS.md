# Domain Pitfalls: A–Z Jump Bar + Sort-Mode Toggle

**Domain:** React alphabet navigation / scroll-to-section UI
**Project:** Kindle Library — Navigation Improvement
**Researched:** 2026-04-14
**Confidence:** HIGH (all findings grounded in the actual codebase + well-established React patterns)

---

## Critical Pitfalls

Mistakes that cause silent failures, broken scroll, or layout-breaking UX.

---

### Pitfall 1: Framer-Motion Animation Race — scrollIntoView Targets Wrong Position

**What goes wrong:**
`app/page.tsx` wraps the entire book grid in a `motion.div` with `initial={{ opacity: 0, y: 20 }}` and a 500 ms transition. During those 500 ms the grid is translating downward by up to 20 px and may not have reached its final painted position. If a user clicks a letter before `t = 500 ms` elapses, `scrollIntoView()` uses the element's layout position *before* the transform settles, placing the viewport 10–20 px short of the intended target.

**Why it happens:**
`scrollIntoView()` reads `getBoundingClientRect()` at call time. CSS transforms applied by framer-motion affect the visual position but not the layout box in the same way — and during the animation the page layout itself may still be settling (the `y: 20 → 0` translate changes the painted position that the browser then has to account for). In practice the first-mount animation is the risky window; subsequent letter clicks (after the grid has loaded and settled) are fine.

**Consequences:**
Scroll lands slightly above the correct card. On a grid with 5 columns the error is tolerable; on a tall library (50+ books) the user still has to scroll a few pixels. More critically, if the animation runs _every_ time `filteredBooks` changes (e.g., search clears while an A–Z letter is active), the problem recurs on every filter change.

**Prevention:**
1. Attach scroll logic only after the animation completes. Framer Motion's `motion.div` accepts an `onAnimationComplete` callback — set a `gridReady` boolean in state and disable the A–Z bar (or queue the scroll) until `gridReady === true`.
2. Alternatively, set `initial={false}` on the `motion.div` so the entry animation is skipped entirely after the first mount (use `AnimatePresence` for route transitions instead). This is the simpler option for this codebase.
3. **Do not** put the animation on the wrapper; put it on individual `BookCard` items via staggered children so the grid container's layout position is stable from frame 1.

**Detection warning signs:**
- Scroll consistently lands ~20 px above the target card.
- Works correctly if you click a letter after waiting ~1 second.
- Problem disappears if you add `initial={false}` to the `motion.div`.

**Phase affected:** Phase implementing scroll-to — likely Phase 1 (A–Z bar + scroll logic).

---

### Pitfall 2: A–Z Bar Shows Letters Not Present in Filtered Results

**What goes wrong:**
The A–Z bar computes available letters from `books` (all books) instead of `filteredBooks` (search-filtered subset). A user types "Orwell" in the search box, sees 2 results, then clicks "H" on the A–Z bar — nothing happens or the page jumps to a blank section because "H" had no matching books. The letter button appears active but produces no visible effect.

**Why it happens in this codebase:**
`books` and `filteredBooks` are both in scope in `app/page.tsx`. It's natural to derive available letters from `books` once (cheaper), but the correct source is always `filteredBooks`. The sort-mode toggle compounds this: when sort mode switches to "by title," the relevant first character is `book.title[0]`, not the surname initial — a bar computed for author-mode will silently show wrong letters in title-mode.

**Consequences:**
Clicking a grayed-out-but-somehow-active letter does nothing. Or worse: letters appear enabled but `scrollIntoView` finds no ref anchor because the target book was filtered out.

**Prevention:**
1. Always derive `availableLetters` as:
   ```typescript
   const availableLetters = useMemo(() =>
     new Set(filteredBooks.map(b =>
       sortMode === 'author'
         ? getSurname(b.author)[0]?.toUpperCase()
         : b.title[0]?.toUpperCase()
     ).filter(Boolean)),
   [filteredBooks, sortMode]);
   ```
2. A letter button is "active" (clickable, full opacity) if and only if `availableLetters.has(letter)`.
3. Recompute on every `filteredBooks` change — the `useMemo` dependency array enforces this.

**Detection warning signs:**
- Clicking a letter while a search is active does nothing.
- After clearing search, the same letter works.
- A–Z bar doesn't update when switching sort modes.

**Phase affected:** Phase 1 (A–Z bar) and Phase 2 (sort-mode toggle integration).

---

### Pitfall 3: Ref Staleness — Array of Refs Goes Stale on Re-render

**What goes wrong:**
A common pattern is `const bookRefs = useRef<(HTMLElement | null)[]>([])`. On each render the array is mutated by assigning `ref={el => { bookRefs.current[index] = el }}` for each book. If `filteredBooks` changes (new search term, sort mode switch), the array length and indices shift but the `useRef` container itself is stable — stale refs from the previous render may persist at higher indices if `filteredBooks` shrank. Clicking a letter may target a stale (unmounted) element or the wrong book.

**Why it happens:**
`useRef` persists across renders without triggering re-render. When the list shrinks from 40 → 10 books, `bookRefs.current[11]` through `bookRefs.current[39]` retain their old values — they point to unmounted DOM nodes. `scrollIntoView()` on a detached node silently does nothing in most browsers.

**Prevention:**
1. **Reset on each render** — clear the array before each render by initializing a fresh array each render cycle and assigning to `bookRefs.current`:
   ```typescript
   bookRefs.current = []; // outside JSX, before the return
   ```
   Then assign: `ref={el => { bookRefs.current[index] = el }}`.
   This is the idiomatic React pattern for lists of refs.
2. **Use a Map keyed by book ID** instead of an index array:
   ```typescript
   const bookRefs = useRef<Map<string, HTMLElement>>(new Map());
   // In JSX:
   ref={el => el ? bookRefs.current.set(book.id, el) : bookRefs.current.delete(book.id)}
   ```
   This is more robust: when a book unmounts its ref is deleted; lookup is `O(1)` by ID. The A–Z bar looks up by first-initial, so build a secondary `Map<string, string>` of `letter → first-matching-book-id` from `filteredBooks` at render time.
3. Never capture `bookRefs.current` in a `useEffect` dependency array — read it imperatively at call time in event handlers.

**Detection warning signs:**
- Scroll works for the first letter clicked but breaks after typing in the search box.
- `bookRefs.current.length` doesn't match `filteredBooks.length` in DevTools.
- `console.log(bookRefs.current[n])` returns a detached `HTMLElement`.

**Phase affected:** Phase 1 (ref setup and scroll-to implementation).

---

### Pitfall 4: React 19 / Next.js 16 Strict Mode Double-Invoke Corrupts Ref Arrays

**What goes wrong:**
In development, React 19 Strict Mode double-invokes the render function of every Client Component. For the ref-callback pattern (`ref={el => { arr[index] = el }}`), this means the callback fires twice: once with the real element, once with `null`, and once with the element again (mount → unmount → remount). An unguarded mutation like `bookRefs.current[index] = el` will:
1. Set the ref to the element ✓
2. Set it to `null` (the cleanup call)
3. Set it back to the element ✓

For a simple array this is usually fine (ends on the element). But if the ref callback also performs side effects (registering an observer, appending to a list), those effects run twice. More specifically: if the ref-cleanup branch **deletes** from a Map (`bookRefs.current.delete(book.id)`), Strict Mode's remount will delete and then re-add — which is correct — but only if the ref callback explicitly handles `el === null`.

**Consequences:**
In development only (Strict Mode is disabled in production builds), refs may appear to work but produce console warnings, or an IntersectionObserver used for "active letter detection" fires twice causing a flicker.

**Prevention:**
1. Always handle `el === null` in ref callbacks:
   ```typescript
   ref={el => {
     if (el) {
       bookRefs.current.set(book.id, el);
     } else {
       bookRefs.current.delete(book.id);
     }
   }}
   ```
2. Do not attach observers or side effects directly inside ref callbacks — do that in a `useEffect` that reads from the ref map.
3. Verify behavior in production build (`next build && next start`) if dev behavior seems strange — Strict Mode double-invoke only happens in dev.

**Detection warning signs:**
- Scroll-to works in `next start` (production) but not in `next dev`.
- `bookRefs.current.size` is 0 after mount in dev, correct in prod.
- Console shows "Cannot read properties of null" in dev only.

**Phase affected:** Phase 1 (ref setup). Low severity — only manifests in development.

---

## Moderate Pitfalls

---

### Pitfall 5: Surname Sorting vs. A–Z Bar Initial Mismatch — "Van Morrison" Problem

**What goes wrong:**
The existing `getSurname()` helper in `app/page.tsx` extracts the last word of the author string:
```typescript
const getSurname = (name: string) => {
  const parts = name.trim().split(' ');
  return parts[parts.length - 1].toLowerCase();
};
```
"Van Morrison" → surname `"morrison"` → sorted under **M**.
"J.R.R. Tolkien" → surname `"tolkien"` → sorted under **T**.
"Ursula K. Le Guin" → surname `"guin"` → sorted under **G**.

These are correct for surname-sorted display. The A–Z bar **must use the same `getSurname()` extraction** to derive the letter it assigns each book. If the bar computes `book.author[0]` instead, "Van Morrison" appears under **V** in the bar but under **M** in the grid — clicking **V** finds no books, clicking **M** skips Morrison entirely.

**Prevention:**
1. Extract `getSurname()` to a shared utility (e.g., `lib/utils.ts`) and import it in both `page.tsx` and the new `AlphabetBar` component.
2. In author-sort mode, the bar letter for a book is always `getSurname(book.author)[0].toUpperCase()`.
3. In title-sort mode, the bar letter is `book.title[0].toUpperCase()` (titles starting with "The ", "A ", "An " — should these be normalized? Out of scope per PROJECT.md, but note the risk: "The Hobbit" would sort under **T**. Acceptable for a personal library at this scale.)
4. Write a unit test: `getSurname("Van Morrison") === "morrison"`, first letter `"M"`.

**Detection warning signs:**
- Clicking a letter in the bar scrolls to the wrong book.
- A letter is shown as active but the first visible book under it has a different surname initial.
- "Van", "De", "Le", "Von" prefix names consistently land on the wrong letter.

**Phase affected:** Phase 1 (bar letter derivation) and Phase 2 (sort-mode toggle — must switch extraction method).

---

### Pitfall 6: Mobile UX — 26 Buttons in a Horizontal Row Overflow on Small Screens

**What goes wrong:**
A naive `flex-row` layout with one `<button>` per letter renders fine on desktop but overflows or wraps awkwardly on 375 px wide mobile screens. With default Tailwind `text-sm` and `px-2 py-1` padding, 26 buttons × ~28 px = ~728 px minimum width. On a 375 px screen this causes horizontal overflow, cut-off letters, or forced wrapping into 2+ rows that breaks the visual rhythm.

**Prevention options (pick one):**
1. **Flex wrap + justify-center** — allow the bar to wrap onto 2 rows. Simple, no JS. Acceptable for a personal-use app. Use `gap-1` to keep rows compact:
   ```tsx
   <nav className="flex flex-wrap justify-center gap-1">
   ```
2. **Compact letters on mobile** — use responsive font/padding:
   ```tsx
   <button className="text-xs sm:text-sm px-1 sm:px-2 py-1">
   ```
   At `text-xs` + `px-1`, 26 buttons ≈ 390 px — borderline on 375 px. Still risky.
3. **Vertical sidebar on mobile** — `flex-col` positioned as a fixed sidebar (right edge). Common pattern in iOS contacts apps. Significantly increases complexity; over-engineered for this use case.
4. **Recommended:** Flex-wrap with `justify-center gap-1` (option 1) + `text-xs sm:text-sm` (option 2 scaling). This fits 26 letters in approximately 1.5 rows on 375 px with room to breathe. No JavaScript required.

**Detection warning signs:**
- Chrome DevTools mobile emulator (iPhone SE 375 px) shows horizontal scrollbar on the bar container.
- `overflow-hidden` on parent hides letters beyond viewport edge.
- Letters at the end of the alphabet (X, Y, Z) are clipped.

**Phase affected:** Phase 1 (AlphabetBar component styling). Address during initial component build, not after.

---

### Pitfall 7: Missing ARIA Attributes on Alphabet Navigation Bar

**What goes wrong:**
An A–Z bar rendered as `<div>` with `<button>` children is visually intuitive but exposes no semantic structure to assistive technologies. Screen reader users hear 26 unlabeled buttons with single-letter labels like "A", "B" … "Z" — no context that this is navigation, no indication of which letter is "active" (has matching books in the current view), and no announcement when clicking a letter causes a scroll.

**Required ARIA attributes:**
| Element | Required attributes | Rationale |
|---------|---------------------|-----------|
| Bar container | `role="navigation"` + `aria-label="Jump to books by letter"` | Identifies as a landmark; screen readers list landmarks. `<nav>` element preferred over `role="navigation"` on a `<div>`. |
| Active letter button | `aria-current="true"` or `aria-pressed="true"` | Communicates which letter is currently selected / focused. |
| Disabled letter button | `disabled` attribute (not just `cursor-not-allowed` Tailwind class) | Native `disabled` prevents keyboard focus and is announced by all screen readers. Visual-only disabling (opacity, pointer-events) is invisible to AT. |
| Jump target anchor | `tabIndex={-1}` on the first `BookCard` of each letter group | Allows programmatic focus after scroll without adding it to the tab order. |

**Prevention:**
```tsx
<nav aria-label="Jump to books by letter">
  {ALPHABET.map(letter => (
    <button
      key={letter}
      disabled={!availableLetters.has(letter)}
      aria-current={activeLetter === letter ? true : undefined}
      onClick={() => handleLetterClick(letter)}
    >
      {letter}
    </button>
  ))}
</nav>
```
Do **not** use `aria-disabled="true"` as a substitute for `disabled` — `aria-disabled` keeps the element focusable and requires additional keyboard handling.

**Detection warning signs:**
- Running `axe` (browser extension) on the page reports "Interactive controls must not be nested" or "Button does not have accessible text" (if letters are rendered as icons).
- VoiceOver / NVDA reads the bar as a series of unlabeled buttons with no group label.
- Keyboard-only navigation lands on disabled letters (should be skipped).

**Phase affected:** Phase 1 (AlphabetBar component). Non-negotiable for any public-facing feature; good practice for personal use too.

---

### Pitfall 8: Sort-Mode State Not Resetting Active Letter

**What goes wrong:**
User sorts by author, clicks letter "M" (activeLetter = "M"). User then switches sort mode to "by title". The `activeLetter` state still holds "M" but the grid is now sorted by title — books starting with "M" in author-mode are no longer at the "M" position in title-mode. The highlighted "M" button is now meaningless or actively misleading.

**Prevention:**
Reset `activeLetter` to `null` whenever `sortMode` changes:
```typescript
const [sortMode, setSortMode] = useState<'author' | 'title'>('author');
const [activeLetter, setActiveLetter] = useState<string | null>(null);

const handleSortModeChange = (mode: 'author' | 'title') => {
  setSortMode(mode);
  setActiveLetter(null); // clear active letter on mode switch
};
```
Similarly reset `activeLetter` when `searchTerm` changes (the filtered set is different).

**Detection warning signs:**
- Switching sort mode leaves a letter highlighted in the bar that doesn't correspond to any visible scroll position.
- After switching mode and clicking a different letter, the old "active" letter still appears highlighted.

**Phase affected:** Phase 2 (sort-mode toggle integration).

---

## Minor Pitfalls

---

### Pitfall 9: scrollIntoView Block Alignment Hides Book Under Sticky Bar

**What goes wrong:**
`element.scrollIntoView({ behavior: 'smooth', block: 'start' })` scrolls the target element to the very top of the viewport. If the A–Z bar (and search bar above it) are sticky-positioned (`sticky top-0`), the bar overlaps the first book card — the card's top edge sits behind the sticky bar, making it appear the scroll "overshot" or that nothing happened.

**Prevention:**
Use `block: 'nearest'` or add a scroll offset via `scrollIntoView` with a `ScrollIntoViewOptions` + padding trick, or use `element.scrollIntoView({ block: 'start' })` and then `window.scrollBy(0, -offset)` where `offset` = sticky bar height in px:
```typescript
el.scrollIntoView({ behavior: 'smooth', block: 'start' });
// Allow for sticky header height (~120px for search bar + A–Z bar)
setTimeout(() => window.scrollBy({ top: -120, behavior: 'smooth' }), 0);
```
The cleaner approach: use `scroll-margin-top` on the scroll target elements:
```tsx
// In the ref-anchor div rendered per letter group
<div style={{ scrollMarginTop: '120px' }} ref={...} />
```
`scroll-margin-top` is CSS-native, no JS offset calculation needed, and works with `scrollIntoView()` automatically.

**Detection warning signs:**
- The first book card scrolls to the viewport top but is partially hidden behind a sticky bar.
- `block: 'start'` + sticky header = overlap. `block: 'nearest'` avoids this if the element is already partially visible.

**Phase affected:** Phase 1 (scroll-to implementation) — only relevant if the A–Z bar is made sticky. Worth building correctly from the start.

---

### Pitfall 10: `books` Array Sorted Once, Re-Sort Not Triggered on Sort Mode Toggle

**What goes wrong:**
Per PROJECT.md, `books` state is sorted once after fetch (by author surname). When sort mode switches to "by title," the component must produce a newly sorted list. A naive approach mutates `books` state directly via `books.sort(...)` — this works but triggers no re-render because the array reference doesn't change. Or the sort is applied to `filteredBooks` inside the render function on every render, which is correct but recalculates on every keystroke in the search box.

**Prevention:**
1. Keep `books` as the canonical post-fetch list (sorted by the fetch sort — author surname).
2. Derive `sortedBooks` in a `useMemo` keyed on `[books, sortMode]`:
   ```typescript
   const sortedBooks = useMemo(() => {
     const copy = [...books];
     if (sortMode === 'author') {
       copy.sort((a, b) => getSurname(a.author).localeCompare(getSurname(b.author)));
     } else {
       copy.sort((a, b) => a.title.localeCompare(b.title));
     }
     return copy;
   }, [books, sortMode]);
   ```
3. Derive `filteredBooks` from `sortedBooks` (not `books`):
   ```typescript
   const filteredBooks = useMemo(() =>
     sortedBooks.filter(book => /* search logic */),
   [sortedBooks, searchTerm]);
   ```
This preserves the existing architecture (one `books` state) while making sort-mode a clean derived transformation.

**Detection warning signs:**
- Toggling sort mode has no effect on book order.
- Book order changes but `filteredBooks` doesn't update.
- Books re-sort correctly on first toggle but revert on next search input.

**Phase affected:** Phase 2 (sort-mode toggle).

---

## Phase-Specific Warnings Summary

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| A–Z bar component | Mobile overflow (Pitfall 6) | Flex-wrap + `text-xs sm:text-sm` from day 1 |
| A–Z bar component | Missing ARIA (Pitfall 7) | Use `<nav>` element, `disabled` attr, `aria-current` |
| Scroll-to implementation | Framer-motion animation race (Pitfall 1) | `onAnimationComplete` guard or `initial={false}` |
| Scroll-to implementation | Ref staleness (Pitfall 3) | Map keyed by `book.id`; handle `null` in callback |
| Scroll-to implementation | Scroll hidden under sticky bar (Pitfall 9) | `scroll-margin-top` CSS on anchor elements |
| Letter availability logic | Filtered results mismatch (Pitfall 2) | Derive letters from `filteredBooks`, not `books` |
| Letter availability logic | Surname extraction mismatch (Pitfall 5) | Extract `getSurname` to `lib/utils.ts`; share it |
| Sort mode toggle | `activeLetter` not reset (Pitfall 8) | Reset on `sortMode` change and `searchTerm` change |
| Sort mode toggle | Re-sort not triggered (Pitfall 10) | `useMemo([books, sortMode])` for sort; `useMemo([sortedBooks, searchTerm])` for filter |
| Dev/test environment | Strict Mode double-invoke (Pitfall 4) | Null-guard in all ref callbacks |

---

## Sources

- Codebase analysis: `app/page.tsx`, `components/BookCard.tsx`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md` (2026-04-14)
- React documentation on refs: https://react.dev/learn/manipulating-the-dom-with-refs#how-to-manage-a-list-of-refs-using-a-ref-callback
- Framer Motion `onAnimationComplete`: https://www.framer.com/motion/component/
- MDN `scrollIntoView`: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
- MDN `scroll-margin-top`: https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin-top
- ARIA navigation landmark: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html
- ARIA `aria-current`: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current
- React 19 Strict Mode double-invoke: https://react.dev/reference/react/StrictMode
