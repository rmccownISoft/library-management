<script lang="ts">
	import type { PageData } from './$types'

	let { data } = $props<{ data: PageData }>()
	
	// Format date helper
	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	}

	// Get status badge color
	function getStatusColor(active: boolean, blocked: boolean) {
		if (blocked) return 'bg-red-100 text-red-800'
		if (!active) return 'bg-gray-100 text-gray-800'
		return 'bg-green-100 text-green-800'
	}

	// Get status text
	function getStatusText(active: boolean, blocked: boolean) {
		if (blocked) return 'Blocked'
		if (!active) return 'Inactive'
		return 'Active'
	}
</script>

<svelte:head>
	<title>Patron: {data.patron.firstName} {data.patron.lastName}</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-8">
	<!-- Header -->
	<div class="mb-8">
		<a href="/patrons" class="text-blue-600 hover:underline mb-4 inline-block">
			← Back to Patrons
		</a>
		
		<div class="flex justify-between items-start">
			<div>
				<h1 class="text-3xl font-bold text-gray-900 mb-2">
					{data.patron.firstName} {data.patron.lastName}
				</h1>
				<span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(data.patron.active, data.patron.blocked)}">
					{getStatusText(data.patron.active, data.patron.blocked)}
				</span>
			</div>
			
			<!-- Action Buttons -->
			<div class="flex gap-2">
				<a 
					href="/patrons/{data.patron.id}/edit"
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					Edit Patron
				</a>
			</div>
		</div>
	</div>

	<!-- Blocked Warning Banner -->
	{#if data.patron.blocked}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
			<div class="flex items-center">
				<svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
				</svg>
				<p class="text-red-800 font-medium">This patron is blocked from checking out tools</p>
			</div>
		</div>
	{/if}

	<!-- Patron Information Card -->
	<div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4 text-gray-900">Contact Information</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Contact Methods -->
			<div class="space-y-4">
				{#if data.patron.email}
					<div>
						<p class="text-sm text-gray-600">Email Address</p>
						<p class="font-medium text-gray-900">
							<a href="mailto:{data.patron.email}" class="text-blue-600 hover:underline">
								{data.patron.email}
							</a>
						</p>
					</div>
				{/if}
				
				{#if data.patron.phone}
					<div>
						<p class="text-sm text-gray-600">Phone Number</p>
						<p class="font-medium text-gray-900">
							<a href="tel:{data.patron.phone}" class="text-blue-600 hover:underline">
								{data.patron.phone}
							</a>
						</p>
					</div>
				{/if}
			</div>
			
			<!-- Mailing Address -->
			<div>
				<p class="text-sm text-gray-600 mb-2">Mailing Address</p>
				<div class="font-medium text-gray-900">
					<p>{data.patron.mailingStreet}</p>
					<p>{data.patron.mailingCity}, {data.patron.mailingState} {data.patron.mailingZipcode}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Statistics Card -->
	<div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4 text-gray-900">Statistics</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="text-center">
				<div class="text-2xl font-bold text-gray-900">{data.patron.overdueCount}</div>
				<div class="text-sm text-gray-600">Overdue Items</div>
			</div>
			
			<div class="text-center">
				<div class="text-2xl font-bold text-gray-900">{data.patron.damageCount}</div>
				<div class="text-sm text-gray-600">Damage Reports</div>
			</div>
			
			<div class="text-center">
				<div class="text-2xl font-bold text-gray-900">0</div>
				<div class="text-sm text-gray-600">Active Checkouts</div>
			</div>
		</div>
	</div>

	<!-- Agreement Files -->
	{#if data.patron.files && data.patron.files.length > 0}
		<div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
			<h2 class="text-xl font-semibold mb-4 text-gray-900">Agreement Files</h2>
			<div class="space-y-3">
				{#each data.patron.files as file}
					<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
						<div>
							<p class="font-medium text-gray-900">{file.fileName}</p>
							{#if file.label}
								<p class="text-sm text-gray-600">{file.label}</p>
							{/if}
							<p class="text-sm text-gray-500">Uploaded {formatDate(file.uploadedAt)}</p>
						</div>
						<a 
							href="/api/files/{file.id}"
							target="_blank"
							class="px-3 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
						>
							Download
						</a>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Checkout History Placeholder -->
	<div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4 text-gray-900">Checkout History</h2>
		<div class="text-center py-8 text-gray-500">
			<p>Checkout history will be displayed here once the checkout system is implemented.</p>
		</div>
	</div>

	<!-- Account Details -->
	<div class="bg-white border border-gray-200 rounded-lg p-6">
		<h2 class="text-xl font-semibold mb-4 text-gray-900">Account Details</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div>
				<p class="text-sm text-gray-600">Created</p>
				<p class="font-medium text-gray-900">{formatDate(data.patron.createdAt)}</p>
			</div>
			
			<div>
				<p class="text-sm text-gray-600">Last Updated</p>
				<p class="font-medium text-gray-900">{formatDate(data.patron.updatedAt)}</p>
			</div>
		</div>
	</div>
</div>