<script lang="ts">
    import type { PageData } from './$types'
    import type { PatronModel, ToolModel, CategoryModel } from '../../generated/prisma/models'
    import PatronSelector from '$lib/components/PatronSelector.svelte'
    import ToolSelector from '$lib/components/ToolSelector.svelte'
    import Button from '$lib/components/Button.svelte'

    let { data }: { data: PageData } = $props()

    // State management
    let selectedPatron = $state<PatronModel | null>(data.preSelectedPatron || null)
    let selectedTools = $state<(ToolModel & { category: CategoryModel })[]>([])
    let returnDate = $state('')
    let isSubmitting = $state(false)
    let successMessage = $state('')
    let errorMessage = $state('')

    // Initialize return date to 7 days from now
    $effect(() => {
        const defaultDate = new Date()
        defaultDate.setDate(defaultDate.getDate() + 7)
        returnDate = defaultDate.toISOString().split('T')[0]
    })

    // Handlers
    function handleSelectPatron(patron: PatronModel | null) {
        selectedPatron = patron
        // Clear any previous messages when changing patron
        successMessage = ''
        errorMessage = ''
    }

    function handleAddTool(tool: ToolModel & { category: CategoryModel }) {
        // Prevent duplicate tools
        if (!selectedTools.some(t => t.id === tool.id)) {
            selectedTools = [...selectedTools, tool]
        }
        // Clear any previous messages when adding tools
        successMessage = ''
        errorMessage = ''
    }

    function handleRemoveTool(toolId: number) {
        selectedTools = selectedTools.filter(t => t.id !== toolId)
        // Clear any previous messages when removing tools
        successMessage = ''
        errorMessage = ''
    }

    // Handle checkout submission
    async function handleCheckout() {
        if (!selectedPatron || selectedTools.length === 0 || !returnDate) return

        isSubmitting = true
        errorMessage = ''

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patronId: selectedPatron.id,
                    toolIds: selectedTools.map(t => t.id),
                    returnDate
                })
            })

            const result = await response.json()

            if (!response.ok) {
                errorMessage = result.error || 'Checkout failed'
                isSubmitting = false
                return
            }

            // Success - show message and reset form
            successMessage = `Successfully checked out ${result.count} tool${result.count !== 1 ? 's' : ''} to ${selectedPatron.firstName} ${selectedPatron.lastName}`
            
            // Reset form
            selectedPatron = null
            selectedTools = []
            const defaultDate = new Date()
            defaultDate.setDate(defaultDate.getDate() + 7)
            returnDate = defaultDate.toISOString().split('T')[0]

        } catch (error) {
            console.error('Checkout error:', error)
            errorMessage = 'An unexpected error occurred'
        } finally {
            isSubmitting = false
        }
    }

    // Calculate if form is ready for submission
    const canSubmit = $derived(selectedPatron && selectedTools.length > 0 && returnDate && !isSubmitting)
</script>

<div class="p-8 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Tool Checkout</h1>
        {#if data.preSelectedPatron}
            <p class="text-gray-600">
                Ready to checkout tools for <strong>{data.preSelectedPatron.firstName} {data.preSelectedPatron.lastName}</strong>.
                Select tools below to continue.
            </p>
        {:else}
            <p class="text-gray-600">Select a patron and tools to create a new checkout.</p>
        {/if}
    </div>

    <!-- Success/Error Messages -->
    {#if successMessage}
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center">
                <div class="text-green-800">
                    <svg class="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    {successMessage}
                </div>
            </div>
        </div>
    {/if}

    {#if errorMessage}
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
                <div class="text-red-800">
                    <svg class="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    </svg>
                    {errorMessage}
                </div>
            </div>
        </div>
    {/if}

    <!-- Progress Steps -->
    <div class="mb-8">
        <div class="flex items-center justify-center space-x-4">
            <!-- Step 1: Select Patron -->
            <div class="flex items-center">
                <div class="flex items-center justify-center w-8 h-8 rounded-full {selectedPatron ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'} font-medium">
                    1
                </div>
                <span class="ml-2 text-sm font-medium text-gray-900">Select Patron</span>
            </div>
            
            <div class="w-16 h-0.5 bg-gray-300"></div>
            
            <!-- Step 2: Select Tools -->
            <div class="flex items-center">
                <div class="flex items-center justify-center w-8 h-8 rounded-full {selectedTools.length > 0 ? 'bg-green-600 text-white' : selectedPatron ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-medium">
                    2
                </div>
                <span class="ml-2 text-sm font-medium text-gray-900">Select Tools</span>
            </div>
            
            <div class="w-16 h-0.5 bg-gray-300"></div>
            
            <!-- Step 3: Set Return Date -->
            <div class="flex items-center">
                <div class="flex items-center justify-center w-8 h-8 rounded-full {returnDate ? 'bg-green-600 text-white' : selectedTools.length > 0 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-medium">
                    3
                </div>
                <span class="ml-2 text-sm font-medium text-gray-900">Return Date</span>
            </div>
        </div>
    </div>

    <!-- Step 1: Patron Selection -->
    <PatronSelector 
        patrons={data.patrons}
        onSelectPatron={handleSelectPatron}
        selectedPatron={selectedPatron}
    />

    <!-- Step 2: Tool Selection (only show if patron selected) -->
    {#if selectedPatron}
        <ToolSelector
            tools={data.tools}
            categories={data.categories}
            onAddTool={handleAddTool}
            selectedTools={selectedTools}
        />

        <!-- Selected Tools Cart -->
        {#if selectedTools.length > 0}
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h2 class="text-lg font-semibold text-blue-900 mb-4">
                    Selected Tools ({selectedTools.length})
                </h2>
                
                <div class="space-y-3">
                    {#each selectedTools as tool (tool.id)}
                        <div class="flex justify-between items-center bg-white p-3 rounded border">
                            <div>
                                <span class="font-medium text-gray-900">{tool.name}</span>
                                <span class="text-sm text-gray-600 ml-2">({tool.category.name})</span>
                            </div>
                            <button
                                type="button"
                                onclick={() => handleRemoveTool(tool.id)}
                                class="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                                Remove
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Step 3: Return Date & Submit (only show if tools selected) -->
        {#if selectedTools.length > 0}
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Return Date & Checkout</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div>
                        <label for="returnDate" class="block text-sm font-medium text-gray-700 mb-2">
                            Return Date
                        </label>
                        <input
                            type="date"
                            id="returnDate"
                            bind:value={returnDate}
                            min={new Date().toISOString().split('T')[0]}
                            required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    
                    <div>
                        <Button 
                            variant="success" 
                            disabled={!canSubmit}
                            onclick={handleCheckout}
                            class="w-full"
                        >
                            {#if isSubmitting}
                                Processing...
                            {:else}
                                Complete Checkout
                            {/if}
                        </Button>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>