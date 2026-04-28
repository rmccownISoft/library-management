<script lang="ts">
	import type { PageData, ActionData } from './$types'
	import type { HourRow } from '$lib/server/systemSettings'
	import { enhance } from '$app/forms'

	const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

	let { data, form }: { data: PageData; form: ActionData } = $props()

	let rows = $state<HourRow[]>(data.hours.map((h: HourRow) => ({ ...h })))
	let submitting = $state(false)

	function addRow() {
		rows.push({ day: 'Monday', open: '09:00', close: '17:00', active: true })
	}

	function removeRow(i: number) {
		rows.splice(i, 1)
	}
</script>

<div class="space-y-6">
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
</div>
