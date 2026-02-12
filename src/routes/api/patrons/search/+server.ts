import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'
import prisma from '$lib/prisma'

export const GET: RequestHandler = async ({ url }) => {
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

    // Return empty if no search criteria provided
    if (searchConditions.length === 0) {
        return json({ patrons: [] })
    }

    try {
        const patrons = await prisma.patron.findMany({
            where: {
                AND: searchConditions
            },
            orderBy: [
                { lastName: 'asc' },
                { firstName: 'asc' }
            ],
            take: 50 // Limit results for performance
        })

        return json({ patrons })
    } catch (error) {
        console.error('Error searching patrons:', error)
        return json({ error: 'Failed to search patrons' }, { status: 500 })
    }
}