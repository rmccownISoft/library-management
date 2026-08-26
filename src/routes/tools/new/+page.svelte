<script lang="ts">
	import type { PageData, ActionData } from './$types'
	import ToolForm from '$lib/components/ToolForm.svelte'
	
	let { data, form } = $props<{ data: PageData; form?: ActionData }>()

</script>

<div class="max-w-2xl mx-auto p-8">
	<div class="mb-8">
		<a href="/tools" class="text-blue-600 hover:underline mb-4 inline-block">
			← Back to Tools
		</a>
		<h1 class="text-3xl font-bold text-gray-900">Create New Tool</h1>
	</div>

	{#if form?.serverError}
		<div class="mb-6 rounded-md bg-red-50 border border-red-200 p-4 text-red-800">
			{form.serverError}
		</div>
	{/if}

	<ToolForm
		categories={data.categories}
		tool={null}
		errors={form?.errors}
		values={form?.values}
		submitText="Create Tool"
	/>
</div>