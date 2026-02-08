<script lang="ts">
	interface Props {
		label: string
		name: string
		value: string | number
		type?: 'text' | 'email' | 'tel' | 'number'
		required?: boolean
		error?: string
		placeholder?: string
		maxlength?: number
		pattern?: string
		class?: string
		oninput?: (e: Event) => void
	}

	let { 
		label, 
		name,
		value = $bindable(),
		type = 'text',
		required = false,
		error,
		placeholder,
		maxlength,
		pattern,
		class: additionalClasses = '',
		oninput
	}: Props = $props()
	
	// Base input classes - consistent across all forms
	const baseInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
	const errorClasses = error ? "border-red-500" : ""
	const inputClasses = `${baseInputClasses} ${errorClasses} ${additionalClasses}`.trim()
</script>

<div class="form-field">
	<label for={name} class="block text-sm font-medium text-gray-700 mb-1">
		{label}
		{#if required}
			<span class="text-red-600">*</span>
		{/if}
	</label>
	<input
		id={name}
		{name}
		{type}
		bind:value
		{required}
		{placeholder}
		{maxlength}
		{pattern}
		{oninput}
		class={inputClasses}
	/>
	{#if error}
		<p class="text-red-600 text-sm mt-1">{error}</p>
	{/if}
</div>
