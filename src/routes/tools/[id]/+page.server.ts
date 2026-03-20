import type { PageServerLoad, Actions } from './$types'
import { error, redirect } from '@sveltejs/kit'
import prisma from '$lib/prisma'

export const load: PageServerLoad = async ({ params, locals }) => {
    // Redirect to login if not authenticated
    if (!locals.user) {
        throw redirect(303, '/login')
    }
    
    const toolId = parseInt(params.id)

    if (isNaN(toolId)) {
        throw error(400, 'Invalid tool ID')
    }

    const tool = await prisma.tool.findUnique({
        where: { id: toolId},
        include: {
			category: true,
			files: true,
			damageReports: {
				include: {
					reporter: true  // Include when user system is implemented
				},
				orderBy: { reportedAt: 'desc' }
			},
			checkouts: {
				where: { status: 'CHECKED_OUT' },
				select: { dueDate: true }
			}
        }
    })

    if (!tool) {
        throw error(404, 'Tool not found')
    }

    const { checkouts, ...toolData } = tool
    const checkedOutCount = checkouts.length
    const availableCount = tool.quantity - checkedOutCount
    const soonestDueDate = checkedOutCount > 0
        ? checkouts.reduce((min, c) => c.dueDate < min ? c.dueDate : min, checkouts[0].dueDate)
        : null

    return { tool: { ...toolData, checkedOutCount, availableCount, soonestDueDate } }
}


export const actions: Actions = {
	delete: async ({ params, locals }) => {
		// Check authentication
		if (!locals.user) {
			throw redirect(303, '/login')
		}
		
		const toolId = parseInt(params.id);
		
		// Delete associated files and damage reports (cascade)
		await prisma.tool.delete({
			where: { id: toolId }
		});
		
		throw redirect(303, '/tools')
	}
}
