import type { PageServerLoad } from './$types'
import { error, redirect } from '@sveltejs/kit'
import prisma from '$lib/prisma'

export const load: PageServerLoad = async ({ params, locals }) => {
	// Redirect to login if not authenticated
	if (!locals.user) {
		throw redirect(303, '/login')
	}
	
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