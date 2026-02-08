<script lang="ts">
    import type { PageData } from './$types'
    import Button from '$lib/components/Button.svelte'

    let { data }: { data: PageData } = $props()

    // Search form state
    let searchLastName = $state(data.searchLastName)
    let searchFirstName = $state(data.searchFirstName)

    // Check if we have active search
    const hasActiveSearch = data.searchLastName || data.searchFirstName
</script>

<div class="p-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Patrons</h1>
        <Button variant="success" type="a" href="/patrons/new">
            + Add New Patron
        </Button>
    </div>

    <!-- Search Section -->
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Search Patrons</h2>
        
        <form method="GET" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
                        Last Name <span class="text-gray-500">(primary search)</span>
                    </label>
                    <input
                        type="text"
                        id="lastName"
                        name="lastName"
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
                        name="firstName"
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
                    Search
                </button>
                
                {#if hasActiveSearch}
                    <button
                        type="button"
                        onclick={() => {
                            searchLastName = ''
                            searchFirstName = ''
                            window.location.href = '/patrons'
                        }}
                        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                    >
                        Clear
                    </button>
                {/if}
            </div>
        </form>

        {#if hasActiveSearch}
            <div class="mt-4 text-sm text-gray-600">
                <span class="inline-flex items-center">
                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Showing {data.patrons.length} patron{data.patrons.length !== 1 ? 's' : ''} 
                    {#if data.searchLastName && data.searchFirstName}
                        for "{data.searchLastName}, {data.searchFirstName}"
                    {:else if data.searchLastName}
                        for last name "{data.searchLastName}"
                    {:else if data.searchFirstName}
                        for first name "{data.searchFirstName}"
                    {/if}
                </span>
            </div>
        {/if}
    </div>

    <!-- Results Table -->
    {#if data.patrons.length === 0}
        <div class="text-center py-12">
            {#if hasActiveSearch}
                <p class="text-gray-500 text-lg">No patrons found matching your search criteria</p>
                <p class="text-gray-400 text-sm mt-2">Try searching with a different name or clearing the search</p>
            {:else}
                <p class="text-gray-500 text-lg">No patrons found</p>
                <p class="text-gray-400 text-sm mt-2">Add your first patron to get started</p>
            {/if}
        </div>
    {:else}
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <!-- Desktop Table -->
            <div class="hidden md:block">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="text-left px-6 py-4 font-semibold text-gray-900">Name</th>
                            <th class="text-left px-6 py-4 font-semibold text-gray-900">Contact</th>
                            <th class="text-left px-6 py-4 font-semibold text-gray-900">Street Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.patrons as patron (patron.id)}
                            <tr 
                                class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                onclick={() => window.location.href = `/patrons/${patron.id}`}
                            >
                                <td class="px-6 py-4">
                                    <div class="font-medium text-gray-900">
                                        {patron.lastName}, {patron.firstName}
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-gray-900">
                                        {#if patron.phone}
                                            <div>{patron.phone}</div>
                                        {/if}
                                        {#if patron.email}
                                            <div class="text-gray-600 text-sm">{patron.email}</div>
                                        {/if}
                                        {#if !patron.phone && !patron.email}
                                            <span class="text-gray-400 italic">No contact info</span>
                                        {/if}
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-gray-900">
                                        {patron.mailingStreet}
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Mobile Card Layout -->
            <div class="md:hidden">
                {#each data.patrons as patron (patron.id)}
                    <div 
                        class="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors last:border-b-0"
                        onclick={() => window.location.href = `/patrons/${patron.id}`}
                    >
                        <div class="font-medium text-gray-900 mb-2">
                            {patron.lastName}, {patron.firstName}
                        </div>
                        
                        {#if patron.phone || patron.email}
                            <div class="text-sm text-gray-600 mb-2">
                                {#if patron.phone}
                                    <div>{patron.phone}</div>
                                {/if}
                                {#if patron.email}
                                    <div>{patron.email}</div>
                                {/if}
                            </div>
                        {/if}
                        
                        <div class="text-sm text-gray-600">
                            {patron.mailingStreet}
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Click instruction -->
        <div class="mt-4 text-center">
            <p class="text-gray-500 text-sm">Click any row to view patron details</p>
        </div>
    {/if}
</div>
