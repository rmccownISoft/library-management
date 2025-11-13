<script lang="ts">
    import type { PageData } from './$types'
    import { enhance } from '$app/forms'

    let { data } = $props<{ data: PageData }>();
	let showDeleteConfirm = $state(false);
	let isDeleting = $state(false);
	
	// Format date helper
	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

    // Get status badge color
	function getStatusColor(status: string) {
		const colors = {
			GOOD: 'bg-green-100 text-green-800',
			NEEDS_REPAIR: 'bg-yellow-100 text-yellow-800',
			DAMAGED: 'bg-red-100 text-red-800',
			LOST: 'bg-gray-200 text-gray-700'
		};
		return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
	}


</script>

<div class="max-w-4xl mx-auto p-8">
	<!-- Header -->
	<div class="mb-8">
		<a href="/tools" class="text-blue-600 hover:underline mb-4 inline-block">
			← Back to Tools
		</a>
		
		<div class="flex justify-between items-start">
			<div>
				<h1 class="text-3xl font-bold text-gray-900 mb-2">
					{data.tool.name}
				</h1>
				<span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(data.tool.conditionStatus)}">
					{data.tool.conditionStatus.replace('_', ' ')}
				</span>
			</div>
			
			<!-- Action Buttons (Admin Only - hide with permissions later) -->
			<div class="flex gap-2">
				<a 
					href="/tools/{data.tool.id}/edit"
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					Edit Tool
				</a>
				<button
					onclick={() => showDeleteConfirm = true}
					class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
				>
					Delete
				</button>
			</div>
		</div>
	</div>

	<!-- Tool Information Card -->
	<div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4 text-gray-900">Tool Information</h2>
		
		<div class="grid grid-cols-2 gap-4">
			<div>
				<p class="text-sm text-gray-600">Category</p>
				<p class="font-medium text-gray-900">{data.tool.category.name}</p>
			</div>
			
			<div>
				<p class="text-sm text-gray-600">Quantity Available</p>
				<p class="font-medium text-gray-900">{data.tool.quantity}</p>
			</div>
			
			{#if data.tool.donor}
				<div>
					<p class="text-sm text-gray-600">Donated By</p>
					<p class="font-medium text-gray-900">{data.tool.donor}</p>
				</div>
			{/if}
			
			<div>
				<p class="text-sm text-gray-600">Condition Status</p>
				<p class="font-medium text-gray-900">{data.tool.conditionStatus.replace('_', ' ')}</p>
			</div>
		</div>
		
		{#if data.tool.description}
			<div class="mt-4 pt-4 border-t border-gray-200">
				<p class="text-sm text-gray-600 mb-1">Description</p>
				<p class="text-gray-900">{data.tool.description}</p>
			</div>
		{/if}
	</div>

	<!-- Image Gallery -->
	{#if data.tool.files && data.tool.files.length > 0}
		<div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
			<h2 class="text-xl font-semibold mb-4 text-gray-900">Images</h2>
			<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
				{#each data.tool.files as file}
					<img 
						src="/uploads/{file.filePath}" 
						alt={file.fileName}
						class="w-full h-48 object-cover rounded-lg border border-gray-200"
					/>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Damage Reports -->
	{#if data.tool.damageReports && data.tool.damageReports.length > 0}
		<div class="bg-white border border-gray-200 rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4 text-gray-900">Damage History</h2>
			<div class="space-y-4">
				{#each data.tool.damageReports as report}
					<div class="border-l-4 border-red-500 pl-4 py-2">
						<p class="text-gray-900 mb-2">{report.notes}</p>
						<p class="text-sm text-gray-600">
							Reported on {formatDate(report.reportedAt)}
							{#if report.reporter}
								by {report.reporter.name}
							{/if}
						</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Delete Confirmation Modal -->
	{#if showDeleteConfirm}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
				<h3 class="text-xl font-semibold mb-4 text-gray-900">Confirm Delete</h3>
				<p class="text-gray-700 mb-6">
					Are you sure you want to delete "{data.tool.name}"? This action cannot be undone.
				</p>
				
				<form 
					method="POST" 
					action="?/delete"
					use:enhance={() => {
						isDeleting = true;
						return async ({ update }) => {
							await update();
						};
					}}
				>
					<div class="flex gap-3 justify-end">
						<button
							type="button"
							onclick={() => showDeleteConfirm = false}
							disabled={isDeleting}
							class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isDeleting}
							class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
						>
							{isDeleting ? 'Deleting...' : 'Yes, Delete'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>