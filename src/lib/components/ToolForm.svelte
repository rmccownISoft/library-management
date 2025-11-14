<script lang="ts">
    import { enhance } from '$app/forms'
    import type { CategoryModel, ToolModel } from '$generated/prisma/models'
	// import type { Category } from '@prisma/client' is supposed to work but doesn't
	type CategoryWithChildren = CategoryModel & {
		children?: CategoryWithChildren[]
		parent?: CategoryModel | null
	}

	interface Props {
		categories: CategoryWithChildren[]
		tool?: ToolModel | null
		errors?: Record<string, string>
		values?: Record<string, any>
		submitText?: string
	}

    let { 
		categories, 
		tool = null, 
		errors = {}, 
		values = {},
		submitText = 'Submit'
	}: Props = $props()
    
    let isSubmitting = $state(false)

	// Get field value (priority: form values > tool data > default)
	function getValue(field: string, defaultValue: any = '') {
		if (values && values[field] !== undefined) {
			return values[field];
		}
		if (tool && tool[field as keyof ToolModel] !== undefined) {
			return tool[field as keyof ToolModel];
		}
		return defaultValue;
	}

	// Flatten categories into a hierarchical list with indentation
	interface FlatCategory {
		id: number
		name: string
		level: number
	}

	function flattenCategories(cats: CategoryWithChildren[], level = 0): FlatCategory[] {
		const result: FlatCategory[] = []
		
		for (const cat of cats) {
			// Only include categories that don't have a parent (top-level) or are children
			// This prevents duplicates when categories appear both as top-level and as children
			result.push({
				id: cat.id,
				name: cat.name,
				level
			})
			
			if (cat.children && cat.children.length > 0) {
				result.push(...flattenCategories(cat.children, level + 1))
			}
		}
		
		return result
	}

	// Get only root categories (those without parents)
	const rootCategories = categories.filter(cat => !cat.parentId)
	const flatCategories = flattenCategories(rootCategories)

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
	<!-- Tool Name -->
	<div class="mb-4">
		<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
			Tool Name <span class="text-red-600">*</span>
		</label>
		<input
			type="text"
			id="name"
			name="name"
			value={getValue('name')}
			required
			class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
			class:border-red-500={errors.name}
		/>
		{#if errors.name}
			<p class="text-red-600 text-sm mt-1">{errors.name}</p>
		{/if}
	</div>

	<!-- Description -->
	<div class="mb-4">
		<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
			Description
		</label>
		<textarea
			id="description"
			name="description"
			rows="4"
			class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
		>{getValue('description')}</textarea>
	</div>

	<!-- Category -->
	<div class="mb-4">
		<label for="categoryId" class="block text-sm font-medium text-gray-700 mb-1">
			Category <span class="text-red-600">*</span>
		</label>
		<select
			id="categoryId"
			name="categoryId"
			value={getValue('categoryId')}
			required
			class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
			class:border-red-500={errors.categoryId}
		>
			<option value="">Select a category</option>
			{#each flatCategories as category}
				<option value={category.id}>
					{'\u00A0'.repeat(category.level * 4)}{category.level > 0 ? '└─ ' : ''}{category.name}
				</option>
			{/each}
		</select>
		{#if errors.categoryId}
			<p class="text-red-600 text-sm mt-1">{errors.categoryId}</p>
		{/if}
	</div>

	<!-- Quantity and Condition Status (Side by Side) -->
	<div class="grid grid-cols-2 gap-4 mb-4">
		<!-- Quantity -->
		<div>
			<label for="quantity" class="block text-sm font-medium text-gray-700 mb-1">
				Quantity <span class="text-red-600">*</span>
			</label>
			<input
				type="number"
				id="quantity"
				name="quantity"
				value={getValue('quantity', 1)}
				min="1"
				required
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
				class:border-red-500={errors.quantity}
			/>
			{#if errors.quantity}
				<p class="text-red-600 text-sm mt-1">{errors.quantity}</p>
			{/if}
		</div>

		<!-- Condition Status -->
		<div>
			<label for="conditionStatus" class="block text-sm font-medium text-gray-700 mb-1">
				Condition Status
			</label>
			<select
				id="conditionStatus"
				name="conditionStatus"
				value={getValue('conditionStatus', 'GOOD')}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
			>
				<option value="GOOD">Good</option>
				<option value="NEEDS_REPAIR">Needs Repair</option>
				<option value="DAMAGED">Damaged</option>
				<option value="LOST">Lost</option>
			</select>
		</div>
	</div>

	<!-- Donor -->
	<div class="mb-6">
		<label for="donor" class="block text-sm font-medium text-gray-700 mb-1">
			Donor (Optional)
		</label>
		<input
			type="text"
			id="donor"
			name="donor"
			value={getValue('donor')}
			placeholder="Name of person or organization who donated this tool"
			class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
		/>
	</div>

	<!-- Form Actions -->
	<div class="flex gap-3 justify-end pt-4 border-t border-gray-200">
		<a
			href={tool ? `/tools/${tool.id}` : '/tools'}
			class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
		>
			Cancel
		</a>
		<button
			type="submit"
			disabled={isSubmitting}
			class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{isSubmitting ? 'Saving...' : submitText}
		</button>
	</div>
</form>
