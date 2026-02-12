<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { CategoryModel } from '$generated/prisma/models';
	import Button from '$lib/components/Button.svelte';

	type CategoryWithChildren = CategoryModel & {
		children?: CategoryWithChildren[];
		parent?: CategoryModel | null;
		_count: { tools: number };
	};

	interface Props {
		data: PageData;
		form?: ActionData;
	}

	let { data, form }: Props = $props();

	// State for create form
	let createName = $state('');
	let createParentId = $state<string>('');
	let isCreating = $state(false);

	// State for editing
	let editingId = $state<number | null>(form?.editingId || null);
	let editName = $state('');
	let editParentId = $state<string>('');
	let isUpdating = $state(false);

	// Flatten categories into a hierarchical list with indentation
	interface FlatCategory {
		id: number;
		name: string;
		level: number;
		toolCount: number;
		parentName: string | null;
		category: CategoryWithChildren;
	}

	function flattenCategories(cats: CategoryWithChildren[], level = 0): FlatCategory[] {
		const result: FlatCategory[] = [];

		for (const cat of cats) {
			result.push({
				id: cat.id,
				name: cat.name,
				level,
				toolCount: cat._count.tools,
				parentName: cat.parent?.name || null,
				category: cat
			});

			if (cat.children && cat.children.length > 0) {
				result.push(...flattenCategories(cat.children, level + 1));
			}
		}

		return result;
	}

	// Get only root categories
	const rootCategories = $derived(data.categories.filter((cat) => !cat.parentId));
	const flatCategories = $derived(flattenCategories(rootCategories));

	// Get all categories for parent selection (exclude current when editing)
	const parentOptions = $derived(
		flattenCategories(rootCategories).filter((cat) => cat.id !== editingId)
	);

	// Start editing a category
	function startEdit(category: FlatCategory) {
		editingId = category.id;
		editName = category.name;
		editParentId = category.category.parentId?.toString() || '';
	}

	// Cancel editing
	function cancelEdit() {
		editingId = null;
		editName = '';
		editParentId = '';
	}

	// Clear create form on success
	$effect(() => {
		if (form?.success && !form?.editingId) {
			createName = '';
			createParentId = '';
		}
	});
</script>

<div class="p-8">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Category Management</h1>
		<p class="text-gray-600 mt-2">Manage tool categories and subcategories</p>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
			✓ {form.message}
		</div>
	{/if}

	{#if form?.error && !form?.editingId}
		<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
			✗ {form.error}
		</div>
	{/if}

	<!-- Category List -->
	<div class="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
		<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
			<h2 class="text-xl font-semibold text-gray-900">Existing Categories</h2>
		</div>

		{#if flatCategories.length === 0}
			<div class="p-8 text-center text-gray-500">
				<p>No categories yet. Create your first category below.</p>
			</div>
		{:else}
			<!-- Desktop Table -->
			<div class="hidden md:block overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="text-left px-6 py-3 font-semibold text-gray-900">Category Name</th>
							<th class="text-left px-6 py-3 font-semibold text-gray-900">Tools</th>
							<th class="text-left px-6 py-3 font-semibold text-gray-900">Parent Category</th>
							<th class="text-right px-6 py-3 font-semibold text-gray-900">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each flatCategories as category}
							{#if editingId === category.id}
								<!-- Edit Mode Row -->
								<tr class="border-b border-gray-100 bg-blue-50">
									<td colspan="4" class="px-6 py-4">
										<form
											method="POST"
											action="?/update"
											use:enhance={() => {
												isUpdating = true;
												return async ({ update }) => {
													await update();
													isUpdating = false;
													if (form?.success) {
														cancelEdit();
													}
												};
											}}
										>
											<input type="hidden" name="id" value={category.id} />

											{#if form?.error && form?.editingId === category.id}
												<div
													class="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm"
												>
													✗ {form.error}
												</div>
											{/if}

											<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label
														for="edit-name-{category.id}"
														class="block text-sm font-medium text-gray-700 mb-1"
													>
														Category Name
													</label>
													<input
														type="text"
														id="edit-name-{category.id}"
														name="name"
														bind:value={editName}
														required
														class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
													/>
												</div>

												<div>
													<label
														for="edit-parent-{category.id}"
														class="block text-sm font-medium text-gray-700 mb-1"
													>
														Parent Category
													</label>
													<select
														id="edit-parent-{category.id}"
														name="parentId"
														bind:value={editParentId}
														class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
													>
														<option value="">None (Top Level)</option>
														{#each parentOptions as option}
															<option value={option.id}>
																{'\u00A0'.repeat(option.level * 4)}{option.level > 0
																	? '└─ '
																	: ''}{option.name}
															</option>
														{/each}
													</select>
												</div>
											</div>

											<div class="flex gap-2 mt-4">
												<button
													type="submit"
													disabled={isUpdating}
													class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
												>
													{isUpdating ? 'Saving...' : 'Save Changes'}
												</button>
												<button
													type="button"
													onclick={cancelEdit}
													disabled={isUpdating}
													class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
												>
													Cancel
												</button>
											</div>
										</form>
									</td>
								</tr>
							{:else}
								<!-- View Mode Row -->
								<tr class="border-b border-gray-100 hover:bg-gray-50">
									<td class="px-6 py-3" style="padding-left: {category.level * 2 + 1.5}rem">
										<span class="font-medium text-gray-900">
											{#if category.level > 0}
												<span class="text-gray-400">└─</span>
											{/if}
											{category.name}
										</span>
									</td>
									<td class="px-6 py-3 text-gray-700">
										{category.toolCount}
									</td>
									<td class="px-6 py-3 text-gray-600">
										{category.parentName || '—'}
									</td>
									<td class="px-6 py-3 text-right">
										<button
											type="button"
											onclick={() => startEdit(category)}
											class="text-blue-600 hover:text-blue-800 font-medium text-sm"
										>
											Edit
										</button>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Mobile Card Layout -->
			<div class="md:hidden">
				{#each flatCategories as category}
					{#if editingId === category.id}
						<!-- Edit Mode Card -->
						<div class="p-4 border-b border-gray-100 bg-blue-50">
							<form
								method="POST"
								action="?/update"
								use:enhance={() => {
									isUpdating = true;
									return async ({ update }) => {
										await update();
										isUpdating = false;
										if (form?.success) {
											cancelEdit();
										}
									};
								}}
							>
								<input type="hidden" name="id" value={category.id} />

								{#if form?.error && form?.editingId === category.id}
									<div
										class="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm"
									>
										✗ {form.error}
									</div>
								{/if}

								<div class="space-y-3">
									<div>
										<label
											for="edit-name-mobile-{category.id}"
											class="block text-sm font-medium text-gray-700 mb-1"
										>
											Category Name
										</label>
										<input
											type="text"
											id="edit-name-mobile-{category.id}"
											name="name"
											bind:value={editName}
											required
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
										/>
									</div>

									<div>
										<label
											for="edit-parent-mobile-{category.id}"
											class="block text-sm font-medium text-gray-700 mb-1"
										>
											Parent Category
										</label>
										<select
											id="edit-parent-mobile-{category.id}"
											name="parentId"
											bind:value={editParentId}
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
										>
											<option value="">None (Top Level)</option>
											{#each parentOptions as option}
												<option value={option.id}>
													{'\u00A0'.repeat(option.level * 2)}{option.name}
												</option>
											{/each}
										</select>
									</div>
								</div>

								<div class="flex gap-2 mt-4">
									<button
										type="submit"
										disabled={isUpdating}
										class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
									>
										{isUpdating ? 'Saving...' : 'Save'}
									</button>
									<button
										type="button"
										onclick={cancelEdit}
										disabled={isUpdating}
										class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					{:else}
						<!-- View Mode Card -->
						<div
							class="p-4 border-b border-gray-100 last:border-b-0"
							style="padding-left: {category.level * 1.5 + 1}rem"
						>
							<div class="flex justify-between items-start mb-2">
								<div class="font-medium text-gray-900">
									{#if category.level > 0}
										<span class="text-gray-400 mr-1">└─</span>
									{/if}
									{category.name}
								</div>
								<button
									type="button"
									onclick={() => startEdit(category)}
									class="text-blue-600 hover:text-blue-800 font-medium text-sm ml-2"
								>
									Edit
								</button>
							</div>
							<div class="text-sm text-gray-600 space-y-1">
								<div>Tools: {category.toolCount}</div>
								{#if category.parentName}
									<div>Parent: {category.parentName}</div>
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>

	<!-- Create New Category Form -->
	<div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
		<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
			<h2 class="text-xl font-semibold text-gray-900">Create New Category</h2>
		</div>

		<div class="p-6">
			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					isCreating = true;
					return async ({ result, update }) => {
						await update();
						isCreating = false;
					};
				}}
			>
				{#if form?.error && !form?.editingId}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
						✗ {form.error}
					</div>
				{/if}

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="create-name" class="block text-sm font-medium text-gray-700 mb-1">
							Category Name <span class="text-red-600">*</span>
						</label>
						<input
							type="text"
							id="create-name"
							name="name"
							bind:value={createName}
							required
							placeholder="e.g., Hand Tools, Power Tools"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
						/>
					</div>

					<div>
						<label for="create-parent" class="block text-sm font-medium text-gray-700 mb-1">
							Parent Category <span class="text-gray-500">(optional)</span>
						</label>
						<select
							id="create-parent"
							name="parentId"
							bind:value={createParentId}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
						>
							<option value="">None (Top Level)</option>
							{#each flatCategories as category}
								<option value={category.id}>
									{'\u00A0'.repeat(category.level * 4)}{category.level > 0
										? '└─ '
										: ''}{category.name}
								</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="mt-4">
					<Button variant="success" type="submit" disabled={isCreating}>
						{isCreating ? 'Creating...' : '+ Create Category'}
					</Button>
				</div>
			</form>
		</div>
	</div>
</div>
