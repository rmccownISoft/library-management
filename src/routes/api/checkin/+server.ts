import { json } from '@sveltejs/kit'
import prisma from '$lib/prisma'

export const POST = async ({ request }: { request: Request }) => {
	try {
		const { checkoutId } = await request.json()

		// Validate input
		if (!checkoutId || typeof checkoutId !== 'number') {
			return json({ error: 'Invalid checkout ID' }, { status: 400 })
		}

		// Verify checkout exists and is currently checked out
		const checkout = await prisma.checkout.findUnique({
			where: { id: checkoutId },
			include: {
				tool: true,
				patron: true
			}
		})

		if (!checkout) {
			return json({ error: 'Checkout not found' }, { status: 404 })
		}

		if (checkout.status !== 'CHECKED_OUT') {
			return json({ 
				error: 'This item has already been checked in' 
			}, { status: 400 })
		}

		// Check if item is overdue
		const now = new Date()
		const isOverdue = now > new Date(checkout.dueDate)

		// Update checkout record
		const updatedCheckout = await prisma.checkout.update({
			where: { id: checkoutId },
			data: {
				checkinDate: now,
				checkinVolunteerId: 1, // Default volunteer ID for now
				status: 'RETURNED',
				wasOverdue: isOverdue || checkout.wasOverdue
			}
		})

		// If it was overdue, increment patron's overdue count
		if (isOverdue && checkout.status === 'CHECKED_OUT') {
			await prisma.patron.update({
				where: { id: checkout.patronId },
				data: {
					overdueCount: {
						increment: 1
					}
				}
			})
		}

		return json({ 
			success: true,
			checkout: updatedCheckout,
			message: `Successfully checked in ${checkout.tool.name}`,
			wasOverdue: isOverdue
		})

	} catch (error) {
		console.error('Check-in error:', error)
		return json({ error: 'Internal server error' }, { status: 500 })
	}
}
