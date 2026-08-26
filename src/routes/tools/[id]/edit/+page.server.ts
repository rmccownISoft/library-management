import type { PageServerLoad, Actions } from './$types'
import prisma from '$lib/prisma'
import { error, redirect, fail } from '@sveltejs/kit'
import { ConditionStatus, EntityType } from '$generated/prisma/enums'
import { writeMultipleFilesAndPrismaCreate, summarizeFileFailures } from '$lib/server/fileService'
import { logActivity } from '$lib/server/activityLog'


export const load: PageServerLoad = async({ params, locals }) => {
    // Redirect to login if not authenticated
    if (!locals.user) {
        throw redirect(303, '/login')
    }
    
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
        
        let formData: FormData
        try {
            formData = await request.formData()
        } catch (e) {
            // Thrown when the request body exceeds BODY_SIZE_LIMIT before the
            // action ever runs — surface a friendly message instead of a raw 500.
            console.error('Failed to parse form data (body too large?):', e)
            return fail(413, {
                serverError: 'The files you selected are too large to upload. The maximum total upload size is 25 MB. Please use smaller or fewer files and try again.',
                errors: {},
                values: {}
            })
        }

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
        let fileFailures: Array<{ file: File; error: Error }> = []
        try {
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

            if (files.length > 0) {
                const fileResults = await writeMultipleFilesAndPrismaCreate(files, {
                    entityType: EntityType.TOOL,
                    entityId: toolId,
                    uploadedBy: locals.user.id,
                    label: 'Tool Photo'
                })
                fileFailures = fileResults.failed
            }

            await logActivity({
                action: 'EDIT_TOOL',
                userId: locals.user.id,
                payload: { toolId, name, description, categoryId, quantity, donor, conditionStatus },
                success: true,
                response: { toolId, filesUploaded: files.length - fileFailures.length, filesFailed: fileFailures.length }
            })

            if (fileFailures.length > 0) {
                await logActivity({
                    action: 'FILE_UPLOAD_FAILED',
                    userId: locals.user.id,
                    payload: { entityType: 'TOOL', entityId: toolId, fileNames: fileFailures.map(f => f.file.name) },
                    success: false,
                    response: { failures: fileFailures.map(f => ({ name: f.file.name, error: f.error.message })) }
                })
            }
        } catch (e) {
            console.error('Failed to update tool:', e)
            await logActivity({
                action: 'EDIT_TOOL',
                userId: locals.user.id,
                payload: { toolId, name, description, categoryId, quantity, donor, conditionStatus },
                success: false,
                response: { error: String(e) }
            })
            return fail(500, {
                serverError: 'An unexpected error occurred while saving the tool. Please try again.',
                errors: {},
                values: { name, description, categoryId, quantity, donor, conditionStatus }
            })
        }

        if (fileFailures.length > 0) {
            const msg = `Tool saved, but ${fileFailures.length} file(s) could not be uploaded — ${summarizeFileFailures(fileFailures)}`
            throw redirect(303, `/tools/${toolId}?fileWarning=${encodeURIComponent(msg)}`)
        }

        throw redirect(303, `/tools/${toolId}`)
    }
}
