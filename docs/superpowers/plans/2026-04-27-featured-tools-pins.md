# Featured Tools Pins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to pin up to 6 tools to always appear first in the homepage "Popular Tools" section, with the existing checkout-frequency algorithm filling remaining slots.

**Architecture:** Pinned tool IDs are stored as a JSON array in the existing `system_settings` table under the key `featured_tool_pins`. The admin config page gets a new "Featured Tools" section with a typeahead search picker. The homepage load function reads pins first, fetches those tools, then runs the existing algorithm for remaining slots excluding pinned IDs.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, TypeScript, Prisma ORM (SQLite), Tailwind CSS v4

---

## File Map

| File | Change |
|------|--------|
| `src/lib/server/systemSettings.ts` | Add `FEATURED_PINS_KEY`, `parsePins()` |
| `src/routes/admin/config/+page.server.ts` | Add pins to load; add `savePins` named action |
| `src/routes/admin/config/+page.svelte` | Add Featured Tools card with typeahead picker |
| `src/routes/+page.server.ts` | Load pins, fetch pinned tools, exclude from algorithm |

---

## Task 1: Add FEATURED_PINS_KEY and parsePins to systemSettings.ts

**Files:**
- Modify: `src/lib/server/systemSettings.ts`

- [ ] **Step 1: Add the constant and helper**

Open `src/lib/server/systemSettings.ts` and append after the existing exports:

```typescript
export const FEATURED_PINS_KEY = 'featured_tool_pins'

export function parsePins(value: string | null | undefined): number[] {
	if (!value) return []
	try {
		const parsed = JSON.parse(value)
		if (!Array.isArray(parsed)) return []
		const ids = parsed.filter((v): v is number => typeof v === 'number' && Number.isInteger(v))
		return [...new Set(ids)].slice(0, 6)
	} catch {
		return []
	}
}
```

- [ ] **Step 2: Verify types**

```bash
pnpm check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/server/systemSettings.ts
git commit -m "feat: add FEATURED_PINS_KEY and parsePins to systemSettings"
```

---

## Task 2: Update admin config server — load pins + savePins action

**Files:**
- Modify: `src/routes/admin/config/+page.server.ts`

- [ ] **Step 1: Replace the file contents**

```typescript
import type { PageServerLoad, Actions } from './$types'
import { fail } from '@sveltejs/kit'
import prisma from '$lib/prisma'
import { logActivity } from '$lib/server/activityLog'
import {
	parseHours,
	DEFAULT_HOURS,
	LIBRARY_HOURS_KEY,
	parsePins,
	FEATURED_PINS_KEY
} from '$lib/server/systemSettings'

export const load: PageServerLoad = async () => {
	const [hoursSetting, pinsSetting] = await Promise.all([
		prisma.systemSetting.findUnique({ where: { key: LIBRARY_HOURS_KEY } }),
		prisma.systemSetting.findUnique({ where: { key: FEATURED_PINS_KEY } })
	])

	const pinnedIds = parsePins(pinsSetting?.value)
	const pinnedTools =
		pinnedIds.length > 0
			? await prisma.tool.findMany({
					where: { id: { in: pinnedIds } },
					select: { id: true, name: true }
				})
			: []

	return {
		hours: parseHours(hoursSetting?.value, DEFAULT_HOURS),
		pinnedTools
	}
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData()
		const raw = formData.get('hours')

		const hours = parseHours(raw as string)
		if (!Array.isArray(hours)) {
			return fail(400, { serverError: 'Invalid hours data.' })
		}

		try {
			await prisma.systemSetting.upsert({
				where: { key: LIBRARY_HOURS_KEY },
				create: { key: LIBRARY_HOURS_KEY, value: JSON.stringify(hours) },
				update: { value: JSON.stringify(hours) }
			})
			await logActivity({
				action: 'UPDATE_CONFIG',
				userId: locals.user?.id,
				payload: { key: LIBRARY_HOURS_KEY },
				success: true,
				response: { rowCount: hours.length }
			})
			return { success: true }
		} catch (e) {
			await logActivity({
				action: 'UPDATE_CONFIG',
				userId: locals.user?.id,
				payload: { key: LIBRARY_HOURS_KEY },
				success: false,
				response: { error: String(e) }
			})
			return fail(500, { serverError: 'Failed to save hours.' })
		}
	},

	savePins: async ({ request, locals }) => {
		const formData = await request.formData()
		const raw = formData.get('pins') as string
		const pins = parsePins(raw)

		try {
			await prisma.systemSetting.upsert({
				where: { key: FEATURED_PINS_KEY },
				create: { key: FEATURED_PINS_KEY, value: JSON.stringify(pins) },
				update: { value: JSON.stringify(pins) }
			})
			await logActivity({
				action: 'UPDATE_CONFIG',
				userId: locals.user?.id,
				payload: { key: FEATURED_PINS_KEY, count: pins.length },
				success: true,
				response: { pins }
			})
			return { pinsSuccess: true }
		} catch (e) {
			await logActivity({
				action: 'UPDATE_CONFIG',
				userId: locals.user?.id,
				payload: { key: FEATURED_PINS_KEY },
				success: false,
				response: { error: String(e) }
			})
			return fail(500, { pinsServerError: 'Failed to save pinned tools.' })
		}
	}
}
```

- [ ] **Step 2: Verify types**

```bash
pnpm check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/admin/config/+page.server.ts
git commit -m "feat: add pins load and savePins action to admin config"
```

---

## Task 3: Update admin config Svelte UI — Featured Tools section

**Files:**
- Modify: `src/routes/admin/config/+page.svelte`

- [ ] **Step 1: Replace the file contents**

```svelte
<script lang="ts">
	import type { PageData, ActionData } from './$types'
	import type { HourRow } from '$lib/server/systemSettings'
	import { enhance } from '$app/forms'

	const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

	let { data, form }: { data: PageData; form: ActionData } = $props()

	// --- Hours state ---
	let rows = $state<HourRow[]>(data.hours.map((h: HourRow) => ({ ...h })))
	let submitting = $state(false)

	function addRow() {
		rows.push({ day: 'Monday', open: '09:00', close: '17:00', active: true })
	}

	function removeRow(i: number) {
		rows.splice(i, 1)
	}

	// --- Pins state ---
	let pinnedTools = $state<{ id: number; name: string }[]>(
		data.pinnedTools.map((t) => ({ ...t }))
	)
	let pinsSubmitting = $state(false)
	let searchQuery = $state('')
	let searchResults = $state<{ id: number; name: string }[]>([])

	let debounceTimer: ReturnType<typeof setTimeout>

	async function handleSearch(query: string) {
		clearTimeout(debounceTimer)
		if (!query.trim()) {
			searchResults = []
			return
		}
		debounceTimer = setTimeout(async () => {
			const res = await fetch(`/api/tools/search?search=${encodeURIComponent(query)}`)
			const json = await res.json()
			const pinnedIds = pinnedTools.map((t) => t.id)
			searchResults = (json.tools as { id: number; name: string }[])
				.filter((t) => !pinnedIds.includes(t.id))
				.slice(0, 8)
		}, 250)
	}

	function addPin(tool: { id: number; name: string }) {
		if (pinnedTools.length >= 6) return
		if (pinnedTools.some((t) => t.id === tool.id)) return
		pinnedTools.push({ id: tool.id, name: tool.name })
		searchQuery = ''
		searchResults = []
	}

	function removePin(id: number) {
		const idx = pinnedTools.findIndex((t) => t.id === id)
		if (idx !== -1) pinnedTools.splice(idx, 1)
	}

	function handleBlur() {
		setTimeout(() => {
			searchResults = []
		}, 150)
	}
</script>

<div class="space-y-6">
	<!-- Library Hours -->
	<div class="bg-white rounded-xl shadow-sm p-8">
		<h2 class="text-xl font-semibold text-gray-900 mb-6">Library Hours</h2>

		{#if form?.serverError}
			<div class="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
				{form.serverError}
			</div>
		{/if}
		{#if form?.success}
			<div class="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-green-700 text-sm">
				Hours saved successfully.
			</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				submitting = true
				return async ({ update }) => {
					await update({ reset: false })
					if (form?.success) {
						rows = data.hours.map((h: HourRow) => ({ ...h }))
					}
					submitting = false
				}
			}}
		>
			<input type="hidden" name="hours" value={JSON.stringify(rows)} />

			<div class="overflow-x-auto mb-6">
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-gray-500 border-b border-gray-200">
							<th class="pb-3 pr-4 font-medium">Day</th>
							<th class="pb-3 pr-4 font-medium">Open</th>
							<th class="pb-3 pr-4 font-medium">Close</th>
							<th class="pb-3 pr-4 font-medium">Active</th>
							<th class="pb-3"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each rows as row, i (i)}
							<tr>
								<td class="py-3 pr-4">
									<select
										bind:value={row.day}
										class="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										{#each DAYS as day (day)}
											<option value={day}>{day}</option>
										{/each}
									</select>
								</td>
								<td class="py-3 pr-4">
									<input
										type="time"
										bind:value={row.open}
										class="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</td>
								<td class="py-3 pr-4">
									<input
										type="time"
										bind:value={row.close}
										class="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</td>
								<td class="py-3 pr-4">
									<input
										type="checkbox"
										bind:checked={row.active}
										class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
								</td>
								<td class="py-3">
									<button
										type="button"
										onclick={() => removeRow(i)}
										class="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
									>
										Remove
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="flex items-center justify-between">
				<button
					type="button"
					onclick={addRow}
					class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
				>
					+ Add Row
				</button>
				<button
					type="submit"
					disabled={submitting}
					class="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
				>
					{submitting ? 'Saving…' : 'Save'}
				</button>
			</div>
		</form>
	</div>

	<!-- Featured Tools -->
	<div class="bg-white rounded-xl shadow-sm p-8">
		<h2 class="text-xl font-semibold text-gray-900 mb-2">Featured Tools</h2>
		<p class="text-sm text-gray-500 mb-6">
			Pinned tools always appear first in the "Popular Tools" section on the homepage. Remaining
			slots fill automatically by checkout frequency.
		</p>

		{#if form?.pinsServerError}
			<div class="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
				{form.pinsServerError}
			</div>
		{/if}
		{#if form?.pinsSuccess}
			<div class="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-green-700 text-sm">
				Featured tools saved successfully.
			</div>
		{/if}

		<form
			method="POST"
			action="?/savePins"
			use:enhance={() => {
				pinsSubmitting = true
				return async ({ update }) => {
					await update({ reset: false })
					if (form?.pinsSuccess) {
						pinnedTools = data.pinnedTools.map((t) => ({ ...t }))
					}
					pinsSubmitting = false
				}
			}}
		>
			<input type="hidden" name="pins" value={JSON.stringify(pinnedTools.map((t) => t.id))} />

			{#if pinnedTools.length > 0}
				<div class="flex flex-wrap gap-2 mb-4">
					{#each pinnedTools as tool (tool.id)}
						<span
							class="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-full"
						>
							{tool.name}
							<button
								type="button"
								onclick={() => removePin(tool.id)}
								class="text-blue-400 hover:text-blue-700 leading-none"
								aria-label="Remove {tool.name}"
							>×</button>
						</span>
					{/each}
				</div>
			{/if}

			{#if pinnedTools.length < 6}
				<div class="relative mb-6">
					<input
						type="text"
						bind:value={searchQuery}
						oninput={() => handleSearch(searchQuery)}
						onblur={handleBlur}
						placeholder="Search for a tool to pin…"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					{#if searchResults.length > 0}
						<ul
							class="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
						>
							{#each searchResults as result (result.id)}
								<li>
									<button
										type="button"
										onclick={() => addPin(result)}
										class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
									>
										{result.name}
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{:else}
				<p class="text-sm text-gray-400 mb-6">Maximum 6 tools pinned.</p>
			{/if}

			<div class="flex justify-end">
				<button
					type="submit"
					disabled={pinsSubmitting}
					class="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
				>
					{pinsSubmitting ? 'Saving…' : 'Save'}
				</button>
			</div>
		</form>
	</div>
</div>
```

- [ ] **Step 2: Verify types**

```bash
pnpm check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/admin/config/+page.svelte
git commit -m "feat: add Featured Tools pin picker to admin config page"
```

---

## Task 4: Update homepage load to use pinned tools

**Files:**
- Modify: `src/routes/+page.server.ts`

- [ ] **Step 1: Replace the file contents**

```typescript
import type { PageServerLoad } from './$types'
import prisma from '$lib/prisma'
import { parseHours, LIBRARY_HOURS_KEY, parsePins, FEATURED_PINS_KEY } from '$lib/server/systemSettings'

export const load: PageServerLoad = async ({ locals }) => {
	const [hoursSetting, pinsSetting] = await Promise.all([
		prisma.systemSetting.findUnique({ where: { key: LIBRARY_HOURS_KEY } }),
		prisma.systemSetting.findUnique({ where: { key: FEATURED_PINS_KEY } })
	])

	const pinnedIds = parsePins(pinsSetting?.value)
	const remainingSlots = 6 - pinnedIds.length

	const [pinnedTools, frequentTools] = await Promise.all([
		pinnedIds.length > 0
			? prisma.tool.findMany({
					where: { id: { in: pinnedIds } },
					include: {
						files: { take: 1, orderBy: { id: 'asc' } },
						category: true
					}
				})
			: Promise.resolve([]),
		prisma.tool.findMany({
			where: {
				files: { some: {} },
				checkouts: { some: {} },
				id: { notIn: pinnedIds }
			},
			include: {
				files: { take: 1, orderBy: { id: 'asc' } },
				category: true
			},
			orderBy: { checkouts: { _count: 'desc' } },
			take: remainingSlots
		})
	])

	let algorithmTools = frequentTools

	if (frequentTools.length < remainingSlots) {
		const seenIds = [...pinnedIds, ...frequentTools.map((t) => t.id)]
		const fallback = await prisma.tool.findMany({
			where: { files: { some: {} }, id: { notIn: seenIds } },
			include: {
				files: { take: 1, orderBy: { id: 'asc' } },
				category: true
			},
			take: remainingSlots - frequentTools.length,
			orderBy: { dateAdded: 'desc' }
		})
		algorithmTools = [...frequentTools, ...fallback]
	}

	return {
		featuredTools: [...pinnedTools, ...algorithmTools],
		hours: parseHours(hoursSetting?.value),
		user: locals.user
	}
}
```

- [ ] **Step 2: Verify types**

```bash
pnpm check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/+page.server.ts
git commit -m "feat: load pinned tools first on homepage featured section"
```

---

## Task 5: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Test the admin UI**

1. Navigate to `/admin/config`
2. Scroll to the "Featured Tools" section
3. Type a tool name in the search box — confirm dropdown appears
4. Click a result — confirm it appears as a chip
5. Add a second tool — confirm both chips show
6. Click × on one chip — confirm it is removed
7. Click Save — confirm green success banner appears
8. Refresh the page — confirm pinned tools are still shown

- [ ] **Step 3: Test the homepage**

1. Navigate to `/` (homepage)
2. Confirm pinned tools appear first in the "Popular Tools" grid
3. Back in admin, remove all pins and save
4. Refresh homepage — confirm it falls back to algorithm-only tools
