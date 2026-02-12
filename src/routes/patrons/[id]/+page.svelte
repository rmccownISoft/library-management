<script lang="ts">
	import type { PageData } from './$types'
	import ConfirmModal from '$lib/components/ConfirmModal.svelte'
	import { invalidateAll } from '$app/navigation'

	let { data } = $props<{ data: PageData }>()
	
	// Check-in modal state
	let showCheckinModal = $state(false)
	let selectedCheckout = $state<{ id: number; toolName: string } | null>(null)
	let checkinError = $state<string | null>(null)
	let checkinSuccess = $state<string | null>(null)
	
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

	// Calculate active checkouts
	const activeCheckouts = $derived(
		data.patron.checkouts?.filter(c => c.status === 'CHECKED_OUT').length || 0
	)

	// Get checkout status color
	function getCheckoutStatusColor(status: string) {
		switch (status) {
			case 'CHECKED_OUT': return 'bg-blue-100 text-blue-800'
			case 'RETURNED': return 'bg-green-100 text-green-800'
			case 'OVERDUE': return 'bg-red-100 text-red-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	// Format checkout status text
	function formatStatus(status: string) {
		return status.replace('_', ' ')
	}

	// Open check-in modal
	function openCheckinModal(checkoutId: number, toolName: string) {
		selectedCheckout = { id: checkoutId, toolName }
		showCheckinModal = true
		checkinError = null
		checkinSuccess = null
	}

	// Close check-in modal
	function closeCheckinModal() {
		showCheckinModal = false
		selectedCheckout = null
	}

	// Handle check-in confirmation
	async function handleCheckin() {
		if (!selectedCheckout) return

		try {
			const response = await fetch('/api/checkin', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					checkoutId: selectedCheckout.id
				})
			})

			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || 'Failed to check in item')
			}

			// Show success message
			checkinSuccess = result.message
			if (result.wasOverdue) {
				checkinSuccess += ' (Item was overdue)'
			}

			// Close modal
			closeCheckinModal()

			// Refresh the page data
			await invalidateAll()

			// Clear success message after 5 seconds
			setTimeout(() => {
				checkinSuccess = null
			}, 5000)

		} catch (error) {
			checkinError = error instanceof Error ? error.message : 'Failed to check in item'
		}
	}

	// Determine if checkout is overdue
	function isOverdue(dueDate: Date | string) {
		return new Date(dueDate) < new Date()
	}
</script>

<svelte:head>
	<title>Patron: {data.patron.firstName} {data.patron.lastName}</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-8">
	<!-- Success Message -->
	{#if checkinSuccess}
		<div class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
			<div class="flex items-center">
				<svg class="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
				</svg>
				<p class="text-green-800 font-medium">{checkinSuccess}</p>
			</div>
		</div>
	{/if}

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
				{#if data.patron.active && !data.patron.blocked}
					<a 
						href="/checkout?patronId={data.patron.id}"
						class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
					>
						Checkout Tools
					</a>
				{/if}
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
				<div class="text-2xl font-bold text-gray-900">{activeCheckouts}</div>
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

	<!-- Checkout History -->
	<div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4 text-gray-900">Checkout History</h2>
		
		{#if data.patron.checkouts && data.patron.checkouts.length > 0}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-200">
							<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Tool</th>
							<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Category</th>
							<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Checked Out</th>
							<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Due Date</th>
							<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Returned</th>
							<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
							<th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.patron.checkouts as checkout}
							<tr class="border-b border-gray-100 hover:bg-gray-50">
								<td class="py-3 px-4">
									<a href="/tools/{checkout.tool.id}" class="text-blue-600 hover:underline font-medium">
										{checkout.tool.name}
									</a>
								</td>
								<td class="py-3 px-4 text-sm text-gray-600">
									{checkout.tool.category.name}
								</td>
								<td class="py-3 px-4 text-sm text-gray-600">
									{formatDate(checkout.checkoutDate)}
								</td>
								<td class="py-3 px-4 text-sm">
									<span class={isOverdue(checkout.dueDate) && checkout.status === 'CHECKED_OUT' ? 'text-red-600 font-semibold' : 'text-gray-600'}>
										{formatDate(checkout.dueDate)}
									</span>
									{#if isOverdue(checkout.dueDate) && checkout.status === 'CHECKED_OUT'}
										<span class="ml-1 text-red-600 text-xs">(Overdue)</span>
									{/if}
								</td>
								<td class="py-3 px-4 text-sm text-gray-600">
									{#if checkout.checkinDate}
										{formatDate(checkout.checkinDate)}
									{:else}
										<span class="text-gray-400">—</span>
									{/if}
								</td>
								<td class="py-3 px-4">
									<span class="px-2 py-1 rounded-full text-xs font-medium {getCheckoutStatusColor(checkout.status)}">
										{formatStatus(checkout.status)}
									</span>
								</td>
								<td class="py-3 px-4">
									{#if checkout.status === 'CHECKED_OUT'}
										<button
											type="button"
											onclick={() => openCheckinModal(checkout.id, checkout.tool.name)}
											class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
										>
											Check In
										</button>
									{:else}
										<span class="text-gray-400 text-sm">—</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="text-center py-8 text-gray-500">
				<p>No checkout history yet</p>
			</div>
		{/if}
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

<!-- Check-in Confirmation Modal -->
{#if showCheckinModal && selectedCheckout}
	<ConfirmModal
		title="Confirm Check-In"
		confirmText="Check In"
		cancelText="Cancel"
		confirmButtonClass="bg-green-600 hover:bg-green-700"
		onConfirm={handleCheckin}
		onCancel={closeCheckinModal}
	>
		<div class="space-y-3">
			<p class="text-gray-700">
				Are you sure you want to check in the following tool?
			</p>
			
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
				<p class="font-semibold text-gray-900">{selectedCheckout.toolName}</p>
			</div>

			{#if checkinError}
				<div class="bg-red-50 border border-red-200 rounded-lg p-3">
					<p class="text-red-800 text-sm">{checkinError}</p>
				</div>
			{/if}
			
			<p class="text-sm text-gray-600">
				This action cannot be undone.
			</p>
		</div>
	</ConfirmModal>
{/if}
