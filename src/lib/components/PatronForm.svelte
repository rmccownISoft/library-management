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
		liabilityWaiverSigned?: boolean
		userAgreementSigned?: boolean
	}

	interface ExistingFile {
		id: number
		fileName: string
		label: string | null
		uploadedAt: string | Date
	}

	interface Props {
		patron: PatronFormData
		errors?: Record<string, string>
		submitText?: string
		existingFiles?: ExistingFile[]
	}

	let {
		patron,
		errors = {},
		submitText = 'Submit',
		existingFiles = []
	}: Props = $props()

	let isSubmitting = $state(false)

	function formatDate(date: Date | string): string {
		const d = typeof date === 'string' ? new Date(date) : date
		return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
	}
</script>

<form
	method="POST"
	enctype="multipart/form-data"
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
	
	<!-- Documents -->
	<div class="mb-6">
		<h3 class="text-lg font-medium text-gray-900 mb-3">Documents</h3>
		<p class="text-sm text-gray-600 mb-3">Upload signed copies of the liability waiver and user agreement. Accepts PDF files or photos.</p>

		<!-- Liability Waiver -->
		<div class="mb-4">
			<p class="text-sm font-medium text-gray-700 mb-1">Liability Waiver</p>
			{#if existingFiles.find(f => f.label === 'Liability Waiver')}
				{@const file = existingFiles.find(f => f.label === 'Liability Waiver')!}
				<div class="flex items-center gap-2 mb-2 text-sm text-green-700">
					<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<a href="/api/files/{file.id}" class="underline hover:text-green-900">{file.fileName}</a>
					<span class="text-gray-500">— uploaded {formatDate(file.uploadedAt)}</span>
				</div>
			{/if}
			<input
				type="file"
				name="liabilityWaiver"
				accept=".pdf,image/*"
				class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
			/>
			<label class="flex items-center gap-2 mt-3 text-sm text-gray-700 cursor-pointer select-none">
				<input
					type="checkbox"
					name="liabilityWaiverSigned"
					checked={patron.liabilityWaiverSigned ?? false}
					class="h-4 w-4 rounded border-gray-300 text-blue-600"
				/>
				Signed (paper copy on file)
			</label>
			<p class="mt-1 text-xs text-gray-500 ml-6">Check this if a signed paper copy has been collected but not yet uploaded.</p>
		</div>

		<!-- User Agreement -->
		<div>
			<p class="text-sm font-medium text-gray-700 mb-1">User Agreement</p>
			{#if existingFiles.find(f => f.label === 'User Agreement')}
				{@const file = existingFiles.find(f => f.label === 'User Agreement')!}
				<div class="flex items-center gap-2 mb-2 text-sm text-green-700">
					<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<a href="/api/files/{file.id}" class="underline hover:text-green-900">{file.fileName}</a>
					<span class="text-gray-500">— uploaded {formatDate(file.uploadedAt)}</span>
				</div>
			{/if}
			<input
				type="file"
				name="userAgreement"
				accept=".pdf,image/*"
				class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
			/>
			<label class="flex items-center gap-2 mt-3 text-sm text-gray-700 cursor-pointer select-none">
				<input
					type="checkbox"
					name="userAgreementSigned"
					checked={patron.userAgreementSigned ?? false}
					class="h-4 w-4 rounded border-gray-300 text-blue-600"
				/>
				Signed (paper copy on file)
			</label>
			<p class="mt-1 text-xs text-gray-500 ml-6">Check this if a signed paper copy has been collected but not yet uploaded.</p>
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