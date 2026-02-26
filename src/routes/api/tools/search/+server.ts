import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'
import prisma from '$lib/prisma'

export const GET: RequestHandler = async ({ url, locals }) => {
    // Require authentication to search tools
    if (!locals.user) {
        return json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const searchQuery = url.searchParams.get('search') || ''
    
    // Return empty if no search query provided
    if (!searchQuery.trim()) {
        return json({ tools: [] })
    }

    try {
        // Get tools with availability counts and categories
        const tools = await prisma.tool.findMany({
            where: {
                name: {
                    contains: searchQuery.trim()
                }
            },
            include: {
                category: true,
                checkouts: {
                    where: {
                        status: 'CHECKED_OUT'
                    }
                }
            },
            orderBy: [
                { category: { name: 'asc' } },
                { name: 'asc' }
            ],
            take: 50 // Limit results for performance
        })

        // Calculate available counts for each tool
        const toolsWithAvailability = tools.map(tool => {
            const checkedOutCount = tool.checkouts.length
            const availableCount = tool.quantity - checkedOutCount
            
            return {
                ...tool,
                availableCount,
                checkouts: undefined // Remove checkouts from response for performance
            }
        })

        return json({ tools: toolsWithAvailability })
    } catch (error) {
        console.error('Error searching tools:', error)
        return json({ error: 'Failed to search tools' }, { status: 500 })
    }
}