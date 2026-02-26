<script lang="ts">
	// In Svelte 5, error pages receive status and error via props instead of using stores
	let { status, error }: { 
		status: number;
		error: App.Error | null;
	} = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
	<div class="max-w-md w-full text-center">
		<div class="mb-8">
			<h1 class="text-6xl font-bold text-gray-900 mb-4">
				{status}
			</h1>
			<h2 class="text-2xl font-semibold text-gray-700 mb-2">
				{#if status === 404}
					Page Not Found
				{:else if status === 403}
					Access Denied
				{:else if status === 405}
					Method Not Allowed
				{:else if status === 500}
					Internal Server Error
				{:else}
					Something Went Wrong
				{/if}
			</h2>
			<p class="text-gray-600">
				{error?.message || 'An unexpected error occurred.'}
			</p>
		</div>

		<div class="space-y-3">
			<a
				href="/"
				class="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
			>
				Return to Home
			</a>
			
			{#if status !== 404}
				<button
					type="button"
					onclick={() => window.location.reload()}
					class="block w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
				>
					Try Again
				</button>
			{/if}
		</div>

		{#if status === 404}
			<p class="mt-8 text-sm text-gray-500">
				The page you're looking for doesn't exist or has been moved.
			</p>
		{/if}
	</div>
</div>
