<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const tabs = [
		{ label: 'Categories', href: '/admin/categories' },
		{ label: 'Activity Log', href: '/admin/activity-log' }
	];
</script>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Header -->
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-gray-900">Admin</h1>
			<p class="text-gray-600 mt-1">Manage library settings and view activity</p>
		</div>

		<!-- Tab Navigation -->
		<div class="border-b border-gray-200 mb-6">
			<nav class="-mb-px flex gap-6">
				{#each tabs as tab (tab.href)}
					{@const isActive = page.url.pathname === tab.href}
					<a
						href={tab.href}
						class={[
							'whitespace-nowrap pb-3 text-sm font-medium border-b-2 transition-colors',
							isActive
								? 'border-blue-600 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						]}
					>
						{tab.label}
					</a>
				{/each}
			</nav>
		</div>

		<!-- Page Content -->
		{@render children()}
	</div>
</div>
