# Requirements: Kindle Library — Navigation Improvement

**Defined:** 2026-04-14
**Core Value:** Get to the right part of your library in one click — without scrolling or searching.

## v1 Requirements

### Navigation Bar

- [ ] **NAV-01**: A–Z jump bar is displayed above the book grid with all 26 letters always rendered
- [ ] **NAV-02**: Letters with no matching books are visually dimmed and non-interactive (disabled)
- [ ] **NAV-03**: Clicking an active letter scrolls the page to the first matching book in the grid
- [ ] **NAV-04**: Jump bar derives available letters from `filteredBooks` (search + bar work together correctly)
- [ ] **NAV-05**: Bar is sticky — remains visible at top of viewport while scrolling through the grid

### Sort Toggle

- [ ] **SORT-01**: Sort-mode toggle with "Author" / "Title" options is co-located with the A–Z bar
- [ ] **SORT-02**: "Author" mode sorts books by author surname (existing behavior); "Title" mode sorts alphabetically by book title
- [ ] **SORT-03**: Switching sort mode immediately updates both the grid order and the letters available in the bar
- [ ] **SORT-04**: Active letter indicator resets when sort mode is changed

### Implementation Quality

- [ ] **IMPL-01**: `getSurname()` is extracted to a shared utility so grid sort and bar letter extraction share identical logic
- [ ] **IMPL-02**: Scroll-to is guarded against Framer Motion's 500ms entry animation race (no premature scroll)
- [ ] **IMPL-03**: Jump bar is accessible — semantic `<nav>`, `aria-label`, `disabled` attribute on inactive letters, keyboard navigable
- [ ] **IMPL-04**: Mobile layout: letter bar wraps or uses smaller type on small screens with no horizontal overflow

## v2 Requirements

### Bidirectional Sync

- **SYNC-01**: Active letter in the bar updates automatically as the user scrolls (highlights current section)
- **SYNC-02**: Active letter state syncs via IntersectionObserver on section anchors

## Out of Scope

| Feature | Reason |
|---------|--------|
| Pagination / infinite scroll | Personal-scale library; all books fit on one page |
| Author detail pages | No per-author route planned in this milestone |
| Persist sort preference in localStorage | Not requested; default author-surname sort is sufficient |
| Server-side filtering | All data is already client-side; no API changes needed |
| Grouped section headers (A / B / C dividers in grid) | Adds layout complexity; jump bar covers the use case without disrupting the visual grid |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMPL-01 | Phase 1 | Pending |
| NAV-01 | Phase 1 | Pending |
| NAV-02 | Phase 1 | Pending |
| NAV-03 | Phase 1 | Pending |
| NAV-04 | Phase 1 | Pending |
| NAV-05 | Phase 1 | Pending |
| SORT-01 | Phase 1 | Pending |
| SORT-02 | Phase 1 | Pending |
| SORT-03 | Phase 1 | Pending |
| SORT-04 | Phase 1 | Pending |
| IMPL-02 | Phase 1 | Pending |
| IMPL-03 | Phase 1 | Pending |
| IMPL-04 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-14 after initial definition*
