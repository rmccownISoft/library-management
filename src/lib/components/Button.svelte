<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		/**
		 * The button variant/color scheme
		 */
		variant?: 'primary' | 'success' | 'secondary' | 'danger'
		/**
		 * The element type - 'button' for buttons, 'a' for links
		 */
		type?: 'button' | 'submit' | 'reset' | 'a'
		/**
		 * href attribute (only used when type='a')
		 */
		href?: string
		/**
		 * Whether the button is disabled
		 */
		disabled?: boolean
		/**
		 * Additional CSS classes
		 */
		class?: string
		/**
		 * Click handler (only used for button types)
		 */
		onclick?: (e: MouseEvent) => void
		/**
		 * Button content
		 */
		children?: Snippet
	}

	let {
		variant = 'primary',
		type = 'button',
		href,
		disabled = false,
		class: className = '',
		onclick,
		children
	}: Props = $props()

	// Base styles that work across all browsers (CSS3)
	const baseStyles = 'px-6 py-2 rounded-lg font-medium text-center'

	// Variant-specific colors using inline styles for Silk Browser compatibility
	const variantColors = {
		primary: { bg: '#2563eb', text: '#ffffff', hover: '#1d4ed8', border: undefined },
		success: { bg: '#16a34a', text: '#ffffff', hover: '#15803d', border: undefined },
		secondary: { bg: '#ffffff', text: '#374151', hover: '#f9fafb', border: '#d1d5db' },
		danger: { bg: '#dc2626', text: '#ffffff', hover: '#b91c1c', border: undefined }
	}

	const colors = variantColors[variant]

	// Build inline style string for CSS3 compatibility
	const inlineStyle = `
		display: inline-block;
		text-decoration: none;
		background-color: ${colors.bg};
		color: ${colors.text};
		${colors.border ? `border: 1px solid ${colors.border};` : ''}
		${disabled ? 'opacity: 0.5; cursor: not-allowed;' : ''}
	`.trim()
</script>

{#if type === 'a' && href}
	<a
		{href}
		class="{baseStyles} {className}"
		style={inlineStyle}
		aria-disabled={disabled}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		type={type === 'a' ? 'button' : type}
		{disabled}
		{onclick}
		class="{baseStyles} {className} {disabled ? 'cursor-not-allowed' : ''}"
		style={inlineStyle}
	>
		{@render children?.()}
	</button>
{/if}
