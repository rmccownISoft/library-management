import type { PageServerLoad } from './$types'
import prisma from '$lib/prisma'

export const load: PageServerLoad = async ({ url }) => {
	const searchQuery = url.searchParams.get('search') || ''

	const [tools, categories] = await Promise.all([
		prisma.tool.findMany({
			where: searchQuery ? {
				name: { contains: searchQuery }
			} : undefined,
			include: {
				category: true,
				files: {
					take: 1,
					orderBy: {
						id: 'asc'
					}
				}
			},
			orderBy: {
				name: 'asc'
			}
		}),
		prisma.category.findMany({
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
	])

	// Add _count to all categories (including nested children)
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
			const toolCount = tools.filter(t => descendantIds.includes(t.categoryId)).length

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

	return {
		tools,
		categories: categoriesWithCounts,
		searchQuery
	}
}
