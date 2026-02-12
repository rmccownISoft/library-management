import type { PageServerLoad, Actions } from './$types'
import prisma from '$lib/prisma'
import { error, redirect, fail } from '@sveltejs/kit'
import { ConditionStatus, EntityType } from '$generated/prisma/enums'
import { writeMultipleFilesAndPrismaCreate } from '$lib/server/fileService'


export const load: PageServerLoad = async({ params }) => {
    const toolId = parseInt(params.id)

    if (isNaN(toolId)) {
        throw error(400, 'Invalid tool ID')
    }
    
    const [tool, categories] = await Promise.all([
        prisma.tool.findUnique({
            where: { id: toolId},
            include: {
                category: true,
                files: true,
                damageReports: {
                    include: {
                        reporter: true 
                    },
                    orderBy: { reportedAt: 'desc'}
                }
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
                parent: true
            },
            orderBy: {
                name: 'asc'
            }
        })
    ])

    if (!tool) {
        throw error(404, 'Tool not found')
    }
    
    return { tool, categories }
}

export const actions: Actions = {
    default: async ({ request, params, locals }) => {
        // Check authentication
        if (!locals.user) {
            return fail(401, { error: 'You must be logged in to edit tools' })
        }
        
        const toolId = parseInt(params.id)
        
        if (isNaN(toolId)) {
            throw error(400, 'Invalid tool ID')
        }
        
        const formData = await request.formData()
        
        // Extract files from form data and filter out empty files
        const files = (formData.getAll('toolFiles') as Array<File>).filter(file => file.size > 0)
        
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
        
        // Update tool
        await prisma.tool.update({
            where: { id: toolId },
            data: {
                name: name.trim(),
                description: description?.trim() || '',
                categoryId: parseInt(categoryId),
                quantity: parseInt(quantity),
                donor: donor?.trim() || null,
                conditionStatus: parsedConditionStatus
            }
        })
        
        // Save new files if any
        if (files.length > 0) {
            await writeMultipleFilesAndPrismaCreate(files, {
                entityType: EntityType.TOOL,
                entityId: toolId,
                uploadedBy: locals.user.id,
                label: 'Tool Photo'
            })
        }
        
        // Redirect back to tool detail page
        throw redirect(303, `/tools/${toolId}`)
    }
}
