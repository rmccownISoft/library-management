import type { PageServerLoad, Actions } from './$types'
import { fail } from '@sveltejs/kit'
import prisma from '$lib/prisma'
import { logActivity } from '$lib/server/activityLog'

type HourRow = { day: string; open: string; close: string; active: boolean }

const DEFAULT_HOURS: HourRow[] = [
	{ day: 'Tuesday', open: '08:00', close: '10:00', active: true },
	{ day: 'Friday', open: '17:30', close: '19:00', active: true },
	{ day: 'Saturday', open: '10:00', close: '14:00', active: true }
]

export const load: PageServerLoad = async () => {
	const setting = await prisma.systemSetting.findUnique({ where: { key: 'library_hours' } })
	const hours: HourRow[] = setting ? JSON.parse(setting.value) : DEFAULT_HOURS
	return { hours }
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData()
		const raw = formData.get('hours')

		let hours: HourRow[]
		try {
			hours = JSON.parse(raw as string)
		} catch {
			return fail(400, { serverError: 'Invalid hours data.' })
		}

		try {
			await prisma.systemSetting.upsert({
				where: { key: 'library_hours' },
				create: { key: 'library_hours', value: JSON.stringify(hours) },
				update: { value: JSON.stringify(hours) }
			})
			await logActivity({
				action: 'UPDATE_CONFIG',
				userId: locals.user?.id,
				payload: { key: 'library_hours' },
				success: true,
				response: { rowCount: hours.length }
			})
			return { success: true }
		} catch (e) {
			await logActivity({
				action: 'UPDATE_CONFIG',
				userId: locals.user?.id,
				payload: { key: 'library_hours' },
				success: false,
				response: { error: String(e) }
			})
			return fail(500, { serverError: 'Failed to save hours.' })
		}
	}
}
