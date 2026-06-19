# Check-In Experience Improvements — Implementation Plan

> **For agentic workers:** Implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Tasks 1–3 are independent of Task 4 and can ship separately.

**Goal:** Make checking tools back in less clunky. Today the only path is: open patron → scroll past full Checkout History → find the `CHECKED_OUT` row → hit a buried "Check In" button. This plan (a) surfaces a dedicated **Current Checkouts** section on the patron page, (b) makes the **Active Checkouts** statistic click through to it, and (c) adds a new top-level **Check In** page listing every tool currently out across all patrons.

**Architecture:** No schema changes and no new API. The existing `POST /api/checkin` endpoint accepts only a `checkoutId` and works from any caller, so every new surface reuses it through the existing `ConfirmModal` flow. The patron-detail load and a new `/checkin` load gain `tool.files` includes for thumbnails. "Active" means `status !== 'RETURNED'` (covers `CHECKED_OUT` and the manually-flagged `OVERDUE`); overdue is detected on the fly from `dueDate`, matching current behavior — no overdue job is introduced.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, TypeScript, Prisma ORM (SQLite), Tailwind CSS v4

---

## File Map

| File | Change |
|------|--------|
| `src/lib/components/ImageLightbox.svelte` | **New** — extract the thumbnail-button + fullscreen-lightbox pattern currently duplicated in the tools list |
| `src/routes/patrons/[id]/+page.server.ts` | Add `files` to the `checkouts.tool` include |
| `src/routes/patrons/[id]/+page.svelte` | New **Current Checkouts** card (`id="current-checkouts"`); link the Active Checkouts stat to it; trim history table |
| `src/routes/checkin/+page.server.ts` | **New** — load all active checkouts across patrons |
| `src/routes/checkin/+page.svelte` | **New** — global check-in list with thumbnail, patron, due date, overdue flag, filter box, Check In button |
| `src/routes/+layout.svelte` | Add **Check In** nav item next to Checkout (both nav blocks: desktop + mobile) |

---

## Design Decisions (settled)

- **`OVERDUE` status is a manual visible flag**, not driven by any job. Do not add overdue-status automation. Continue computing the overdue *badge* on the fly with `new Date(dueDate) < new Date()`.
- **"Active checkout" = `status !== 'RETURNED'`.** Filtering on `=== 'CHECKED_OUT'` would silently drop any row manually flagged `OVERDUE`.
- **Volume is low → keep `ConfirmModal`** on every check-in surface to prevent accidental returns. No inline one-click check-in.
- **Both `VOLUNTEER` and `ADMIN`** can use the new `/checkin` page (core operation, not admin-gated).
- **No new API.** Reuse `POST /api/checkin`.

---

## Task 1: Extract a reusable ImageLightbox component

The clickable-thumbnail + fullscreen-modal pattern currently lives inline in `src/routes/tools/+page.svelte` (thumbnail button at lines ~189–201, lightbox modal at ~239–260). Both new sections in this plan need the same thing, so extract it first.

**Files:**
- Create: `src/lib/components/ImageLightbox.svelte`
- Modify: `src/routes/tools/+page.svelte` (swap inline markup for the component — optional but recommended to avoid a third copy)

- [ ] **Step 1: Create the component**

It renders a thumbnail that opens a fullscreen lightbox on click. Props (Svelte 5 runes):

```svelte
<script lang="ts">
	let {
		fileId,
		alt = '',
		thumbClass = 'w-16 h-16 object-contain rounded-lg border border-gray-200'
	}: { fileId: number; alt?: string; thumbClass?: string } = $props()

	let open = $state(false)
</script>

<button type="button" onclick={() => (open = true)} class="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg">
	<img src="/api/files/{fileId}" {alt} class="{thumbClass} hover:opacity-90 transition-opacity cursor-pointer" />
</button>

{#if open}
	<div class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onclick={() => (open = false)}>
		<button type="button" onclick={() => (open = false)} class="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl font-light leading-none" aria-label="Close">&times;</button>
		<img src="/api/files/{fileId}" {alt} class="max-w-full max-h-full object-contain" onclick={(e) => e.stopPropagation()} />
	</div>
{/if}
```

- [ ] **Step 2 (optional):** Replace the inline thumbnail/lightbox in `src/routes/tools/+page.svelte` with `<ImageLightbox fileId={tool.files[0].id} alt={tool.name} thumbClass="w-24 h-24 ..." />` and remove the now-unused `selectedImage` state. Verify the tools page lightbox still works.

> **Svelte note:** Use the `svelte:svelte-file-editor` agent / Svelte MCP to author and validate this `.svelte` file.

---

## Task 2: Add `tool.files` to the patron-detail load

**Files:**
- Modify: `src/routes/patrons/[id]/+page.server.ts`

- [ ] **Step 1:** In the `checkouts.include.tool.include` block (currently just `{ category: true }`), add `files`:

```typescript
tool: {
	include: {
		category: true,
		files: { orderBy: { uploadedAt: 'desc' } }
	}
}
```

This makes `checkout.tool.files[0]` available for the thumbnail in Task 3.

---

## Task 3: Current Checkouts section + clickable stat on patron detail

**Files:**
- Modify: `src/routes/patrons/[id]/+page.svelte`

- [ ] **Step 1: Add a derived list of active checkouts.** Near the existing `activeCheckouts` count (lines 38–40), add:

```typescript
const currentCheckouts = $derived(
	data.patron.checkouts?.filter((c: { status: string }) => c.status !== 'RETURNED') ?? []
)
```

Keep the existing `activeCheckouts` count derived as-is (used by the stat).

- [ ] **Step 2: Make the Active Checkouts stat a jump link.** Wrap the stat block (lines 250–253) in an anchor to the new section:

```svelte
<a href="#current-checkouts" class="block text-center hover:bg-gray-50 rounded-lg transition-colors">
	<div class="text-2xl font-bold text-gray-900">{activeCheckouts}</div>
	<div class="text-sm text-gray-600">Active Checkouts</div>
</a>
```

- [ ] **Step 3: Add the Current Checkouts card** immediately above the Checkout History card (before line 308). Give it `id="current-checkouts"` and `class="... scroll-mt-24"` (so the sticky header doesn't cover it after the jump). Render `currentCheckouts` with: thumbnail via `<ImageLightbox>` when `checkout.tool.files?.length`, tool name (linked to `/tools/{id}`), checkout date, due date with the existing overdue treatment, and the **Check In** button. Reuse the existing `openCheckinModal(checkout.id, checkout.tool.name)` handler and `getCheckoutStatusColor` / `isOverdue` helpers unchanged.

  Empty state: `{#if currentCheckouts.length === 0}` → "No tools currently checked out."

- [ ] **Step 4: Trim the history table.** The **Checkout History** card stays as the full audit trail, but remove its per-row Check In button (lines 359–371) since the Current Checkouts card now owns that action — replace the Actions cell content with the `—` placeholder, or drop the Actions column entirely. History keeps showing all rows (including current) for the record.

- [ ] **Step 5:** Confirm the check-in modal still works from the new section and `invalidateAll()` refreshes both cards.

> **Svelte note:** author/validate via the Svelte MCP / `svelte:svelte-file-editor` agent.

---

## Task 4: Dedicated global Check-In page at `/checkin`

A library-style "what's currently out" page. No barcodes, so a client-side filter box stands in for scanning.

**Files:**
- Create: `src/routes/checkin/+page.server.ts`
- Create: `src/routes/checkin/+page.svelte`
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Load function.** Auth-guard like other protected loads (redirect to `/login` if `!locals.user`). Query every active checkout, soonest due first:

```typescript
const checkouts = await prisma.checkout.findMany({
	where: { status: { not: 'RETURNED' } },
	include: {
		tool: { include: { category: true, files: { orderBy: { uploadedAt: 'desc' } } } },
		patron: true
	},
	orderBy: { dueDate: 'asc' }
})
return { checkouts }
```

- [ ] **Step 2: Page UI.** A heading ("Check In") and a count of items currently out. A search `<input bind:value={filter}>` filtering client-side over patron name + tool name (`$derived`). For each row: `<ImageLightbox>` thumbnail (when the tool has files), tool name → `/tools/{id}`, patron name → `/patrons/{id}`, due date with overdue badge (reuse `new Date(dueDate) < new Date()`), and a **Check In** button.

- [ ] **Step 3: Check-in action.** Reuse the exact pattern from the patron page: `ConfirmModal` + `fetch('/api/checkin', { method: 'POST', body: JSON.stringify({ checkoutId }) })`, then `invalidateAll()` on success and a transient success toast/message. No new endpoint.

- [ ] **Step 4: Nav.** In `src/routes/+layout.svelte`, add a **Check In** link next to Checkout in *both* nav blocks (desktop ~line 49 and mobile ~line 68):

```svelte
<a href="/checkin" class:active={page.url.pathname.startsWith('/checkin')}> Check In </a>
```

- [ ] **Step 5:** Verify both roles can reach `/checkin`, the filter narrows the list, check-in removes the row after refresh, and the empty state ("No tools are currently checked out") renders.

> **Svelte note:** author/validate both `.svelte` files via the Svelte MCP / `svelte:svelte-file-editor` agent.

---

## Verification (whole feature)

- [ ] `pnpm build` succeeds with no type errors.
- [ ] Patron page: Active Checkouts stat scrolls to Current Checkouts; checking a tool in there moves it out of Current and updates the stat; History still lists it as `RETURNED`.
- [ ] `/checkin`: lists tools out across all patrons, overdue badge correct, thumbnail lightbox works, filter works, check-in via modal succeeds and the row disappears on refresh.
- [ ] Nav highlights "Check In" when on `/checkin`.
- [ ] No regression on the tools-list lightbox if Task 1 Step 2 was done.

## Out of scope / future

- Automatic `OVERDUE` status transitions and overdue reminders (`reminderSentAt`) — separate planned feature.
- Bulk / one-click check-in — intentionally omitted; low volume favors the confirm step.
