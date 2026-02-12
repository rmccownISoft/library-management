<script lang="ts">
	import type { Snippet } from 'svelte'

	let {
		title,
		message,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		confirmButtonClass = 'bg-blue-600 hover:bg-blue-700',
		onConfirm,
		onCancel,
		children
	}: {
		title: string
		message?: string
		confirmText?: string
		cancelText?: string
		confirmButtonClass?: string
		onConfirm: () => void
		onCancel: () => void
		children?: Snippet
	} = $props()

	let isProcessing = $state(false)

	async function handleConfirm() {
		isProcessing = true
		try {
			await onConfirm()
		} finally {
			isProcessing = false
		}
	}

	function handleCancel() {
		if (!isProcessing) {
			onCancel()
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleCancel()
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && !isProcessing) {
			handleCancel()
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Modal Backdrop -->
<div 
	class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
	onclick={handleBackdropClick}
	role="dialog"
	aria-modal="true"
	aria-labelledby="modal-title"
>
	<!-- Modal Content -->
	<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
		<!-- Header -->
		<h2 id="modal-title" class="text-xl font-bold text-gray-900 mb-4">
			{title}
		</h2>

		<!-- Body -->
		<div class="mb-6">
			{#if children}
				{@render children()}
			{:else if message}
				<p class="text-gray-700">{message}</p>
			{/if}
		</div>

		<!-- Actions -->
		<div class="flex justify-end gap-3">
			<button
				type="button"
				onclick={handleCancel}
				disabled={isProcessing}
				class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{cancelText}
			</button>
			<button
				type="button"
				onclick={handleConfirm}
				disabled={isProcessing}
				class="px-4 py-2 {confirmButtonClass} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
			>
				{#if isProcessing}
					<svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Processing...
				{:else}
					{confirmText}
				{/if}
			</button>
		</div>
	</div>
</div>
