<script lang="ts">
	import { enhance } from '$app/forms'
	import Button from './Button.svelte'
	import Input from './Input.svelte'

	interface PatronFormData {
		id?: number
		firstName: string
		lastName: string
		email: string
		phone: string
		mailingStreet: string
		mailingCity: string
		mailingState: string
		mailingZipcode: string
	}

	interface Props {
		patron: PatronFormData
		errors?: Record<string, string>
		submitText?: string
	}

	let { 
		patron,
		errors = {},
		submitText = 'Submit'
	}: Props = $props()
	
	let isSubmitting = $state(false)
</script>

<form 
	method="POST"
	use:enhance={() => {
		isSubmitting = true;
		
		return async ({ update }) => {
			await update();
			isSubmitting = false;
		};
	}}
	class="bg-white border border-gray-200 rounded-lg p-6"
>
	<!-- Name Fields (Side by Side) -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
		<Input
			label="First Name"
			name="firstName"
			bind:value={patron.firstName}
			required={true}
			error={errors.firstName}
		/>

		<Input
			label="Last Name"
			name="lastName"
			bind:value={patron.lastName}
			required={true}
			error={errors.lastName}
		/>

	</div>

	<!-- Contact Information -->
	<div class="mb-4">
		<h3 class="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
		<p class="text-sm text-gray-600 mb-3">At least one contact method (email or phone) is required.</p>
		
		{#if errors.contact}
			<div class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
				<p class="text-red-600 text-sm">{errors.contact}</p>
			</div>
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Input
				label="Email Address"
				name="email"
				type="email"
				bind:value={patron.email}
				placeholder="patron@example.com"
				error={errors.email}
			/>
			
			<Input
				label="Phone Number"
				name="phone"
				type="tel"
				bind:value={patron.phone}
				placeholder="(555) 123-4567"
				error={errors.phone}
			/>
		</div>
	</div>

	<!-- Mailing Address -->
	<div class="mb-6">
		<h3 class="text-lg font-medium text-gray-900 mb-3">Mailing Address</h3>
		
		<Input
			label="Street Address"
			name="mailingStreet"
			bind:value={patron.mailingStreet}
			required={true}
			placeholder="2000 D St"
			error={errors.mailingStreet}
		/>

		<!-- City, State, Zip (Three columns on larger screens) -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<Input
				label="City"
				name="mailingCity"
				bind:value={patron.mailingCity}
				required={true}
				placeholder="Lincoln"
				error={errors.mailingCity}
			/>
			
			<Input
				label="State"
				name="mailingState"
				bind:value={patron.mailingState}
				required={true}
				placeholder="NE"
				maxlength={2}
				class="uppercase"
				oninput={(e) => {
					const target = e.target as HTMLInputElement;
					target.value = target.value.toUpperCase();
					patron.mailingState = target.value;
				}}
				error={errors.mailingState}
			/>
			
			<Input
				label="Zip Code"
				name="mailingZipcode"
				bind:value={patron.mailingZipcode}
				required={true}
				placeholder="68502"
				error={errors.mailingZipcode}
			/>
		</div>
	</div>
	
	<!-- Form Actions -->
	<div class="flex gap-3 justify-end pt-4 border-t border-gray-200">
		<Button 
			variant="secondary" 
			type="a" 
			href={patron ? `/patrons/${patron.id}` : '/patrons'}
		>
			Cancel
		</Button>
		<Button 
			variant="primary" 
			type="submit" 
			disabled={isSubmitting}
		>
			{isSubmitting ? 'Saving...' : submitText}
		</Button>
	</div>
</form>