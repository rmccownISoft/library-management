import type { PageServerLoad, Actions } from './$types'
import { redirect, fail } from '@sveltejs/kit'
import prisma from '$lib/prisma'
import { ConditionStatus } from '$generated/prisma/enums'
import { writeMultipleFilesAndPrismaCreate } from '$lib/server/fileService'
import { EntityType } from '$generated/prisma/enums'


export const load: PageServerLoad = async () => {
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
			parent: true
		},
		orderBy: {
			name: 'asc'
		}
	})
	
	return { 
		categories,
		tool: null  // Indicates create mode
	}
}

// Server form action for saving tool
export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData()
		console.log('form data: ', formData)
		// Extract files from form data and filter out empty files
		const files = (formData.getAll('toolFiles') as Array<File>).filter(file => file.size > 0)
		console.log('extracted files: ', files)

		// Extract and validate form data
		const name = formData.get('name') as string
		const description = formData.get('description') as string
		const categoryId = formData.get('categoryId') as string
		const quantity = formData.get('quantity') as string
		const donor = formData.get('donor') as string
		const conditionStatus = formData.get('conditionStatus') as string
		
		// Validate conditionStatus is a valid enum value
		const validConditionStatuses = Object.values(ConditionStatus)
		const parsedConditionStatus = (conditionStatus && validConditionStatuses.includes(conditionStatus as ConditionStatus)) 
			? (conditionStatus as ConditionStatus)
			: ConditionStatus.GOOD
		
		// Validation
		const errors: Record<string, string> = {}
		
		if (!name || name.trim().length === 0) {
			errors.name = 'Tool name is required'
		}
		
		if (!categoryId || isNaN(parseInt(categoryId))) {
			errors.categoryId = 'Please select a category'
		}
		
		if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) < 1) {
			errors.quantity = 'Quantity must be at least 1'
		}
		
		if (Object.keys(errors).length > 0) {
			return fail(400, {
				errors,
				values: { name, description, categoryId, quantity, donor, conditionStatus }
			})
		}
		
		// Create tool
		const tool = await prisma.tool.create({
			data: {
				name: name.trim(),
				description: description?.trim() || '',
				categoryId: parseInt(categoryId),
				quantity: parseInt(quantity),
				donor: donor?.trim() || null,
				conditionStatus: parsedConditionStatus
			}
		})
		console.log('tool saved? : ', tool)
		// Save files to dir and add metadata to db 
		if (files.length && files[0].size > 0) {
			const fileResults = await writeMultipleFilesAndPrismaCreate(files, {
				entityType: EntityType.TOOL,
				entityId: tool.id,
				uploadedBy: 1, // TODO: Replace with actual user ID when authentication is implemented
				label: 'Tool Photo' // not sure what the intent of this field was
			})
			if (fileResults.failed.length < 0) {
				console.error(`Failed to save ${fileResults.failed.length} files for tool ${tool.id}`) // TODO: use proper error here?
			}
			console.log('page server file results: ', fileResults)
		}

		
		// Redirect to the new tool's detail page
		throw redirect(303, `/tools/${tool.id}`)
	}
}
