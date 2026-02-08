<script lang="ts">
	interface Props {
		label: string
		name: string
		value: string | number
		required?: boolean
		error?: string
		class?: string
		children: any
	}

	let { 
		label, 
		name,
		value = $bindable(),
		required = false,
		error,
		class: additionalClasses = '',
		children
	}: Props = $props()
	
	// Base select classes - consistent across all forms
	const baseSelectClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
	const errorClasses = error ? "border-red-500" : ""
	const selectClasses = `${baseSelectClasses} ${errorClasses} ${additionalClasses}`.trim()
</script>

<div class="form-field">
	<label for={name} class="block text-sm font-medium text-gray-700 mb-1">
		{label}
		{#if required}
			<span class="text-red-600">*</span>
		{/if}
	</label>
	<select
		id={name}
		{name}
		bind:value
		{required}
		class={selectClasses}
	>
		{@render children()}
	</select>
	{#if error}
		<p class="text-red-600 text-sm mt-1">{error}</p>
	{/if}
</div>