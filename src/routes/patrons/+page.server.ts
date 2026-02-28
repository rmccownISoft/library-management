import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'
import prisma from '$lib/prisma'

export const load: PageServerLoad = async ({ url, locals }) => {
    // Redirect to login if not authenticated
    if (!locals.user) {
        throw redirect(303, '/login')
    }
    
    const searchLastName = url.searchParams.get('lastName') || ''
    const searchFirstName = url.searchParams.get('firstName') || ''
    
    // Build search conditions
    const searchConditions = []
    if (searchLastName) {
        searchConditions.push({ lastName: { contains: searchLastName } })
    }
    if (searchFirstName) {
        searchConditions.push({ firstName: { contains: searchFirstName } })
    }

    // TODO: showInactive, showBlocked filters
    const patrons = await prisma.patron.findMany({
        where: searchConditions.length > 0 ? {
            AND: searchConditions
        } : undefined,
        orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' }
        ]
    })

    return {
        patrons, 
        searchLastName,
        searchFirstName
    }
}
