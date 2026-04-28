import type { PageServerLoad, Actions } from './$types'
import { fail } from '@sveltejs/kit'
import prisma from '$lib/prisma'
import { logActivity } from '$lib/server/activityLog'
import {
	parseHours,
	DEFAULT_HOURS,
	LIBRARY_HOURS_KEY,
	parsePins,
	FEATURED_PINS_KEY
} from '$lib/server/systemSettings'

export const load: PageServerLoad = async () => {
	const [hoursSetting, pinsSetting] = await Promise.all([
		prisma.systemSetting.findUnique({ where: { key: LIBRARY_HOURS_KEY } }),
		prisma.systemSetting.findUnique({ where: { key: FEATURED_PINS_KEY } })
	])

	const pinnedIds = parsePins(pinsSetting?.value)
	const pinnedTools =
		pinnedIds.length > 0
			? await prisma.tool.findMany({
					where: { id: { in: pinnedIds } },
					select: { id: true, name: true }
				})
			: []

	return {
		hours: parseHours(hoursSetting?.value, DEFAULT_HOURS),
		pinnedTools
	}
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
	},

	savePins: async ({ request, locals }) => {
		const formData = await request.formData()
		const raw = formData.get('pins')
		if (typeof raw !== 'string') {
			return fail(400, { pinsServerError: 'Missing pins data.' })
		}
		const pins = parsePins(raw)

		try {
			await prisma.systemSetting.upsert({
				where: { key: FEATURED_PINS_KEY },
				create: { key: FEATURED_PINS_KEY, value: JSON.stringify(pins) },
				update: { value: JSON.stringify(pins) }
			})
			await logActivity({
				action: 'UPDATE_CONFIG',
				userId: locals.user?.id,
				payload: { key: FEATURED_PINS_KEY, count: pins.length },
				success: true,
				response: { pins }
			})
			return { pinsSuccess: true }
		} catch (e) {
			await logActivity({
				action: 'UPDATE_CONFIG',
				userId: locals.user?.id,
				payload: { key: FEATURED_PINS_KEY },
				success: false,
				response: { error: String(e) }
			})
			return fail(500, { pinsServerError: 'Failed to save pinned tools.' })
		}
	}
}
