<script lang="ts">
	import type { PageData, ActionData } from './$types'
	import PatronForm from '$lib/components/PatronForm.svelte'
	
	let { data, form } = $props<{ data: PageData; form?: ActionData }>()
	
	// Create patron object with form values or empty defaults
	let patron = $state({
		firstName: form?.values?.firstName || '',
		lastName: form?.values?.lastName || '',
		email: form?.values?.email || '',
		phone: form?.values?.phone || '',
		mailingStreet: form?.values?.mailingStreet || '',
		mailingCity: form?.values?.mailingCity || '',
		mailingState: form?.values?.mailingState || '',
		mailingZipcode: form?.values?.mailingZipcode || ''
		// No id - indicates new patron
	})
</script>

<svelte:head>
	<title>Create New Patron - Tool Library</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-8">
	<div class="mb-8">
		<a href="/patrons" class="text-blue-600 hover:underline mb-4 inline-block">
			← Back to Patrons
		</a>
		<h1 class="text-3xl font-bold text-gray-900">Create New Patron</h1>
		<p class="text-gray-600 mt-2">
			Add a new patron to the tool library system. All fields marked with <span class="text-red-600">*</span> are required.
		</p>
	</div>

	<PatronForm 
		{patron}
		errors={form?.errors}
		submitText="Create Patron"
	/>
</div>