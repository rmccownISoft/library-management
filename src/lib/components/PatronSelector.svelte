<script lang="ts">
    import type { PatronModel } from '../../generated/prisma/models'
    import Button from '$lib/components/Button.svelte'

    let { 
        patrons, 
        onSelectPatron,
        selectedPatron 
    }: {
        patrons: PatronModel[];
        onSelectPatron: (patron: PatronModel | null) => void;
        selectedPatron?: PatronModel | null;
    } = $props()

    // Search form state
    let searchLastName = $state('')
    let searchFirstName = $state('')
    let searchResults = $state<PatronModel[]>([])
    let hasSearched = $state(false)

    // Perform search
    async function performSearch(event: SubmitEvent) {
        event.preventDefault()
        
        if (!searchLastName.trim() && !searchFirstName.trim()) return
        
        const params = new URLSearchParams()
        if (searchLastName.trim()) params.set('lastName', searchLastName.trim())
        if (searchFirstName.trim()) params.set('firstName', searchFirstName.trim())
        
        const response = await fetch(`/api/patrons/search?${params}`)
        const data = await response.json()
        
        searchResults = data.patrons || []
        hasSearched = true
    }

    function clearSearch() {
        searchLastName = ''
        searchFirstName = ''
        searchResults = []
        hasSearched = false
    }

    function handleSelectPatron(patron: PatronModel) {
        onSelectPatron(patron)
        clearSearch()
    }
</script>

<div class="patron-selector">
    {#if selectedPatron}
        <!-- Selected Patron Display -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-lg font-semibold text-green-900">Selected Patron</h3>
                    <p class="text-green-800 font-medium">{selectedPatron.lastName}, {selectedPatron.firstName}</p>
                    {#if selectedPatron.phone || selectedPatron.email}
                        <div class="text-sm text-green-700 mt-1">
                            {#if selectedPatron.phone}<div>{selectedPatron.phone}</div>{/if}
                            {#if selectedPatron.email}<div>{selectedPatron.email}</div>{/if}
                        </div>
                    {/if}
                </div>
                <button
                    type="button"
                    onclick={() => onSelectPatron(null)}
                    class="text-green-700 hover:text-green-900 font-medium"
                >
                    Change Patron
                </button>
            </div>
        </div>
    {:else}
        <!-- Patron Search -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Select Patron</h2>
            
            <form onsubmit={performSearch} class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
                            Last Name <span class="text-gray-500">(primary search)</span>
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            placeholder="Enter last name..."
                            bind:value={searchLastName}
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    
                    <div>
                        <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
                            First Name <span class="text-gray-500">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            placeholder="Enter first name..."
                            bind:value={searchFirstName}
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button
                        type="submit"
                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Search Patrons
                    </button>
                    
                    {#if hasSearched}
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

            <!-- Search Results -->
            {#if hasSearched}
                <div class="mt-6">
                    {#if searchResults.length === 0}
                        <p class="text-gray-500 text-center py-4">No patrons found matching your search</p>
                    {:else}
                        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div class="max-h-80 overflow-y-auto">
                                {#each searchResults as patron (patron.id)}
                                    <div 
                                        class="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors last:border-b-0 flex justify-between items-center"
                                        onclick={() => handleSelectPatron(patron)}
                                    >
                                        <div>
                                            <div class="font-medium text-gray-900">
                                                {patron.lastName}, {patron.firstName}
                                            </div>
                                            {#if patron.phone || patron.email}
                                                <div class="text-sm text-gray-600 mt-1">
                                                    {#if patron.phone}<div>{patron.phone}</div>{/if}
                                                    {#if patron.email}<div>{patron.email}</div>{/if}
                                                </div>
                                            {/if}
                                            <div class="text-sm text-gray-600 mt-1">
                                                {patron.mailingStreet}
                                            </div>
                                        </div>
                                        <Button variant="primary">
                                            Select
                                        </Button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                        <p class="mt-2 text-sm text-gray-600 text-center">
                            Found {searchResults.length} patron{searchResults.length !== 1 ? 's' : ''} - Click to select
                        </p>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
</div>