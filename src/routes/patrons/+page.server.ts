import type { PageServerLoad } from './$types'
import prisma from '$lib/prisma'

export const load: PageServerLoad = async ({url}) => {
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
