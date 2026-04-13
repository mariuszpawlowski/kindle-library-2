# Roadmap: Kindle Library — Navigation Improvement

## Overview

Add an A–Z jump bar and sort-mode toggle to the existing Next.js book grid so users can jump to any section of their library in one click. All 13 v1 requirements are delivered in a single phase.

**1 phase** | **13 requirements** | Granularity: Coarse

---

## Phase 1: A–Z Navigation & Sort Toggle

**Goal:** Users can jump to any letter section of their library in one click and switch between author-surname and title sort order, with the bar always reflecting what is currently visible.
**Requirements:** NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, SORT-01, SORT-02, SORT-03, SORT-04, IMPL-01, IMPL-02, IMPL-03, IMPL-04
**UI hint:** yes

### Success Criteria

1. A sticky bar with all 26 letters is visible above the book grid at all times; letters that have no matching book in the current view are visibly dimmed and cannot be clicked.
2. Clicking an active letter smoothly scrolls the page so the first matching book is visible below the bar (not hidden behind it), including when a search filter is active at the same time.
3. A two-state "Author / Title" toggle sits alongside the letter bar; switching modes instantly re-sorts the grid and updates which letters are active, and clears any previously selected letter highlight.
4. The bar and scroll behaviour work correctly on mobile — no horizontal overflow, letters wrap or shrink gracefully on small screens.
5. The jump bar is keyboard-navigable and screen-reader-friendly: semantic `<nav>`, proper `aria-label`, `disabled` on inactive letters, and `aria-current` on the active letter.

### Plans

- Plan 1: Shared utilities & state refactor — extract `getSurname()` to `lib/utils.ts`, add `sortMode` state to `page.tsx`, wire `sortedBooks` / `filteredBooks` / `availableLetters` as `useMemo` chains, add `data-letter` anchor wrappers to the grid, and add the Framer Motion ready-guard.
- Plan 2: AlphabetBar component & sort toggle UI — build `components/AlphabetBar.tsx` (sticky bar, 26 letter buttons, dim/disable inactive, `aria` attributes, mobile wrap), add the "Author / Title" segmented toggle, connect `handleLetterClick` with `scrollIntoView`, and add `scroll-mt` offset on anchor wrappers.

---

## Requirement Coverage

| Requirement | Phase | Description |
|-------------|-------|-------------|
| NAV-01 | Phase 1 | A–Z jump bar with all 26 letters always rendered |
| NAV-02 | Phase 1 | Letters with no matching books are dimmed and non-interactive |
| NAV-03 | Phase 1 | Clicking an active letter scrolls to the first matching book |
| NAV-04 | Phase 1 | Bar derives available letters from `filteredBooks` (search + bar work together) |
| NAV-05 | Phase 1 | Bar is sticky — remains visible at top of viewport while scrolling |
| SORT-01 | Phase 1 | Sort toggle co-located with the A–Z bar |
| SORT-02 | Phase 1 | "Author" sorts by surname; "Title" sorts alphabetically by title |
| SORT-03 | Phase 1 | Switching sort mode immediately updates grid order and available letters |
| SORT-04 | Phase 1 | Active letter indicator resets when sort mode changes |
| IMPL-01 | Phase 1 | `getSurname()` extracted to shared utility used by both sort and bar |
| IMPL-02 | Phase 1 | Scroll-to guarded against Framer Motion 500ms entry animation race |
| IMPL-03 | Phase 1 | Jump bar is accessible (semantic nav, aria-label, disabled, keyboard) |
| IMPL-04 | Phase 1 | Mobile layout: bar wraps or uses smaller type with no horizontal overflow |

**Coverage:** 13/13 v1 requirements mapped ✓
