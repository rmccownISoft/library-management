import type { PageServerLoad, Actions } from './$types'
import { redirect, fail } from '@sveltejs/kit'
import prisma from '$lib/prisma'

export const load: PageServerLoad = async ({ locals }) => {
	// Protect route - only admins can access
	if (!locals.user) {
		throw redirect(303, '/login')
	}
	
	if (locals.user.role !== 'ADMIN') {
		throw redirect(303, '/')
	}

	// Load all categories with nested children and tool counts
	const categories = await prisma.category.findMany({
		include: {
			_count: { 
				select: { tools: true } 
			},
			parent: true,
			children: {
				include: {
					_count: { select: { tools: true } },
					children: {
						include: {
							_count: { select: { tools: true } },
							children: {
								include: {
									_count: { select: { tools: true } }
								}
							}
						}
					}
				}
			}
		},
		orderBy: {
			name: 'asc'
		}
	})

	return {
		categories
	}
}

export const actions: Actions = {
	// Create new category
	create: async ({ request, locals }) => {
		// Verify admin role
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'Unauthorized' })
		}

		const formData = await request.formData()
		console.log('formData: ', formData)
		const name = formData.get('name') as string
		const parentIdStr = formData.get('parentId') as string
		const parentId = parentIdStr ? parseInt(parentIdStr) : null

		// Validation
		if (!name || name.trim().length === 0) {
			return fail(400, { 
				error: 'Category name is required',
				field: 'name'
			})
		}

		// Check for duplicate name under the same parent
		const existing = await prisma.category.findFirst({
			where: { 
				name: name.trim(),
				parentId: parentId
			}
		})

		if (existing) {
			return fail(400, {
				error: parentId 
					? 'A category with this name already exists under the selected parent'
					: 'A top-level category with this name already exists',
				field: 'name'
			})
		}

		// Create category
		await prisma.category.create({
			data: {
				name: name.trim(),
				parentId: parentId
			}
		})

		return { 
			success: true, 
			message: 'Category created successfully' 
		}
	},

	// Update existing category
	update: async ({ request, locals }) => {
		// Verify admin role
		if (!locals.user || locals.user.role !== 'ADMIN') {
			return fail(403, { error: 'Unauthorized' })
		}

		const formData = await request.formData()
		const id = parseInt(formData.get('id') as string)
		const name = formData.get('name') as string
		const parentIdStr = formData.get('parentId') as string
		const parentId = parentIdStr ? parseInt(parentIdStr) : null

		// Validation
		if (!name || name.trim().length === 0) {
			return fail(400, {
				error: 'Category name is required',
				field: 'name',
				editingId: id
			})
		}

		// Check for duplicate name under the same parent (excluding self)
		const existing = await prisma.category.findFirst({
			where: { 
				name: name.trim(),
				parentId: parentId,
				id: { not: id }
			}
		})

		if (existing) {
			return fail(400, {
				error: parentId 
					? 'A category with this name already exists under the selected parent'
					: 'A top-level category with this name already exists',
				field: 'name',
				editingId: id
			})
		}

		// Prevent circular hierarchy
		if (parentId !== null) {
			// Can't be its own parent
			if (parentId === id) {
				return fail(400, {
					error: 'A category cannot be its own parent',
					field: 'parentId',
					editingId: id
				})
			}

			// Check if new parent is a descendant of this category
			const isCircular = await isDescendantOf(parentId, id)
			if (isCircular) {
				return fail(400, {
					error: 'Cannot create circular hierarchy - the selected parent is a descendant of this category',
					field: 'parentId',
					editingId: id
				})
			}
		}

		// Update category
		await prisma.category.update({
			where: { id },
			data: {
				name: name.trim(),
				parentId: parentId
			}
		})

		return {
			success: true,
			message: 'Category updated successfully'
		}
	}
}

/**
 * Check if potentialAncestorId is a descendant of categoryId
 */
async function isDescendantOf(potentialAncestorId: number, categoryId: number): Promise<boolean> {
	let currentId: number | null = potentialAncestorId

	// Walk up the tree from potentialAncestorId
	while (currentId !== null) {
		if (currentId === categoryId) {
			return true // Found a circular reference
		}

		const category: { parentId: number | null } | null = await prisma.category.findUnique({
			where: { id: currentId },
			select: { parentId: true }
		})

		if (!category) break
		currentId = category.parentId
	}

	return false
}
