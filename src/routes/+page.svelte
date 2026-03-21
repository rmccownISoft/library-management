<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Selected category state (null means "All Tools")
	let selectedCategoryId = $state<number | null>(null);
	let selectedImage = $state<{ id: string; fileName: string } | null>(null);

	// Build category hierarchy (root categories only)
	const rootCategories = $derived(data.categories.filter((cat) => !cat.parentId));

	// Filter tools by selected category
	const filteredTools = $derived(() => {
		if (selectedCategoryId === null) {
			return data.tools;
		}

		// Get selected category and all its descendants
		const categoryIds = getCategoryAndDescendants(selectedCategoryId);
		return data.tools.filter((tool) => categoryIds.includes(tool.categoryId));
	});

	// Get category and all its descendants recursively
	function getCategoryAndDescendants(categoryId: number): number[] {
		const ids = [categoryId];
		const category = data.categories.find((c) => c.id === categoryId);

		if (category?.children) {
			for (const child of category.children) {
				ids.push(...getCategoryAndDescendants(child.id));
			}
		}

		return ids;
	}

	// Group tools by category
	const toolsByCategory = $derived(() => {
		const grouped = new Map<number, typeof data.tools>();

		for (const tool of filteredTools()) {
			const categoryId = tool.categoryId;
			if (!grouped.has(categoryId)) {
				grouped.set(categoryId, []);
			}
			grouped.get(categoryId)?.push(tool);
		}

		return grouped;
	});

	// Get category name by id
	function getCategoryName(categoryId: number): string {
		return data.categories.find((c) => c.id === categoryId)?.name || 'Unknown';
	}

	// Flat options list for mobile select dropdown
	type FlatOption = { id: number; label: string }

	function flattenCategories(cats: typeof data.categories, depth: number): FlatOption[] {
		const result: FlatOption[] = []
		for (const cat of cats) {
			const prefix = '\u00A0\u00A0'.repeat(depth)
			result.push({ id: cat.id, label: `${prefix}${cat.name} (${cat._count.tools})` })
			if (cat.children?.length) {
				result.push(...flattenCategories(cat.children, depth + 1))
			}
		}
		return result
	}

	const flatCategoryOptions = $derived(flattenCategories(rootCategories, 0))

	let viewMode = $state<'list' | 'grid'>('grid')
</script>

<div class="lg:grid lg:grid-cols-[280px_1fr] min-h-screen">
	<!-- Category Sidebar (desktop only) -->
	<aside
		class="hidden lg:block bg-gray-50 p-6 border-r border-gray-200 lg:sticky lg:top-0 lg:max-h-screen overflow-y-auto"
	>
		<h2 class="text-xl font-semibold mb-4 text-gray-900">Categories</h2>

		<button
			class="w-full text-left px-3 py-2 my-1 rounded transition-colors text-gray-700 hover:bg-gray-200 {selectedCategoryId ===
			null
				? 'bg-blue-600 text-white font-medium hover:bg-blue-700'
				: ''}"
			onclick={() => (selectedCategoryId = null)}
		>
			All Tools ({data.tools.length})
		</button>

		{#each rootCategories as category}
			{@render categoryNode(category, 0)}
		{/each}
	</aside>

	<!-- Tools Content -->
	<main class="p-8">
		<!-- Mobile category dropdown -->
		<div class="block lg:hidden mb-6">
			<label for="category-select" class="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
			<select
				id="category-select"
				class="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
				value={selectedCategoryId === null ? '' : String(selectedCategoryId)}
				onchange={(e) => {
					const val = (e.target as HTMLSelectElement).value
					selectedCategoryId = val === '' ? null : Number(val)
				}}
			>
				<option value="">All Tools ({data.tools.length})</option>
				{#each flatCategoryOptions as opt (opt.id)}
					<option value={String(opt.id)}>{opt.label}</option>
				{/each}
			</select>
		</div>

		{#if data.user}
			<div class="flex justify-end mb-4">
				<a
					href="/tools"
					class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
				>
					Manage Tools
				</a>
			</div>
		{/if}

		<div class="bg-white border border-gray-200 rounded-lg p-6 mb-6 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
			<div class="pb-4 sm:pb-0 sm:pr-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-2">Hours</h2>
				<div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
					<span>Friday</span><span>5:30 PM – 7:00 PM</span>
					<span>Saturday</span><span>11:00 AM – 1:00 PM</span>
				</div>
			</div>
			<div class="py-4 sm:py-0 sm:px-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-2">Location</h2>
				<p class="text-sm text-gray-700">2045 E Street</p>
				<p class="text-sm text-gray-700">Basement of the Hope House – First Plymouth</p>
			</div>
			<div class="pt-4 sm:pt-0 sm:pl-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-2">Questions?</h2>
				<p class="text-sm text-gray-700">Email: <a href="mailto:NSToolLibrary@gmail.com" class="text-blue-600 hover:underline">NSToolLibrary@gmail.com</a></p>
				<p class="text-sm text-gray-700">Phone: <a href="tel:4024131347" class="text-blue-600 hover:underline">402-413-1347</a></p>
			</div>
		</div>

		<div class="flex items-center justify-between mb-6">
			<h1 class="text-3xl font-bold text-gray-900">
				{selectedCategoryId === null ? 'All Tools' : getCategoryName(selectedCategoryId)}
			</h1>
			<!-- View toggle: desktop only -->
			<div class="hidden md:flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-white">
				<button
					type="button"
					onclick={() => viewMode = 'list'}
					class="p-1.5 rounded transition-colors {viewMode === 'list' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-600'}"
					aria-label="List view"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				<button
					type="button"
					onclick={() => viewMode = 'grid'}
					class="p-1.5 rounded transition-colors {viewMode === 'grid' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-600'}"
					aria-label="Grid view"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
					</svg>
				</button>
			</div>
		</div>

		{#if filteredTools().length === 0}
			<p class="text-gray-500 italic text-center py-8">No tools found</p>
		{:else}
			{#each [...toolsByCategory()] as [categoryId, tools]}
				<section class="mb-12">
					<h2 class="text-2xl font-semibold text-gray-700 border-b-2 border-gray-200 pb-2 mb-4">
						{getCategoryName(categoryId)}
					</h2>

					{#if viewMode === 'grid'}
						<!-- Grid view: compact cards, desktop only (mobile always list) -->
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{#each tools as tool (tool.id)}
								<div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
									{#if tool.files && tool.files.length > 0}
										<button
											type="button"
											onclick={() => selectedImage = tool.files[0]}
											class="w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
										>
											<img
												src="/api/files/{tool.files[0].id}"
												alt={tool.name}
												class="w-full h-40 object-contain bg-gray-50 hover:opacity-90 transition-opacity cursor-pointer"
											/>
										</button>
									{:else}
										<div class="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-300">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
										</div>
									{/if}
									<div class="p-4 flex flex-col flex-1">
										<h3 class="font-semibold text-gray-900 mb-1 leading-snug">{tool.name}</h3>
										<p class="text-gray-500 text-sm line-clamp-2 flex-1">{tool.description}</p>
										<div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
											<div class="flex items-center gap-2">
												<span class="text-gray-600 text-sm">Qty: {tool.quantity}</span>
												<span class="px-2 py-0.5 rounded-full text-xs font-medium
													{tool.conditionStatus === 'GOOD' ? 'bg-green-100 text-green-800' : ''}
													{tool.conditionStatus === 'NEEDS_REPAIR' ? 'bg-yellow-100 text-yellow-800' : ''}
													{tool.conditionStatus === 'DAMAGED' ? 'bg-red-100 text-red-800' : ''}
													{tool.conditionStatus === 'LOST' ? 'bg-gray-200 text-gray-700' : ''}">
													{tool.conditionStatus.replace('_', ' ')}
												</span>
											</div>
											{#if data.user}
												<a href="/tools/{tool.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">→</a>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<!-- List view -->
						<div class="grid grid-cols-1 gap-4">
							{#each tools as tool (tool.id)}
								<div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
									<div class="flex gap-4 mb-4">
										<div class="flex-1 min-w-0">
											<h3 class="text-xl font-semibold mb-2 text-gray-900">{tool.name}</h3>
											<p class="text-gray-600 text-sm line-clamp-2">{tool.description}</p>
										</div>
										{#if tool.files && tool.files.length > 0}
											<button
												type="button"
												onclick={() => selectedImage = tool.files[0]}
												class="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
											>
												<img
													src="/api/files/{tool.files[0].id}"
													alt={tool.name}
													class="w-24 h-24 object-contain rounded-lg border border-gray-200 flex-shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
												/>
											</button>
										{/if}
									</div>
									<div class="flex justify-between items-center pt-4 border-t border-gray-100">
										<div class="flex items-center gap-3">
											<span class="text-gray-700 font-medium">Qty: {tool.quantity}</span>
											<span class="px-3 py-1 rounded-full text-xs font-medium
												{tool.conditionStatus === 'GOOD' ? 'bg-green-100 text-green-800' : ''}
												{tool.conditionStatus === 'NEEDS_REPAIR' ? 'bg-yellow-100 text-yellow-800' : ''}
												{tool.conditionStatus === 'DAMAGED' ? 'bg-red-100 text-red-800' : ''}
												{tool.conditionStatus === 'LOST' ? 'bg-gray-200 text-gray-700' : ''}">
												{tool.conditionStatus.replace('_', ' ')}
											</span>
										</div>
										{#if data.user}
											<a href="/tools/{tool.id}" class="text-blue-600 hover:text-blue-800 font-medium text-sm">
												View Details →
											</a>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{/each}
		{/if}
	</main>
</div>

<!-- Image Lightbox Modal -->
{#if selectedImage}
	<div 
		class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
		onclick={() => selectedImage = null}
	>
		<button
			type="button"
			onclick={() => selectedImage = null}
			class="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl font-light leading-none"
			aria-label="Close"
		>
			&times;
		</button>
		<img 
			src="/api/files/{selectedImage.id}" 
			alt={selectedImage.fileName}
			class="max-w-full max-h-full object-contain"
			onclick={(e) => e.stopPropagation()}
		/>
	</div>
{/if}

{#snippet categoryNode(category: typeof data.categories[0], level: number)}
	<div style="padding-left: {level * 1.25}rem">
		<button
			class="w-full text-left px-3 py-2 my-1 rounded transition-colors text-sm text-gray-700 hover:bg-gray-200 {selectedCategoryId ===
			category.id
				? 'bg-blue-600 text-white font-medium hover:bg-blue-700'
				: ''}"
			onclick={() => (selectedCategoryId = category.id)}
		>
			{category.name} ({category._count.tools})
		</button>

		{#if category.children && category.children.length > 0}
			{#each category.children as child}
				{@render categoryNode(child, level + 1)}
			{/each}
		{/if}
	</div>
{/snippet}
