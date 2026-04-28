import type { PageServerLoad, Actions } from './$types'
import { fail } from '@sveltejs/kit'
import prisma from '$lib/prisma'
import { logActivity } from '$lib/server/activityLog'
import { parseHours, DEFAULT_HOURS, LIBRARY_HOURS_KEY } from '$lib/server/systemSettings'

export const load: PageServerLoad = async () => {
	const setting = await prisma.systemSetting.findUnique({ where: { key: LIBRARY_HOURS_KEY } })
	return { hours: parseHours(setting?.value, DEFAULT_HOURS) }
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData()
		const raw = formData.get('hours')

		const hours = parseHours(raw as string)
		if (!Array.isArray(hours)) {
			return fail(400, { serverError: 'Invalid hours data.' })
		}

		try {
			await prisma.systemSetting.upsert({
				where: { key: LIBRARY_HOURS_KEY },
				create: { key: LIBRARY_HOURS_KEY, value: JSON.stringify(hours) },
				update: { value: JSON.stringify(hours) }
			})
			await logActivity({
				action: 'UPDATE_CONFIG',
				userId: locals.user?.id,
				payload: { key: LIBRARY_HOURS_KEY },
				success: true,
				response: { rowCount: hours.length }
			})
			return { success: true }
		} catch (e) {
			await logActivity({
				action: 'UPDATE_CONFIG',
				userId: locals.user?.id,
				payload: { key: LIBRARY_HOURS_KEY },
				success: false,
				response: { error: String(e) }
			})
			return fail(500, { serverError: 'Failed to save hours.' })
		}
	}
}
