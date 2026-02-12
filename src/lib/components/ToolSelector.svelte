<script lang="ts">
    import type { ToolModel, CategoryModel } from '../../generated/prisma/models'
    import Button from '$lib/components/Button.svelte'

    let { 
        tools, 
        categories,
        onAddTool,
        selectedTools
    }: {
        tools: (ToolModel & { category: CategoryModel, availableCount: number })[];
        categories: (CategoryModel & { children?: CategoryModel[] })[];
        onAddTool: (tool: ToolModel & { category: CategoryModel }) => void;
        selectedTools: (ToolModel & { category: CategoryModel })[];
    } = $props()

    // Tool search and filtering state
    let searchQuery = $state('')
    let selectedCategoryId = $state<number | null>(null)
    let searchResults = $state<typeof tools>([])
    let hasSearched = $state(false)

    // Helper function to get all descendant category IDs
    function getCategoryAndDescendants(categoryId: number): number[] {
        const ids = [categoryId]
        const category = categories.find(c => c.id === categoryId)
        
        if (category?.children) {
            for (const child of category.children) {
                ids.push(...getCategoryAndDescendants(child.id))
            }
        }
        
        return ids
    }

    // Filter tools by category and search
    const filteredTools = $derived.by(() => {
        if (hasSearched) return searchResults
        
        let filtered = [...tools]
        
        if (selectedCategoryId !== null) {
            // Get selected category and all its descendants
            const categoryIds = getCategoryAndDescendants(selectedCategoryId)
            filtered = filtered.filter(tool => categoryIds.includes(tool.categoryId))
        }
        
        return filtered
    })

    // Perform search
    async function performSearch(event: SubmitEvent) {
        event.preventDefault()
        
        if (!searchQuery.trim()) {
            hasSearched = false
            return
        }
        
        const response = await fetch(`/api/tools/search?search=${encodeURIComponent(searchQuery.trim())}`)
        const data = await response.json()
        
        searchResults = data.tools || []
        hasSearched = true
    }

    function clearSearch() {
        searchQuery = ''
        selectedCategoryId = null
        searchResults = []
        hasSearched = false
    }

    // Check if tool is already selected
    function isToolSelected(toolId: number): boolean {
        return selectedTools.some(t => t.id === toolId)
    }

    // Get category name by ID
    function getCategoryName(categoryId: number): string {
        const category = categories.find(c => c.id === categoryId)
        return category?.name || 'Unknown'
    }
</script>

<div class="tool-selector">
    <!-- Tool Selection -->
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Select Tools for Checkout</h2>
        
        <!-- Search -->
        <form onsubmit={performSearch} class="mb-4">
            <div class="flex gap-2">
                <input
                    type="search"
                    placeholder="Search tools by name..."
                    bind:value={searchQuery}
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                    type="submit"
                    class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Search
                </button>
                {#if hasSearched || selectedCategoryId !== null}
                    <button
                        type="button"
                        onclick={clearSearch}
                        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                    >
                        Clear
                    </button>
                {/if}
            </div>
        </form>

        <!-- Category Filter -->
        {#if !hasSearched}
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
                <select
                    bind:value={selectedCategoryId}
                    class="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                    <option value={null}>All Categories</option>
                    {#each categories as category}
                        <option value={category.id}>{category.name}</option>
                    {/each}
                </select>
            </div>
        {/if}

        <!-- Tools List -->
        {#if filteredTools.length === 0}
            <p class="text-gray-500 italic text-center py-8">
                {#if hasSearched}
                    No tools found matching your search
                {:else if selectedCategoryId !== null}
                    No tools found in selected category
                {:else}
                    No tools available
                {/if}
            </p>
        {:else}
            <div class="space-y-3 max-h-96 overflow-y-auto">
                {#each filteredTools as tool (tool.id)}
                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <h3 class="font-medium text-gray-900">{tool.name}</h3>
                                    <span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                        {getCategoryName(tool.categoryId)}
                                    </span>
                                </div>
                                
                                <p class="text-gray-600 text-sm mb-2 line-clamp-2">{tool.description}</p>
                                
                                <div class="flex items-center gap-4 text-sm text-gray-600">
                                    <span>Total: {tool.quantity}</span>
                                    <span class="flex items-center gap-1">
                                        Available: 
                                        <span class="font-medium {tool.availableCount > 0 ? 'text-green-600' : 'text-red-600'}">
                                            {tool.availableCount}
                                        </span>
                                    </span>
                                    <span class="px-2 py-1 rounded text-xs
                                        {tool.conditionStatus === 'GOOD' ? 'bg-green-100 text-green-800' : ''}
                                        {tool.conditionStatus === 'NEEDS_REPAIR' ? 'bg-yellow-100 text-yellow-800' : ''}
                                        {tool.conditionStatus === 'DAMAGED' ? 'bg-red-100 text-red-800' : ''}
                                        {tool.conditionStatus === 'LOST' ? 'bg-gray-200 text-gray-700' : ''}">
                                        {tool.conditionStatus.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="ml-4">
                                {#if isToolSelected(tool.id)}
                                    <span class="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                                        Selected
                                    </span>
                                {:else if tool.availableCount <= 0}
                                    <span class="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
                                        Unavailable
                                    </span>
                                {:else}
                                    <Button
                                        variant="primary"
                                        onclick={() => onAddTool({ ...tool, category: tool.category })}
                                    >
                                        Add to Checkout
                                    </Button>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>