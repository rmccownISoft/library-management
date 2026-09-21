<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { CategoryModel } from '$generated/prisma/models';
	import Button from '$lib/components/Button.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

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
</script>

<Toast />

<div class="p-8">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Category Management</h1>
		<p class="mt-2 text-gray-600">Manage tool categories and subcategories</p>
	</div>

	<!-- Category List -->
	<div class="mb-8 overflow-hidden rounded-lg border border-gray-200 bg-white">
		<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
			<h2 class="text-xl font-semibold text-gray-900">Existing Categories</h2>
		</div>

		{#if flatCategories.length === 0}
			<div class="p-8 text-center text-gray-500">
				<p>No categories yet. Create your first category below.</p>
			</div>
		{:else}
			<!-- Desktop Table -->
			<div class="hidden overflow-x-auto md:block">
				<table class="w-full">
					<thead class="border-b border-gray-200 bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left font-semibold text-gray-900">Category Name</th>
							<th class="px-6 py-3 text-left font-semibold text-gray-900">Tools</th>
							<th class="px-6 py-3 text-left font-semibold text-gray-900">Parent Category</th>
							<th class="px-6 py-3 text-right font-semibold text-gray-900">Actions</th>
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
												return async ({ result, update }) => {
													await update();
													isUpdating = false;

													if (result.type === 'success' && result.data?.success) {
														const message =
															typeof result.data.message === 'string'
																? result.data.message
																: 'Category updated successfully';
														toastStore.success(message);
														cancelEdit();
													} else if (result.type === 'failure' && result.data?.error) {
														const error =
															typeof result.data.error === 'string'
																? result.data.error
																: 'An error occurred';
														toastStore.error(error);
													}
												};
											}}
										>
											<input type="hidden" name="id" value={category.id} />

											{#if form?.error && form?.editingId === category.id}
												<div
													class="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
												>
													✗ {form.error}
												</div>
											{/if}

											<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
												<div>
													<label
														for="edit-name-{category.id}"
														class="mb-1 block text-sm font-medium text-gray-700"
													>
														Category Name
													</label>
													<input
														type="text"
														id="edit-name-{category.id}"
														name="name"
														bind:value={editName}
														required
														class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
													/>
												</div>

												<div>
													<label
														for="edit-parent-{category.id}"
														class="mb-1 block text-sm font-medium text-gray-700"
													>
														Parent Category
													</label>
													<select
														id="edit-parent-{category.id}"
														name="parentId"
														bind:value={editParentId}
														class="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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

											<div class="mt-4 flex gap-2">
												<button
													type="submit"
													disabled={isUpdating}
													class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
												>
													{isUpdating ? 'Saving...' : 'Save Changes'}
												</button>
												<button
													type="button"
													onclick={cancelEdit}
													disabled={isUpdating}
													class="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
											class="text-sm font-medium text-blue-600 hover:text-blue-800"
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
						<div class="border-b border-gray-100 bg-blue-50 p-4">
							<form
								method="POST"
								action="?/update"
								use:enhance={() => {
									isUpdating = true;
									return async ({ result, update }) => {
										await update();
										isUpdating = false;

										if (result.type === 'success' && result.data?.success) {
											const message =
												typeof result.data.message === 'string'
													? result.data.message
													: 'Category updated successfully';
											toastStore.success(message);
											cancelEdit();
										} else if (result.type === 'failure' && result.data?.error) {
											const error =
												typeof result.data.error === 'string'
													? result.data.error
													: 'An error occurred';
											toastStore.error(error);
										}
									};
								}}
							>
								<input type="hidden" name="id" value={category.id} />

								{#if form?.error && form?.editingId === category.id}
									<div
										class="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
									>
										✗ {form.error}
									</div>
								{/if}

								<div class="space-y-3">
									<div>
										<label
											for="edit-name-mobile-{category.id}"
											class="mb-1 block text-sm font-medium text-gray-700"
										>
											Category Name
										</label>
										<input
											type="text"
											id="edit-name-mobile-{category.id}"
											name="name"
											bind:value={editName}
											required
											class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label
											for="edit-parent-mobile-{category.id}"
											class="mb-1 block text-sm font-medium text-gray-700"
										>
											Parent Category
										</label>
										<select
											id="edit-parent-mobile-{category.id}"
											name="parentId"
											bind:value={editParentId}
											class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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

								<div class="mt-4 flex gap-2">
									<button
										type="submit"
										disabled={isUpdating}
										class="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
									>
										{isUpdating ? 'Saving...' : 'Save'}
									</button>
									<button
										type="button"
										onclick={cancelEdit}
										disabled={isUpdating}
										class="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					{:else}
						<!-- View Mode Card -->
						<div
							class="border-b border-gray-100 p-4 last:border-b-0"
							style="padding-left: {category.level * 1.5 + 1}rem"
						>
							<div class="mb-2 flex items-start justify-between">
								<div class="font-medium text-gray-900">
									{#if category.level > 0}
										<span class="mr-1 text-gray-400">└─</span>
									{/if}
									{category.name}
								</div>
								<button
									type="button"
									onclick={() => startEdit(category)}
									class="ml-2 text-sm font-medium text-blue-600 hover:text-blue-800"
								>
									Edit
								</button>
							</div>
							<div class="space-y-1 text-sm text-gray-600">
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
	<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
		<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
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

						if (result.type === 'success' && result.data?.success) {
							const message =
								typeof result.data.message === 'string'
									? result.data.message
									: 'Category created successfully';
							toastStore.success(message);
							// Clear form on success
							createName = '';
							createParentId = '';
						} else if (result.type === 'failure' && result.data?.error) {
							const error =
								typeof result.data.error === 'string' ? result.data.error : 'An error occurred';
							toastStore.error(error);
						}
					};
				}}
			>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<label for="create-name" class="mb-1 block text-sm font-medium text-gray-700">
							Category Name <span class="text-red-600">*</span>
						</label>
						<input
							type="text"
							id="create-name"
							name="name"
							bind:value={createName}
							required
							placeholder="e.g., Hand Tools, Power Tools"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="create-parent" class="mb-1 block text-sm font-medium text-gray-700">
							Parent Category <span class="text-gray-500">(optional)</span>
						</label>
						<select
							id="create-parent"
							name="parentId"
							bind:value={createParentId}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
