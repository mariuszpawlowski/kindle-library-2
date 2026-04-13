# Kindle Library — Navigation Improvement

## What This Is

A personal Kindle highlights library built with Next.js, displaying books as a cover-tile grid with search. This milestone adds an A–Z jump bar and a sort-mode toggle so the user can quickly navigate to books by author surname initial or title initial without typing in the search box.

## Core Value

Get to the right part of your library in one click — without scrolling or searching.

## Requirements

### Validated

- ✓ Books displayed as cover tiles in a responsive grid — existing
- ✓ Client-side search by title or author — existing
- ✓ Books sorted by author surname by default — existing
- ✓ Kindle clippings upload (smart import) — existing
- ✓ Book detail page with highlights — existing
- ✓ Delete / restore history — existing

### Active

- [ ] A–Z jump bar above the book grid
- [ ] Clicking an active letter scrolls to the first matching book
- [ ] Letters with no matching books are visually grayed out / disabled
- [ ] Sort-mode toggle: switch between "by author surname" and "by title"
- [ ] A–Z bar updates to reflect the active sort mode (author initials vs title initials)
- [ ] Scroll-to position stays accurate when search filter is also active

### Out of Scope

- Pagination or infinite scroll — library is personal-scale; all books fit in one page
- Server-side filtering — all data is already client-side
- Author detail pages — no route per author planned
- Persist sort preference across sessions — not requested

## Context

- `app/page.tsx` manages all books state; sorting is done client-side after fetch (sort by author surname via `getSurname()` helper already implemented)
- Books are sorted **once** after fetch and stored in `books` state; `filteredBooks` is derived from that
- The A–Z bar is purely client-side — no API changes needed
- Each `BookCard` renders as a `<Link>` with no `id` attribute that can be targeted; scroll-to will need ref anchors or data attributes added to the grid
- Framer Motion wraps the grid (`motion.div`) — scroll anchor approach should avoid conflicting with animation
- Sort toggle will reorder `books` state, which cascades to `filteredBooks` automatically
- Stack: Next.js 16 App Router, React 19, Tailwind CSS v4, framer-motion, lucide-react

## Constraints

- **Tech stack**: Must use Tailwind for styling — no new CSS-in-JS or style libraries
- **No new routes**: All changes are within `app/page.tsx` and a new component; no API changes
- **TypeScript strict**: All new code must pass `tsc --noEmit`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| A–Z jump bar (not grouped sections or author chips) | Simplest interaction — one click, no layout change, scales to any library size | — Pending |
| Sort-mode toggle controls both sort order and jump targets | Single source of truth; user sees consistent behavior | — Pending |
| Scroll-to via `element.scrollIntoView()` with data attributes | Avoids id conflicts with existing DOM; no extra dependencies | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-14 after initialization*
