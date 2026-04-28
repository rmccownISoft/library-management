# Featured Tools — Pinned Override Design

**Date:** 2026-04-27  
**Status:** Approved

## Summary

Allow admins to pin up to 6 tools to always appear in the "Popular Tools" section on the homepage. Pinned tools fill slots first; the existing checkout-frequency + recently-added algorithm fills any remaining slots.

---

## Data Layer

**Storage:** New key `featured_tool_pins` in the existing `system_settings` table.  
**Value format:** JSON array of tool IDs, e.g. `[42, 17, 103]`. Empty array `[]` when no pins are set.

**Changes to `src/lib/server/systemSettings.ts`:**
- Add `FEATURED_PINS_KEY = 'featured_tool_pins'`
- Add `parsePins(value: string | null | undefined): number[]` — parses JSON, validates array of integers, deduplicates, returns `[]` as fallback on any invalid input

**Edge cases (handled silently):**
- Deleted tool ID in pins list → not found in DB query, slot falls to algorithm
- Pinned tool with no photo → still shown; homepage already handles no-photo with a tool emoji fallback
- Pins list > 6 items → only first 6 used (guard in both UI and homepage load)

---

## Admin Config Page

**Location:** `/admin/config` — new "Featured Tools" card below the existing Library Hours card.

**UI elements:**
- Typeahead search input using the existing `GET /api/tools/search?search=` endpoint
- Results dropdown shows tool name + category
- Selected tools appear as removable chips (tool name + × button), up to 6; already-pinned tools are excluded from search results to prevent duplicates
- When 6 pins are active, search input is disabled with a "Maximum 6 tools pinned" note
- Separate Save button for this section (independent from the hours Save button)
- Success/error feedback banner above the section (same pattern as hours)

**Form mechanics:**
- Uses a named action `?/savePins` (separate from the hours `default` action)
- Hidden input `name="pins"` carries `JSON.stringify(pinnedIds)` on submit
- `use:enhance` with `submitting` state, same pattern as hours form

**Server changes (`src/routes/admin/config/+page.server.ts`):**
- `load()`: fetch both `LIBRARY_HOURS_KEY` and `FEATURED_PINS_KEY` settings; return `{ hours, pins }`
- New `savePins` action: validate with `parsePins()`, upsert `system_settings`, log with `UPDATE_CONFIG` action and `{ key: FEATURED_PINS_KEY }` payload

---

## Homepage Logic

**Changes to `src/routes/+page.server.ts`:**

1. Load `FEATURED_PINS_KEY` from `system_settings` (in the existing `Promise.all`)
2. If pins exist, fetch those tools by ID — no photo filter (admin chose them explicitly); cap at 6
3. Compute remaining slots: `6 - pinnedTools.length`
4. Run existing algorithm (most checked out → recently added fallback) with `id: { notIn: pinnedIds }` added to both queries, limited to remaining slots
5. Return `featuredTools = [...pinnedTools, ...algorithmTools]`

No changes to `+page.svelte` — the template already handles both photo and no-photo cases.

---

## Activity Logging

Reuse the existing `UPDATE_CONFIG` action. Payload: `{ key: 'featured_tool_pins', count: n }`.

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/server/systemSettings.ts` | Add `FEATURED_PINS_KEY`, `parsePins()` |
| `src/routes/admin/config/+page.server.ts` | Load pins, add `savePins` action |
| `src/routes/admin/config/+page.svelte` | Add Featured Tools section with typeahead picker |
| `src/routes/+page.server.ts` | Load pins, fetch pinned tools, exclude from algorithm |
