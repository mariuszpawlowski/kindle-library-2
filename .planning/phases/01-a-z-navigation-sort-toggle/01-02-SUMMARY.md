---
phase: 01-a-z-navigation-sort-toggle
plan: "02"
subsystem: ui-components
tags: [AlphabetBar, sort-toggle, sticky-nav, accessibility, a11y]
dependency_graph:
  requires: [01-01]
  provides: [AlphabetBar component, wired page.tsx with full A-Z nav]
  affects: [app/page.tsx, components/AlphabetBar.tsx]
tech_stack:
  added: [components/AlphabetBar.tsx]
  patterns: [pure-presentational-component, aria-roles, sticky-nav]
key_files:
  created: [components/AlphabetBar.tsx]
  modified: [app/page.tsx]
decisions:
  - AlphabetBar is pure presentational — all state lives in page.tsx, props control everything
  - disabled attribute (not aria-disabled) natively removes inactive letters from tab order
  - aria-current={isSelected ? true : undefined} — pass undefined (not false) to omit attribute when not selected
  - SearchBar onSearchChange resets activeLetter to null for consistency with sort change behavior
  - All className values are full literal strings (Tailwind v4 purge compatibility)
metrics:
  duration: "~5 minutes"
  completed: "2026-04-14"
  tasks_completed: 2
  files_changed: 2
---

# Phase 01 Plan 02: AlphabetBar Component & Wire-up Summary

**One-liner:** Built `AlphabetBar.tsx` sticky nav with Author/Title sort toggle and 26 letter jump buttons, wired into `app/page.tsx` with full accessibility attributes.

## What Was Built

### components/AlphabetBar.tsx
New pure presentational component with:
- `<nav aria-label="Jump to books by letter">` — sticky, `z-10`, `overflow-x-hidden`
- **Sort toggle:** `role="group"` + `aria-label="Sort order"` container, two buttons with `aria-pressed`
- **26 letter buttons:** Active (clickable + focusable), inactive (`disabled` + `cursor-not-allowed` + `opacity-40`), selected (`bg-blue-500 text-white`)
- `aria-current={isSelected ? true : undefined}` — attribute omitted when not selected
- `flex-wrap` inner layout prevents horizontal overflow on mobile
- All className strings are full literals (Tailwind v4 compatible — no dynamic construction)

### app/page.tsx Updates
- Added `import AlphabetBar from '@/components/AlphabetBar'`
- Renders `<AlphabetBar>` between `<SearchBar>` and the loading/grid block
- All 5 props wired: `letters={availableLetters}`, `activeLetter`, `sortMode`, `onLetterClick={handleLetterClick}`, `onSortChange={handleSortChange}`
- `SearchBar.onSearchChange` now resets `activeLetter` to `null` (consistent with sort change behavior)

## Verification

- ✅ `npx tsc --noEmit` — zero TypeScript errors
- ✅ `npm run lint` — no errors in modified files (pre-existing errors in other files unaffected)
- ✅ `npm run build` — production build compiles successfully in 6.2s
- ⏳ Human checkpoint: awaiting visual + functional verification

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is wired from live state in page.tsx.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced.

## Self-Check: PASSED
