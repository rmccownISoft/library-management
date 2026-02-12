import { json } from '@sveltejs/kit'
import prisma from '$lib/prisma'

export const POST = async ({ request }: { request: Request }) => {
    try {
        const { patronId, toolIds, returnDate } = await request.json()

        // Validate input
        if (!patronId || !Array.isArray(toolIds) || toolIds.length === 0 || !returnDate) {
            return json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Verify patron exists
        const patron = await prisma.patron.findUnique({
            where: { id: patronId }
        })

        if (!patron) {
            return json({ error: 'Patron not found' }, { status: 404 })
        }

        // Verify all tools exist and are available
        const tools = await prisma.tool.findMany({
            where: { id: { in: toolIds } },
            include: {
                checkouts: {
                    where: { status: 'CHECKED_OUT' }
                }
            }
        })

        if (tools.length !== toolIds.length) {
            return json({ error: 'One or more tools not found' }, { status: 404 })
        }

        // Check availability
        for (const tool of tools) {
            const checkedOutCount = tool.checkouts.length
            const available = tool.quantity - checkedOutCount
            
            if (available <= 0) {
                return json({ 
                    error: `Tool "${tool.name}" is not available for checkout` 
                }, { status: 400 })
            }
        }

        // Create checkouts in a transaction
        const checkouts = await prisma.$transaction(async (tx) => {
            const results = []
            
            for (const toolId of toolIds) {
                const checkout = await tx.checkout.create({
                    data: {
                        toolId,
                        patronId,
                        volunteerId: 1, // Default volunteer ID for now
                        dueDate: new Date(returnDate),
                        checkoutPeriod: Math.ceil(
                            (new Date(returnDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                        )
                    }
                })
                results.push(checkout)
            }
            
            return results
        })

        return json({ 
            success: true, 
            checkouts: checkouts.map(c => c.id),
            message: `Successfully checked out ${checkouts.length} tool(s)`,
            count: checkouts.length
        })

    } catch (error) {
        console.error('Checkout error:', error)
        return json({ error: 'Internal server error' }, { status: 500 })
    }
}
