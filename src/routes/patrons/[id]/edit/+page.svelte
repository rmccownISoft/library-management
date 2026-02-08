<script lang="ts">
	import type { PageData, ActionData } from './$types'
	import PatronForm from '$lib/components/PatronForm.svelte'

	let { data, form } = $props<{ data: PageData; form: ActionData }>()

	// Create patron object with form values if validation failed, otherwise use data from server
	let patron = $derived({
		id: data.patron.id,
		firstName: form?.values?.firstName ?? data.patron.firstName,
		lastName: form?.values?.lastName ?? data.patron.lastName,
		email: form?.values?.email ?? data.patron.email ?? '',
		phone: form?.values?.phone ?? data.patron.phone ?? '',
		mailingStreet: form?.values?.mailingStreet ?? data.patron.mailingStreet,
		mailingCity: form?.values?.mailingCity ?? data.patron.mailingCity,
		mailingState: form?.values?.mailingState ?? data.patron.mailingState,
		mailingZipcode: form?.values?.mailingZipcode ?? data.patron.mailingZipcode
	})
</script>

<svelte:head>
	<title>Edit Patron: {data.patron.firstName} {data.patron.lastName}</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-8">
	<!-- Header -->
	<div class="mb-8">
		<a href="/patrons/{data.patron.id}" class="text-blue-600 hover:underline mb-4 inline-block">
			← Back to Patron Details
		</a>
		
		<h1 class="text-3xl font-bold text-gray-900">
			Edit Patron: {data.patron.firstName} {data.patron.lastName}
		</h1>
	</div>

	<!-- Patron Form -->
	<PatronForm 
		{patron}
		errors={form?.errors ?? {}}
		submitText="Update Patron"
	/>
</div>