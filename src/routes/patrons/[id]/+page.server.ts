import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import prisma from '$lib/prisma'

export const load: PageServerLoad = async ({ params }) => {
	const patronId = parseInt(params.id)

	if (isNaN(patronId)) {
		throw error(400, 'Invalid patron ID')
	}

	const patron = await prisma.patron.findUnique({
		where: { id: patronId },
		include: {
			files: {
				orderBy: { uploadedAt: 'desc' }
			},
			checkouts: {
				include: {
					tool: {
						include: {
							category: true
						}
					},
					volunteer: true,
					checkinVolunteer: true
				},
				orderBy: {
					checkoutDate: 'desc'
				}
			}
		}
	})

	if (!patron) {
		throw error(404, 'Patron not found')
	}

	return { patron }
}