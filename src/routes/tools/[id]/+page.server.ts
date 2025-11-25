import type { PageServerLoad, Actions } from './$types'
import { error, redirect } from '@sveltejs/kit'
import prisma from '$lib/prisma'

export const load: PageServerLoad = async ({ params }) => {
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
			}
        }
    })

    if (!tool) {
        throw error(404, 'Tool not found')
    }

    return { tool }
}


export const actions: Actions = {
	delete: async ({ params }) => {
		const toolId = parseInt(params.id);
		
		// Delete associated files and damage reports (cascade)
		await prisma.tool.delete({
			where: { id: toolId }
		});
		
		throw redirect(303, '/tools')
	}
}