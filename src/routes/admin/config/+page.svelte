<script lang="ts">
	import type { PageData, ActionData } from './$types'
	import type { HourRow } from '$lib/server/systemSettings'
	import { MAX_FEATURED_PINS } from '$lib/constants'
	import { onDestroy } from 'svelte'
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
	let pinnedTools = $state<{ id: number; name: string }[]>(data.pinnedTools.map((t) => ({ ...t })))
	let pinsSubmitting = $state(false)
	let searchQuery = $state('')
	type SearchResult = { id: number; name: string; category: { name: string } | null }
	let searchResults = $state<SearchResult[]>([])

	let debounceTimer: ReturnType<typeof setTimeout>
	onDestroy(() => clearTimeout(debounceTimer))

	async function handleSearch(query: string) {
		clearTimeout(debounceTimer)
		if (!query.trim()) {
			searchResults = []
			return
		}
		debounceTimer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/tools/search?search=${encodeURIComponent(query)}`)
				const json = await res.json()
				const pinnedIds = pinnedTools.map((t) => t.id)
				searchResults = (json.tools as SearchResult[])
					.filter((t) => !pinnedIds.includes(t.id))
					.slice(0, 8)
			} catch {
				searchResults = []
			}
		}, 250)
	}

	function addPin(tool: { id: number; name: string }) {
		if (pinnedTools.length >= MAX_FEATURED_PINS) return
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
			action="?/saveHours"
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

			{#if pinnedTools.length < MAX_FEATURED_PINS}
				<div class="relative mb-6">
					<input
						type="text"
						bind:value={searchQuery}
						oninput={() => handleSearch(searchQuery)}
						onblur={handleBlur}
						placeholder="Search for a tool to pin…"
						role="combobox"
						aria-expanded={searchResults.length > 0}
						aria-autocomplete="list"
						aria-controls="pin-search-results"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					{#if searchResults.length > 0}
						<ul
							id="pin-search-results"
							role="listbox"
							class="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
						>
							{#each searchResults as result (result.id)}
								<li role="option" aria-selected="false">
									<button
										type="button"
										onclick={() => addPin(result)}
										class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
									>
										{result.name}{#if result.category} · <span class="text-gray-400">{result.category.name}</span>{/if}
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
