<script lang="ts">
    import type { PageData } from './$types'
    import ToolForm from '$lib/components/ToolForm.svelte'

    let { data } = $props<{ data: PageData }>()
    let selectedImage = $state<{ id: string; fileName: string } | null>(null);

</script>

<div class="max-w-4xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
        <a href="/tools/{data.tool.id}" class="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Tool Details
        </a>
        
        <h1 class="text-3xl font-bold text-gray-900">
            Edit Tool: {data.tool.name}
        </h1>
    </div>

    <!-- Tool Form -->
    <ToolForm 
        categories={data.categories}
        tool={data.tool}
        submitText="Update Tool"
    />
    <!-- Image Gallery -->
    {#if data.tool.files && data.tool.files.length > 0}
    	<div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
    		<h2 class="text-xl font-semibold mb-4 text-gray-900">Current Images</h2>
    		<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
    			{#each data.tool.files as file}
    				<button
    					type="button"
    					onclick={() => selectedImage = file}
    					class="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
    				>
    					<img 
    						src="/api/files/{file.id}" 
    						alt={file.fileName}
    						class="w-full h-48 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
    					/>
    				</button>
    			{/each}
    		</div>
    	</div>
    {/if}
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