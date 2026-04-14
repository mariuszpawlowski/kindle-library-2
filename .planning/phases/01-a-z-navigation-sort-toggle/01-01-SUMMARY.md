---
phase: 01-a-z-navigation-sort-toggle
plan: "01"
subsystem: state-utilities
tags: [utils, useMemo, sort, state, framer-motion]
dependency_graph:
  requires: []
  provides: [getSurname, sortMode, sortedBooks, filteredBooks, availableLetters, handleLetterClick, handleSortChange, gridReady]
  affects: [app/page.tsx]
tech_stack:
  added: [lib/utils.ts]
  patterns: [useMemo-chain, gridReady-guard, shared-utility-export]
key_files:
  created: [lib/utils.ts, lib/utils.test.ts]
  modified: [app/page.tsx]
decisions:
  - Use /\s+/ regex in getSurname for robust whitespace handling
  - getSurname returns "" for empty string (no crash path)
  - sortedBooks → filteredBooks → availableLetters useMemo chain ensures search + sort work together
  - gridReady guards handleLetterClick against 500ms Framer Motion animation race
  - activeLetter resets on sort change (SORT-04)
metrics:
  duration: "~8 minutes"
  completed: "2026-04-14"
  tasks_completed: 2
  files_changed: 3
---

# Phase 01 Plan 01: State & Utilities Foundation Summary

**One-liner:** Extracted `getSurname` to shared `lib/utils.ts` and wired `sortMode`/`useMemo` chains + Framer Motion `gridReady` guard into `app/page.tsx`.

## What Was Built

### lib/utils.ts
New shared utility module with a single named export:
```typescript
export function getSurname(name: string): string
```
Uses `/\s+/` regex for robust multi-space handling. Returns `""` for empty input without crashing.

### lib/utils.test.ts
Node.js assert-based test harness (runnable via `npx tsx lib/utils.test.ts`) with 5 cases:
- `getSurname("Yuval Noah Harari")` → `"harari"`
- `getSurname("Orwell")` → `"orwell"`
- `getSurname("  George  Orwell  ")` → `"orwell"` (whitespace trimmed)
- `getSurname("")` → `""` (empty string)
- `getSurname("J.K. Rowling")` → `"rowling"`

### app/page.tsx Refactor
- **New state:** `sortMode ('author'|'title')`, `activeLetter (string|null)`, `gridReady (boolean)`
- **Removed:** inline `getSurname` inside `fetchBooks` → replaced with `@/lib/utils` import
- **New useMemo chain:** `books → sortedBooks → filteredBooks → availableLetters`
- **New handlers:** `handleLetterClick` (gridReady guard + scrollIntoView), `handleSortChange` (reset activeLetter)
- **motion.div:** `onAnimationComplete={() => setGridReady(true)}` (IMPL-02 Framer Motion guard)
- **Grid items:** wrapped in `<div data-letter={initial} className="scroll-mt-16">` for first-in-group books

## Verification

- ✅ `npx tsx lib/utils.test.ts` — all 5 tests pass
- ✅ `npx tsc --noEmit` — zero TypeScript errors
- ✅ `npm run lint` — only pre-existing warnings in other files; no errors in modified files

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `activeLetter`, `availableLetters`, `handleLetterClick`, `handleSortChange` are unused in this plan — they will be wired to `AlphabetBar` in Plan 02. This is intentional; lint warns but does not error.

## Self-Check: PASSED
