<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	interface LogEntry {
		id: number;
		action: string;
		userId: number | null;
		payload: string;
		success: boolean;
		response: string | null;
		createdAt: Date;
		user: { name: string } | null;
	}

	interface Props {
		data: {
			logs: LogEntry[];
			total: number;
			page: number;
			pageSize: number;
		};
	}

	let { data }: Props = $props();

	let expandedId = $state<number | null>(null);

	function toggleExpanded(id: number) {
		expandedId = expandedId === id ? null : id;
	}

	function formatTime(date: Date): string {
		return new Date(date).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatAction(action: string): string {
		return action
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}

	function actionColorClass(action: string): string {
		const upper = action.toUpperCase();
		if (upper.includes('PATRON')) return 'bg-blue-100 text-blue-800';
		if (upper.includes('TOOL')) return 'bg-purple-100 text-purple-800';
		if (upper.includes('CHECKOUT')) return 'bg-green-100 text-green-800';
		if (upper.includes('CHECKIN')) return 'bg-orange-100 text-orange-800';
		return 'bg-gray-100 text-gray-700';
	}

	function prettyJson(raw: string | null): string {
		if (!raw) return '';
		try {
			return JSON.stringify(JSON.parse(raw), null, 2);
		} catch {
			return raw;
		}
	}

	const totalPages = $derived(Math.ceil(data.total / data.pageSize));
	const currentPage = $derived(data.page);
	const rangeStart = $derived((currentPage - 1) * data.pageSize + 1);
	const rangeEnd = $derived(Math.min(currentPage * data.pageSize, data.total));

	function navigateToPage(p: number) {
		const url = new URL(page.url);
		url.searchParams.set('page', String(p));
		goto(url.toString());
	}
</script>

<div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
	<!-- Table header -->
	<div class="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
		<h2 class="text-xl font-semibold text-gray-900">Activity Log</h2>
		{#if data.total > 0}
			<span class="text-sm text-gray-500">
				Showing {rangeStart}–{rangeEnd} of {data.total} entries
			</span>
		{/if}
	</div>

	{#if data.logs.length === 0}
		<div class="p-8 text-center text-gray-500">
			<p>No activity recorded yet.</p>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-gray-50 border-b border-gray-200">
					<tr>
						<th class="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Time</th>
						<th class="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
						<th class="text-left px-4 py-3 font-semibold text-gray-700">User</th>
						<th class="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
						<th class="text-right px-4 py-3 font-semibold text-gray-700">Details</th>
					</tr>
				</thead>
				<tbody>
					{#each data.logs as log (log.id)}
						<tr class="border-b border-gray-100 hover:bg-gray-50">
							<td class="px-4 py-3 text-gray-600 whitespace-nowrap">
								{formatTime(log.createdAt)}
							</td>
							<td class="px-4 py-3">
								<span class="inline-block px-2 py-0.5 rounded text-xs font-medium {actionColorClass(log.action)}">
									{formatAction(log.action)}
								</span>
							</td>
							<td class="px-4 py-3 text-gray-700">
								{log.user?.name ?? 'Unknown'}
							</td>
							<td class="px-4 py-3">
								{#if log.success}
									<span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
										Success
									</span>
								{:else}
									<span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
										Failed
									</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right">
								<button
									type="button"
									onclick={() => toggleExpanded(log.id)}
									class="text-blue-600 hover:text-blue-800 font-medium text-sm"
								>
									{expandedId === log.id ? 'Hide' : 'View'}
								</button>
							</td>
						</tr>
						{#if expandedId === log.id}
							<tr class="border-b border-gray-100 bg-gray-50">
								<td colspan="5" class="px-4 py-4">
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
												Payload
											</p>
											<pre class="bg-gray-900 text-green-300 text-xs rounded p-3 overflow-x-auto whitespace-pre-wrap break-words">{prettyJson(log.payload)}</pre>
										</div>
										{#if log.response}
											<div>
												<p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
													Response
												</p>
												<pre class="bg-gray-900 text-green-300 text-xs rounded p-3 overflow-x-auto whitespace-pre-wrap break-words">{prettyJson(log.response)}</pre>
											</div>
										{/if}
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
				<span class="text-sm text-gray-500">
					Showing {rangeStart}–{rangeEnd} of {data.total} entries
				</span>
				<div class="flex gap-2">
					<button
						type="button"
						onclick={() => navigateToPage(currentPage - 1)}
						disabled={currentPage <= 1}
						class="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
					>
						Prev
					</button>
					<button
						type="button"
						onclick={() => navigateToPage(currentPage + 1)}
						disabled={currentPage >= totalPages}
						class="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
					>
						Next
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>
