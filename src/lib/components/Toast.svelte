<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';

	// Get toasts reactively
	const toasts = $derived(toastStore.items);

	function getToastStyles(type: 'success' | 'error' | 'info' | 'warning') {
		switch (type) {
			case 'success':
				return 'bg-green-50 border-green-200 text-green-800';
			case 'error':
				return 'bg-red-50 border-red-200 text-red-800';
			case 'warning':
				return 'bg-yellow-50 border-yellow-200 text-yellow-800';
			case 'info':
				return 'bg-blue-50 border-blue-200 text-blue-800';
		}
	}

	function getIcon(type: 'success' | 'error' | 'info' | 'warning') {
		switch (type) {
			case 'success':
				return '✓';
			case 'error':
				return '✗';
			case 'warning':
				return '⚠';
			case 'info':
				return 'ℹ';
		}
	}
</script>

<!-- Toast Container -->
<div class="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
	{#each toasts as toast (toast.id)}
		<div
			class="pointer-events-auto animate-slide-in-right flex items-start gap-3 p-4 border rounded-lg shadow-lg max-w-md {getToastStyles(toast.type)}"
			role="alert"
		>
			<span class="text-lg font-bold">{getIcon(toast.type)}</span>
			<div class="flex-1 text-sm font-medium">{toast.message}</div>
			<button
				type="button"
				onclick={() => toastStore.remove(toast.id)}
				class="text-current opacity-60 hover:opacity-100 transition-opacity"
				aria-label="Close notification"
			>
				<svg
					class="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					></path>
				</svg>
			</button>
		</div>
	{/each}
</div>

<style>
	@keyframes slide-in-right {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.animate-slide-in-right {
		animation: slide-in-right 0.3s ease-out;
	}
</style>
