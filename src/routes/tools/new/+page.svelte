<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { resolve } from '$app/paths';
	import ToolForm from '$lib/components/ToolForm.svelte';

	let { data, form } = $props<{ data: PageData; form?: ActionData }>();
</script>

<div class="mx-auto max-w-2xl p-8">
	<div class="mb-8">
		<a href={resolve('/tools')} class="mb-4 inline-block text-blue-600 hover:underline">
			← Back to Tools
		</a>
		<h1 class="text-3xl font-bold text-gray-900">Create New Tool</h1>
	</div>

	<ToolForm
		categories={data.categories}
		tool={null}
		errors={form?.errors}
		values={form?.values}
		submitText="Create Tool"
	/>
</div>
