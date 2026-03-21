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
		mailingZipcode: form?.values?.mailingZipcode ?? data.patron.mailingZipcode,
		liabilityWaiverSigned: data.patron.liabilityWaiverSigned,
		userAgreementSigned: data.patron.userAgreementSigned
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

	{#if form?.serverError}
		<div class="mb-6 rounded-md bg-red-50 border border-red-200 p-4 text-red-800">
			{form.serverError}
		</div>
	{/if}

	<!-- Patron Form -->
	<PatronForm
		{patron}
		errors={form?.errors ?? {}}
		submitText="Update Patron"
		existingFiles={data.patron.files}
	/>
</div>