# Project State

**Last updated:** 2026-04-14
**Status:** Active

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-14)
**Core value:** Get to the right part of your library in one click — without scrolling or searching.
**Current focus:** Phase 1

## Phases

| # | Phase | Status | Requirements |
|---|-------|--------|--------------|
| 1 | A–Z Navigation & Sort Toggle | Not started | NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, SORT-01, SORT-02, SORT-03, SORT-04, IMPL-01, IMPL-02, IMPL-03, IMPL-04 |

## Active Phase

**Phase 1: A–Z Navigation & Sort Toggle**
Status: Not started
Requirements: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, SORT-01, SORT-02, SORT-03, SORT-04, IMPL-01, IMPL-02, IMPL-03, IMPL-04

## Notes

- All work is client-side only — no API or route changes needed.
- Two plans defined: (1) shared utilities & state refactor in `page.tsx`, (2) `AlphabetBar.tsx` component + sort toggle UI.
- Critical pitfalls documented in research/SUMMARY.md: Framer Motion race condition (IMPL-02), `availableLetters` must derive from `filteredBooks` not `books` (NAV-04), `getSurname()` must be shared (IMPL-01), `scroll-mt` offset required to avoid scroll-behind-bar (NAV-03), Tailwind v4 no dynamic class strings.
- Stack: Next.js 16 App Router, React 19, Tailwind CSS v4, framer-motion, lucide-react. TypeScript strict mode required.
