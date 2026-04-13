# Features Research — A–Z Navigation

**Domain:** Alphabet jump bar + sort-mode toggle for a personal book library  
**Researched:** 2026-04-14  
**Confidence:** HIGH (patterns drawn from iOS Contacts, Amazon Kindle app, Goodreads shelf views,
library catalog software, and established web UI pattern libraries)

---

## Reference Implementations Surveyed

| App / Platform | A–Z Bar | Empty Letters | Sticky | Bidirectional Sync | Sort Toggle |
|----------------|---------|---------------|--------|--------------------|-------------|
| **iOS Contacts** | Vertical sidebar scrubber, all 26 letters always shown | Grayed out, not tappable | Sticky (always accessible while scrolling) | Yes — scroll updates current-letter highlight in sidebar | N/A (only one sort mode) |
| **Amazon Kindle app (iOS/Android)** | No A–Z bar; uses search + scroll | N/A | N/A | N/A | "Sort" button: Recent, Title, Author — placed top-right |
| **Goodreads "My Books" shelf** | No letter bar; sort dropdown + search only | N/A | Sort bar sticky at top | N/A | Dropdown: "Title", "Author", "Date Read", "Date Added" |
| **Library catalog (Koha, Ex Libris Primo)** | Facets on the left, not an A–Z bar | Hidden letters with no results, or grayed | Facet panel sticky on desktop | No (server-side paging) | Sort: Relevance / Title / Author / Date — placed above results, inline |
| **Contacts apps (Android, macOS)** | Vertical right-side scrubber or inline section headers | Grayed out / skipped entirely | Sticky section headers | Yes — letter highlights on scroll | N/A |
| **iTunes / Apple Music (legacy)** | Horizontal A–Z bar above grid | Grayed out | Sticky | No | "Sort by: Artist / Album / Title" — dropdown above grid |

**Key takeaway from survey:** The horizontal-bar-above-grid pattern (Apple Music / iTunes) is the
closest analogue to this project's tile-grid layout. iOS Contacts' vertical scrubber is the
canonical reference for the behavior contract (gray inactive letters, sticky, bidirectional sync).

---

## Table Stakes

Features users expect as baseline. Their absence makes the component feel broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| All 26 letters always rendered | Users learn the layout once; hidden letters shift positions and confuse muscle memory | Low | Render all; style inactive differently |
| Inactive letters visually distinguished | Clicking a letter with no books should not feel like a broken button | Low | Reduced opacity (`opacity-30`) + `cursor-not-allowed` or `pointer-events-none` |
| Active letter click scrolls to first matching book | Core purpose of the component | Low–Med | `scrollIntoView({ behavior: 'smooth', block: 'start' })` |
| Clicking an already-active letter does nothing harmful | Users sometimes double-click; a no-op or gentle re-scroll is expected | Low | Guard or idempotent scroll |
| Bar updates when sort mode changes | The sort toggle is visible; users expect the bar to immediately reflect the new axis | Low | Derived from `books` state — automatic if computed correctly |
| Bar works correctly while search filter is active | Filtered view still has valid initials; jump should land in the filtered set | Med | Initials must be computed from `filteredBooks`, not `books` |
| Keyboard accessible (at minimum, tab-focusable, Enter triggers scroll) | WCAG 2.1 AA baseline; button role expected | Low | Use `<button>` elements with `aria-label="Jump to letter X"` |

---

## Differentiators

Nice-to-have features that improve the experience without being expected.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Active-letter highlight that tracks manual scrolling (bidirectional sync) | Constantly shows user "you are in the B section" — iOS Contacts' killer feature | Med–High | Requires `IntersectionObserver` watching per-letter anchor elements; see section below |
| Smooth scroll animation | Polished feel, especially with Framer Motion already in the project | Low | `behavior: 'smooth'` on `scrollIntoView`; or use Framer Motion's `animate` on scroll position |
| Visual "count badge" on hover | "B (4 books)" tooltip on hover tells user how much is under each letter | Low | `title` attribute or a CSS tooltip; data computed when building the letter map |
| "#" bucket for numeric titles | Titles starting with digits ("1984", "48 Laws of Power") have no natural letter slot | Low | Prepend a `#` button for numeric-initial items |
| Transition animation when switching sort modes | A brief fade/crossfade on the grid when sort changes signals the reorder | Low–Med | Framer Motion `AnimatePresence` on the grid; already available in project |

---

## Anti-Features

Things to deliberately NOT build. The complexity is not worth the benefit at personal-library scale.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Grouped section headers in the grid** | Requires restructuring the grid layout; conflicts with the tile-grid format; adds visual noise for a small library | Keep the A–Z bar as a jump mechanism only; no inline "A" / "B" headers in the grid |
| **URL hash routing per letter** (`/library#B`) | Not requested; adds router complexity; breaks the "no new routes" constraint; Next.js App Router handles `#` scrolling inconsistently with Framer Motion | Use `scrollIntoView` with `data-` attributes on anchor elements |
| **Persist active letter in state after scrolling away** | Confusing: user expects letter to deactivate when they scroll past it without bidirectional sync; with bidirectional sync it's handled naturally | Only highlight a letter when actively scrolled to that section |
| **Animated letter pop or bounce on click** | Adds perceived latency to the scroll; distracts from the main content | A simple active state color change (Tailwind `bg-accent`) on click is sufficient |
| **Keyboard letter press jumps to section** | Conflicts with the existing search-by-typing behavior; users typing "b" to search would also jump the grid | Keep the search input as the primary keyboard interaction |
| **"All" / clear-letter button** | Not needed for a jump bar (it's not a filter); clicking a letter does not hide other sections | Clarify in implementation: the A–Z bar scrolls, it does not filter |

---

## Empty Letter Handling

**Recommendation: Render all 26 letters; dim inactive ones.**

**Rationale:**

- **Grayed out (opacity ~30%), non-interactive** is the universal convention (iOS Contacts, Android Contacts, Apple Music). Users have been trained by these apps.
- **Hidden letters** (only show active ones) fail because: (a) the bar width varies as the library grows/shrinks, causing layout shift; (b) users can't tell which letters *would* have results in a different sort mode; (c) scanning A–Z is faster when the grid is stable.
- **Tooltip on hover** ("No books under X") is a nice touch but not required — the grayed appearance is already communicative. Do not add tooltip for the empty state specifically; it adds implementation cost for zero user value in a personal library.
- **Styling:** `opacity-30 cursor-not-allowed pointer-events-none` (Tailwind) on inactive letters. Keep the same size and spacing as active letters. Do not change font size or remove padding.

**Implementation note:** Compute the set of active initials from `filteredBooks` (not `books`) so the bar reflects what's currently visible. When search filters books, some letters may become inactive mid-session.

---

## Sticky vs Static Bar

**Recommendation: Sticky.**

**Rationale:**

- The entire point of an A–Z bar is one-click navigation *from anywhere in the list*. A static bar at the top of the page only helps when you're already at the top — at which point you could have just started scrolling.
- All reference implementations that use an A–Z bar (iOS Contacts, Apple Music, Android Contacts) make the bar sticky. The ones that don't use a bar (Goodreads, Kindle) use search instead.
- At personal-library scale (likely 50–300 books in a multi-row tile grid), the grid is tall enough that the user will frequently scroll past the bar if it's static.
- Sticky positioning in CSS (`position: sticky; top: 0`) is well-supported, zero-JS, and composable with Tailwind.

**Placement:**

- Sticky *below* the site header/navbar (if any), above the book grid.
- Use `z-index` to ensure the bar sits above the Framer Motion grid without interfering with it.
- Include the sort toggle in the same sticky bar row to keep all navigation controls co-located. One sticky band, two controls.

**Implementation:** `sticky top-0 z-10 bg-background` (or the appropriate background token). Ensure the sticky container has a background so the grid doesn't bleed through when scrolling.

---

## Bidirectional Sync

**Recommendation: Implement it, but defer to a separate sub-task; do not block the MVP on it.**

**Worth it?** Yes, with caveats:

- **User value:** High for power users; the "you are here" indicator is genuinely useful in a long library. But it is not expected as a *baseline* — users can function without it.
- **Implementation cost:** Medium. Requires `IntersectionObserver` watching letter-anchor elements, maintaining a `currentLetter` state, and highlighting the matching bar button. The complexity is manageable but should not be tangled with the core scroll-on-click feature.
- **Recommended approach:** 
  1. Phase 1: Implement scroll-on-click only. The bar is stateless once clicked.
  2. Phase 2 (optional enhancement): Add `IntersectionObserver` to update `activeLetter` state as the user scrolls manually.
- **Caveat for this project:** Framer Motion wraps the grid (`motion.div`). Test that `IntersectionObserver` fires correctly on children of an animated container — Framer Motion does not block observation, but layout animations may briefly trigger spurious intersection events during sort transitions.

**Intersection observer strategy:**
- Observe one sentinel element per letter group (the first `BookCard` with a given initial, tagged with `data-letter="B"`).
- Use `rootMargin: "-20% 0px -70% 0px"` (a horizontal band near the top of the viewport) to highlight only the letter currently "in view near the top."
- Debounce state updates to avoid flicker when scrolling fast.

---

## Sort Toggle Placement & Labels

**Recommendation: Inline toggle in the sticky navigation bar, left of the A–Z letters, labeled "Author" / "Title".**

**Placement rationale:**

- Goodreads, Kindle, and library catalogs all place sort controls *above* the results grid, co-located with other navigation controls. Users look "above the content" for sort.
- Since the A–Z bar is already sticky above the grid, co-locating the sort toggle in the same bar keeps the navigation surface unified. One sticky band for all navigation.
- Placing it in the page header or in a sidebar would be unconventional for this type of app.

**Label conventions surveyed:**

| App | Sort Labels |
|-----|------------|
| Goodreads My Books | "Title", "Author", "Date Read", "Date Added" |
| Amazon Kindle app | "Recent", "Title", "Author" |
| Apple Books | "Recent", "Title", "Author" |
| Library catalog (Primo) | "Relevance", "Title", "Author", "Date" |
| iTunes (legacy grid) | "Artist", "Album", "Title" |

**Recommendation for this project:**

- Two-state toggle: **"Author"** and **"Title"** (not "Sort by Author" — be terse).
- Use a segmented control (two adjacent buttons that look like a pill/tab group) rather than a dropdown. Reason: there are only two options; a dropdown adds an interaction step for a binary choice.
- Show the currently active mode as visually selected (filled/highlighted). The other option is outlined/ghost.
- Icon option: a small sort icon (Lucide `ArrowUpDown` or `List`) before the labels is a common affordance, but optional.
- Placement in bar: `[Author | Title]  ·  A B C D E F G H I J K L M N O P Q R S T U V W X Y Z`

**Label edge case — "Author" mode with `getSurname()`:**

- The bar label should say **"Author"** (not "Surname") since that's the natural vocabulary. The fact that the sort uses `getSurname()` internally is an implementation detail.
- When in Author mode, the bar shows author surname initials. When in Title mode, it shows title initials. The labels on the toggle are the clearest signal of which axis is active.

---

## Edge Cases: Authors Without Identifiable Surnames

**Problem:** Some books may have authors like "Unknown", single-name authors (e.g. "Cher", "Homer", "Voltaire"), or corporate authors ("Harvard Business Review").

**Recommendation:**

| Author Type | Handling |
|-------------|----------|
| `"Unknown"` literal or empty string | Bucket under **"#"** or a separate **"?"** slot at the end of the bar. Do not put under "U" — "Unknown" is not a surname. |
| Single-name author (Homer, Voltaire) | Treat the single name as the surname. Index under its first letter ("H", "V"). This is the library catalog standard. |
| Initials-only author ("J.K. Rowling") | `getSurname()` returns "Rowling" — handled correctly already. |
| Corporate/org author ("Harvard Business Review") | First word is effectively the "surname" for indexing. Index under "H". |
| Null / missing author | Bucket under "?" or "#" at the end, same as "Unknown". |

**Implementation:** Extend or wrap `getSurname()` to return `"#"` for empty/null/Unknown values. The `#` button in the bar only renders if at least one book falls into this bucket.

---

## Sources & Confidence

| Finding | Source | Confidence |
|---------|--------|------------|
| Gray-out inactive letters (not hide) | iOS Contacts, Android Contacts (observed behavior); Apple Music (observed) | HIGH |
| Sticky bar universal in A–Z implementations | iOS Contacts, Apple Music (observed) | HIGH |
| Bidirectional sync via IntersectionObserver | MDN Web Docs, common React pattern | HIGH |
| Sort toggle labels convention | Goodreads, Amazon Kindle, Apple Books (observed) | HIGH |
| Segmented control for binary sort | Apple HIG, Material Design pattern (toggle group) | HIGH |
| "#" bucket for numeric/unknown | Library catalog cataloging convention (MARC/LC rules) | MEDIUM |
| IntersectionObserver + Framer Motion caveat | Training data / known pattern; should be verified during implementation | MEDIUM |
