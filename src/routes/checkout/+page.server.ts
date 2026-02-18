import prisma from '$lib/prisma'
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url, locals }) => {
    // Redirect to login if not authenticated
    if (!locals.user) {
        throw redirect(303, '/login')
    }
    
    try {
        // Get tools with availability counts and categories
        const tools = await prisma.tool.findMany({
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
            ]
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

        // Get categories with same structure as tools page
        const categories = await prisma.category.findMany({
            include: {
                children: {
                    include: {
                        children: {
                            include: {
                                children: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        tools: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        // Add _count to all categories (including nested children) like tools page
        type CategoryWithCount = typeof categories[0] & {
            children: CategoryWithCount[]
        }

        // Helper function to get all descendant category IDs
        const getDescendantIds = (category: typeof categories[0]): number[] => {
            const ids = [category.id]
            if (category.children) {
                for (const child of category.children as typeof categories) {
                    ids.push(...getDescendantIds(child))
                }
            }
            return ids
        }

        const addCountToCategories = (cats: typeof categories): CategoryWithCount[] => {
            return cats.map(category => {
                // Get all descendant category IDs (including this category)
                const descendantIds = getDescendantIds(category)
                
                // Count tools in this category and all descendants
                const toolCount = toolsWithAvailability.filter(t => descendantIds.includes(t.categoryId)).length

                return {
                    ...category,
                    _count: {
                        tools: toolCount
                    },
                    children: category.children ? addCountToCategories(category.children as typeof categories) : []
                }
            })
        }

        const categoriesWithCounts = addCountToCategories(categories)

        // Check for pre-selected patron from URL parameter
        const preSelectedPatronId = url.searchParams.get('patronId')
        let preSelectedPatron = null
        
        if (preSelectedPatronId) {
            preSelectedPatron = await prisma.patron.findUnique({
                where: { id: parseInt(preSelectedPatronId) }
            })
        }

        // Get patrons (empty array, PatronSelector will load them via search)
        const patrons: never[] = []

        return {
            tools: toolsWithAvailability,
            categories: categoriesWithCounts,
            patrons,
            preSelectedPatron
        }
    } catch (error) {
        console.error('Error loading checkout page data:', error)
        return {
            tools: [],
            categories: [],
            patrons: [],
            preSelectedPatron: null
        }
    }
}
