# Stack Research — A–Z Navigation

**Project:** Kindle Library — A–Z Jump Bar + Sort Toggle
**Researched:** 2026-04-14
**Scope:** Implementation approach for alphabet jump bar with scroll-to in React 19 / Next.js App Router

---

## Recommendation

**Build from scratch. No library is worth the dependency.**

The entire A–Z bar is ~50 lines of TSX: 26 letter buttons, a `useMemo` to derive active letters from `filteredBooks`, and one `useCallback` for the scroll handler. Every third-party alphabet-nav package on npm is either abandoned, has trivial weekly downloads, or ships with its own rendering opinions that fight Tailwind v4 and the existing `motion.div` grid. The custom approach is also exactly what `PROJECT.md` already anticipates (`data attributes + querySelector`).

---

## Library Options

| Library | Weekly Downloads | Last Published | React 19 Support | Verdict |
|---------|-----------------|----------------|-----------------|---------|
| `react-alphabet-list` | **252 / week** | Sep 2023 (v0.2.0) | No (peer dep `react: "*"` but built with Babel 6 targeting ES2015 — no TypeScript types in package) | ❌ Dead. 252 downloads/week is noise-level. Last commit touches only Prettier config. |
| `react-native-section-alphabet-list` | N/A | Nov 2022 | React Native only | ❌ Wrong platform |
| `react-az-nav`, `react-alpha-nav`, `react-alphabetic-index`, `react-scrollable-index` | 0 | Not published | — | ❌ Do not exist on npm |

**Conclusion:** There is no well-maintained, React-web alphabet-nav library with meaningful adoption. The space simply isn't served — this UI pattern is always built in-house.

---

## Scroll-to Approach

**Recommendation: `data-letter` attributes on the first matching card + `querySelector` in the click handler.**

This is the approach already noted in `PROJECT.md` Key Decisions. It is superior to `useRef` arrays for this use case because:
- Refs require stable array indices that break when `filteredBooks` changes (e.g., when search is active)
- `data-letter` attributes are attached to the first card per letter automatically during render, not by array index
- Works correctly when sort mode changes (author vs. title) — no ref synchronisation needed

### Pattern

**In the grid render (inside `filteredBooks.map`):**
```tsx
// Track which letters have already had their anchor rendered
const seenLetters = new Set<string>();

{filteredBooks.map((book) => {
  const key = sortMode === 'author'
    ? getSurname(book.author)[0].toUpperCase()
    : book.title[0].toUpperCase();
  const isFirstForLetter = !seenLetters.has(key);
  if (isFirstForLetter) seenLetters.add(key);

  return (
    <div
      key={book.id}
      data-letter={isFirstForLetter ? key : undefined}
      className="scroll-mt-24"  {/* accounts for sticky jump bar height */}
    >
      <BookCard book={book} />
    </div>
  );
})}
```

**In the `AlphaBar` click handler:**
```tsx
const handleLetterClick = (letter: string) => {
  const target = document.querySelector<HTMLElement>(`[data-letter="${letter}"]`);
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
```

**Note:** Wrap each `BookCard` in a plain `<div>` anchor rather than modifying `BookCard` itself. This keeps the component boundary clean and avoids prop drilling.

### Why not `useRef` arrays?

```tsx
// Problematic — array indices desync when filteredBooks changes
const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
// ...
cardRefs.current[index] = el; // which index? shifts on every filter change
```

`data-letter` + `querySelector` survives filter changes, sort toggling, and React re-renders with no special cleanup.

### Alternative considered: CSS scroll anchors (`id` attributes)

Avoided because `PROJECT.md` explicitly notes that `BookCard` renders as a `<Link>` with no `id`, and adding `id` attributes risks conflicts with existing DOM. `data-letter` is cleaner.

---

## Framer Motion Compatibility

**No known conflict, but one timing caveat to handle.**

### Current animation in `page.tsx`

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="grid ..."
>
```

This is a **one-shot entry animation** (`initial` → `animate`), not a continuous layout animation (`layout` prop). It does **not** use `layoutId` or `layout`. The Framer Motion layout animation docs confirm that `layout` prop issues only arise when the component carries `layout` — the entry animation here is irrelevant to scroll.

### What to watch for

1. **Race condition on first load:** If a letter button is clicked before the 500ms entry animation completes, `scrollIntoView` fires while the grid is still translating `y: 20 → 0`. This can land the scroll position ~20px short. Mitigation: disable the jump bar for 500ms after initial render (a single `useState(false)` `ready` flag set in a `useEffect` with a 500ms delay), or switch the grid to `initial={false}` once the component has mounted.

2. **Sort-mode re-sort:** When `books` state is re-sorted (sort toggle), React will re-render the grid. There is no `layout` prop on the `motion.div`, so Framer Motion will **not** animate the reorder — it will be an instant snap. This is fine for a simple grid. If animated reordering is added later, `layout` should be added to `BookCard` wrappers, **not** the outer grid (which would cause the scale-distortion noted in Motion docs).

3. **GitHub issue #1593** ("scrollIntoView is blocked while animating presence after v6.3.8") — marked `wontfix`, but only affects `AnimatePresence` exit animations. This project uses `AnimatePresence` nowhere in the grid path. Not applicable.

**Verdict:** No library changes needed. The existing animation is safe. Add the 500ms `ready` guard on initial mount.

---

## Tailwind v4 Notes

### Critical: Dynamic class names are purged

Tailwind v4 scans source files as plain text. **Constructing class names at runtime will silently fail at build time.**

**This pattern will break:**
```tsx
// WRONG — Tailwind will never see "opacity-50" or "opacity-100" as literal strings
const cls = `opacity-${isActive ? '100' : '50'}`;
<button className={cls}>A</button>
```

**Use a lookup map or ternary with complete class names:**
```tsx
// CORRECT — both strings are present as literals in source
<button className={isActive ? 'opacity-100 cursor-pointer' : 'opacity-30 cursor-not-allowed'}>
  {letter}
</button>
```

**Full safe pattern for letter buttons:**
```tsx
<button
  key={letter}
  onClick={() => activeLetters.has(letter) && handleLetterClick(letter)}
  disabled={!activeLetters.has(letter)}
  className={
    activeLetters.has(letter)
      ? 'text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
      : 'text-sm font-medium text-gray-300 dark:text-gray-600 cursor-not-allowed'
  }
  aria-label={`Jump to ${letter}`}
>
  {letter}
</button>
```

### `scroll-mt-{n}` for sticky bar offset

The jump bar will likely be `position: sticky, top: 0`. Without `scroll-mt`, `scrollIntoView({ block: 'start' })` scrolls the target element to the very top of the viewport, placing it **behind** the sticky bar. Fix:

```tsx
// On each anchor wrapper div — value = approx height of sticky bar
<div data-letter={...} className="scroll-mt-16">
```

`scroll-mt-16` (4rem = 64px) is a typical starting point; adjust to the actual rendered height of `AlphaBar`. This is a pure CSS property — `scroll-margin-top` — and works with `scrollIntoView` as confirmed by MDN.

### No Tailwind v4 config-file quirks for this feature

Tailwind v4 moves configuration into CSS (`@theme`, `@source`). No `safelist` array in a JS config exists anymore. For dynamic classes: either use the full-literal ternary pattern above, or add `@source inline("...")` to the CSS file for specific classes. The ternary pattern is cleaner for 26 buttons.

---

## Browser Support for `scrollIntoView`

**No polyfill needed in 2025/2026.**

From caniuse.com (checked April 2026):
- Global usage: **97.02%** (95.15% full + 1.87% partial)
- Chrome 61+, Firefox 36+, Safari 16+, Edge 79+: **Full support** including `{ behavior: 'smooth' }`
- MDN Baseline status: **"Widely available"** — well established across browsers since January 2020
- Only gap: Opera Mini (all versions) — negligible for a personal library app

Safari 16+ (released Sep 2022) was the last major browser to add full `behavior: 'smooth'` support. Older Safari (15.x and below) falls back to instant scroll — acceptable degradation, no broken behavior.

**`scroll-margin-top` / `scroll-margin-top`:** Also fully supported in all modern browsers (Chrome 69+, Firefox 68+, Safari 14.1+).

---

## Implementation Summary

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Library | None — build from scratch | No maintained library exists; 50 lines of TSX |
| Scroll anchor | `data-letter` on first card wrapper per letter | Survives filter/sort changes; no ref array sync |
| Scroll call | `element.scrollIntoView({ behavior: 'smooth', block: 'start' })` | 97% browser support, no polyfill |
| Sticky offset | `scroll-mt-16` (or measured value) on anchor wrapper | CSS `scroll-margin-top` standard |
| Framer Motion | No changes; add 500ms `ready` guard on mount | Avoids race with 500ms entry animation |
| Tailwind active/disabled | Full literal strings in ternary | Tailwind v4 scans for complete class strings |

---

## Confidence

| Finding | Confidence | Source |
|---------|------------|--------|
| No viable library on npm | **HIGH** | npm registry checked directly; all candidates 404'd or abandoned |
| `data-letter + querySelector` approach | **HIGH** | React docs (refs), PROJECT.md decision log, verified pattern |
| `scrollIntoView` browser support (97%+, no polyfill) | **HIGH** | caniuse.com April 2026, MDN official docs |
| Framer Motion entry animation safe (no layout prop) | **HIGH** | Official Motion docs + page.tsx code inspection; GitHub issue #1593 confirmed irrelevant |
| 500ms race condition guard needed | **MEDIUM** | Derived from animation duration in page.tsx; unverified via testing |
| Tailwind v4 dynamic class purge | **HIGH** | Official Tailwind v4 docs (tailwindcss.com/docs/detecting-classes-in-source-files) |
| `scroll-mt-{n}` for sticky bar offset | **HIGH** | MDN + Tailwind docs; standard CSS property |
