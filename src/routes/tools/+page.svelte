<script lang="ts">
    import type { PageData } from './$types'

    let { data }: { data: PageData } = $props()

    // Selected category state (null means "All Tools")
    let selectedCategoryId = $state<number | null>(null)

    // Search query state for input field
    let searchQuery = $state(data.searchQuery)
    
    // Active search query from server
    const activeSearch = data.searchQuery

    // Build category hierarchy (root categories only)
    const rootCategories = $derived(
        data.categories.filter(cat => !cat.parentId)
    )

    // Filter tools by selected category
    const filteredTools = $derived(() => {
        if (selectedCategoryId === null) {
            return data.tools
        }
        
        // Get selected category and all its descendants
        const categoryIds = getCategoryAndDescendants(selectedCategoryId)
        return data.tools.filter(tool => categoryIds.includes(tool.categoryId))
    })

    // Get category and all its descendants recursively
    function getCategoryAndDescendants(categoryId: number): number[] {
        const ids = [categoryId]
        const category = data.categories.find(c => c.id === categoryId)
        
        if (category?.children) {
            for (const child of category.children) {
                ids.push(...getCategoryAndDescendants(child.id))
            }
        }
        
        return ids
    }

    // Group tools by category
    const toolsByCategory = $derived(() => {
        const grouped = new Map<number, typeof data.tools>()
        
        for (const tool of filteredTools()) {
            const categoryId = tool.categoryId
            if (!grouped.has(categoryId)) {
                grouped.set(categoryId, [])
            }
            grouped.get(categoryId)?.push(tool)
        }
        
        return grouped
    })

    // Get category name by id
    function getCategoryName(categoryId: number): string {
        return data.categories.find(c => c.id === categoryId)?.name || 'Unknown'
    }
</script>

<div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-screen">
    <!-- Category Sidebar -->
    <aside class="bg-gray-50 p-6 border-r border-gray-200 lg:sticky lg:top-0 min-h-screen lg:max-h-screen overflow-y-auto">
        <h2 class="text-xl font-semibold mb-4 text-gray-900">Categories</h2>
        
        <button 
            class="w-full text-left px-3 py-2 my-1 rounded transition-colors text-gray-700 hover:bg-gray-200 {selectedCategoryId === null ? 'bg-blue-600 text-white font-medium hover:bg-blue-700' : ''}"
            onclick={() => selectedCategoryId = null}
        >
            All Tools ({data.tools.length})
        </button>

        {#each rootCategories as category}
            {@render categoryNode(category, 0)}
        {/each}
    </aside>

    <!-- Tools Content -->
    <main class="p-8">
        <h1 class="text-3xl font-bold mb-6 text-gray-900">
            {selectedCategoryId === null ? 'All Tools' : getCategoryName(selectedCategoryId)}
        </h1>

        <!-- Search Box -->
        <form method="GET" class="mb-8">
            <div class="flex gap-2">
                <input
                    type="search"
                    name="search"
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
                {#if searchQuery || activeSearch}
                    <button
                        type="button"
                        onclick={() => {
                            searchQuery = ''
                            window.location.href = '/tools'
                        }}
                        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                    >
                        Clear
                    </button>
                {/if}
            </div>
            {#if activeSearch}
                <p class="mt-2 text-sm text-gray-600">
                    Showing results for "<span class="font-semibold">{activeSearch}</span>" - {filteredTools().length} tool{filteredTools().length !== 1 ? 's' : ''} found
                </p>
            {/if}
        </form>

        {#if filteredTools().length === 0}
            <p class="text-gray-500 italic text-center py-8">No tools found</p>
        {:else}
            {#each [...toolsByCategory()] as [categoryId, tools]}
                <section class="mb-12">
                    <h2 class="text-2xl font-semibold text-gray-700 border-b-2 border-gray-200 pb-2 mb-4">
                        {getCategoryName(categoryId)}
                    </h2>
                    
                    <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 md:grid-cols-1">
                        {#each tools as tool (tool.id)}
                            <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <h3 class="text-xl font-semibold mb-2 text-gray-900">{tool.name}</h3>
                                <p class="text-gray-600 mb-4 text-sm">{tool.description}</p>
                                <div class="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <span class="text-gray-700 font-medium">Qty: {tool.quantity}</span>
                                    <span class="px-3 py-1 rounded-full text-xs font-medium
                                        {tool.conditionStatus === 'GOOD' ? 'bg-green-100 text-green-800' : ''}
                                        {tool.conditionStatus === 'NEEDS_REPAIR' ? 'bg-yellow-100 text-yellow-800' : ''}
                                        {tool.conditionStatus === 'DAMAGED' ? 'bg-red-100 text-red-800' : ''}
                                        {tool.conditionStatus === 'LOST' ? 'bg-gray-200 text-gray-700' : ''}">
                                        {tool.conditionStatus.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        {/each}
                    </div>
                </section>
            {/each}
        {/if}
    </main>
</div>

{#snippet categoryNode(category: typeof data.categories[0], level: number)}
    <div style="padding-left: {level * 1.25}rem">
        <button 
            class="w-full text-left px-3 py-2 my-1 rounded transition-colors text-sm text-gray-700 hover:bg-gray-200 {selectedCategoryId === category.id ? 'bg-blue-600 text-white font-medium hover:bg-blue-700' : ''}"
            onclick={() => selectedCategoryId = category.id}
        >
            {category.name} ({category._count.tools})
        </button>
        
        {#if category.children.length > 0}
            {#each category.children as child}
                {@render categoryNode(child, level + 1)}
            {/each}
        {/if}
    </div>
{/snippet}
