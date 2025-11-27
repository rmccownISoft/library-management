<script lang="ts">
    import { enhance } from '$app/forms'
    import type { CategoryModel, ToolModel } from '$generated/prisma/models'
	import CameraCapture from './CameraCapture.svelte'
	
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
	let selectedFiles = $state<FileList | null>(null)
	let showCamera = $state(false)
	let capturedPhotos = $state<{ file: File; dataUrl: string }[]>([])

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
	
	// Handle camera capture
	function handleCameraCapture(dataUrl: string, file: File) {
		capturedPhotos = [...capturedPhotos, { file, dataUrl }]
	}
	
	function toggleCamera() {
		showCamera = !showCamera
	}
	
	function removeCapturedPhoto(index: number) {
		capturedPhotos = capturedPhotos.filter((_, i) => i !== index)
	}
	
</script>

<form 
	method="POST"
	enctype="multipart/form-data"
	use:enhance={({ formData }) => {
		isSubmitting = true;
		
		// Add captured photos directly to FormData
		capturedPhotos.forEach((photo, index) => {
			formData.append('toolFiles', photo.file);
		});
		
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

	<!-- File Upload Section -->
	<div class="mb-6">
		<label class="block text-sm font-medium text-gray-700 mb-2">
			Add Picture(s)
		</label>
		
		<div class="flex gap-2 mb-3">
			<!-- File Upload Button -->
			<input
				type="file"
				id="toolFiles"
				name="toolFiles"
				multiple
				accept="image/*"
				class="sr-only"
				onchange={(e) => {
					const target = e.target as HTMLInputElement;
					selectedFiles = target.files;
				}}
			/>
			<label
				for="toolFiles"
				class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors font-medium text-gray-700"
			>
				<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
				</svg>
				Choose Files
			</label>
			
			<!-- Camera Button -->
			<button
				type="button"
				onclick={toggleCamera}
				class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
			>
				<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
				{showCamera ? 'Hide Camera' : 'Take Photo'}
			</button>
		</div>
		
		<!-- Camera Component -->
		{#if showCamera}
			<div class="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
				<CameraCapture 
					oncapture={handleCameraCapture}
					onclose={toggleCamera}
					captureWidth={800}
				/>
			</div>
		{/if}
		
		<!-- Display selected files from file input -->
		{#if selectedFiles && selectedFiles.length > 0}
			<div class="mt-3">
				<p class="text-sm font-medium text-gray-700 mb-2">Selected Files:</p>
				<div class="space-y-1 text-sm text-gray-600">
					{#each Array.from(selectedFiles) as file}
						<div class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
							<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<span class="flex-1">{file.name}</span>
							<span class="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- Display captured photos as thumbnails -->
		{#if capturedPhotos.length > 0}
			<div class="mt-3">
				<p class="text-sm font-medium text-gray-700 mb-2">Captured Photos:</p>
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
					{#each capturedPhotos as photo, index}
						<div class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-500">
							<img 
								src={photo.dataUrl} 
								alt="Captured photo {index + 1}"
								class="w-full h-full object-cover"
							/>
							<!-- Delete button - always visible for touch devices -->
							<button
								type="button"
								onclick={() => removeCapturedPhoto(index)}
								class="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 active:scale-95 transition-all duration-200 shadow-lg z-10"
								title="Remove photo"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		
		{#if (selectedFiles?.length || 0) + capturedPhotos.length === 0}
			<p class="text-sm text-gray-500 mt-2">No files selected or photos captured yet</p>
		{:else}
			<p class="text-sm text-gray-600 mt-2">
				Total: {(selectedFiles?.length || 0) + capturedPhotos.length} file{((selectedFiles?.length || 0) + capturedPhotos.length) !== 1 ? 's' : ''}
			</p>
		{/if}
	</div>
	
	
	<!-- Form Actions -->
	<div class="flex gap-3 justify-end pt-4 border-t border-gray-200">
		<a
			href={tool ? `/tools/${tool.id}` : '/tools'}
			class="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700"
			style="display: inline-block; text-decoration: none; background-color: white;"
		>
			Cancel
		</a>
		<button
			type="submit"
			disabled={isSubmitting}
			class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
			style="display: inline-block;"
		>
			{isSubmitting ? 'Saving...' : submitText}
		</button>
	</div>
</form>
