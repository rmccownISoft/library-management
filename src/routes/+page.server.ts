import type { PageServerLoad } from './$types'
import prisma from '$lib/prisma'
import { parseHours, LIBRARY_HOURS_KEY, parsePins, FEATURED_PINS_KEY } from '$lib/server/systemSettings'

export const load: PageServerLoad = async ({ locals }) => {
	const [hoursSetting, pinsSetting] = await Promise.all([
		prisma.systemSetting.findUnique({ where: { key: LIBRARY_HOURS_KEY } }),
		prisma.systemSetting.findUnique({ where: { key: FEATURED_PINS_KEY } })
	])

	const pinnedIds = parsePins(pinsSetting?.value)
	const requestedSlots = 6 - pinnedIds.length

	const [pinnedTools, frequentTools] = await Promise.all([
		pinnedIds.length > 0
			? prisma.tool.findMany({
					where: { id: { in: pinnedIds } },
					include: {
						files: { take: 1, orderBy: { id: 'asc' } },
						category: true
					}
				})
			: Promise.resolve([]),
		prisma.tool.findMany({
			where: {
				files: { some: {} },
				checkouts: { some: {} },
				id: { notIn: pinnedIds }
			},
			include: {
				files: { take: 1, orderBy: { id: 'asc' } },
				category: true
			},
			orderBy: { checkouts: { _count: 'desc' } },
			take: requestedSlots
		})
	])

	const actualSlots = 6 - pinnedTools.length
	let algorithmTools = frequentTools.slice(0, actualSlots)

	if (algorithmTools.length < actualSlots) {
		const seenIds = [...pinnedIds, ...algorithmTools.map((t) => t.id)]
		const fallback = await prisma.tool.findMany({
			where: { files: { some: {} }, id: { notIn: seenIds } },
			include: {
				files: { take: 1, orderBy: { id: 'asc' } },
				category: true
			},
			take: actualSlots - algorithmTools.length,
			orderBy: { dateAdded: 'desc' }
		})
		algorithmTools = [...algorithmTools, ...fallback]
	}

	return {
		featuredTools: [...pinnedTools, ...algorithmTools],
		hours: parseHours(hoursSetting?.value),
		user: locals.user
	}
}
