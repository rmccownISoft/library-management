import type { PageServerLoad } from './$types'
import prisma from '$lib/prisma'
import { parseHours, LIBRARY_HOURS_KEY } from '$lib/server/systemSettings'

export const load: PageServerLoad = async ({ locals }) => {
	const [frequentTools, hoursSetting] = await Promise.all([
		prisma.tool.findMany({
			where: { files: { some: {} }, checkouts: { some: {} } },
			include: {
				files: { take: 1, orderBy: { id: 'asc' } },
				category: true
			},
			orderBy: { checkouts: { _count: 'desc' } },
			take: 6
		}),
		prisma.systemSetting.findUnique({ where: { key: LIBRARY_HOURS_KEY } })
	])

	let featuredTools = frequentTools

	if (frequentTools.length < 6) {
		const seenIds = frequentTools.map((t) => t.id)
		const fallback = await prisma.tool.findMany({
			where: { files: { some: {} }, id: { notIn: seenIds } },
			include: {
				files: { take: 1, orderBy: { id: 'asc' } },
				category: true
			},
			take: 6 - frequentTools.length,
			orderBy: { name: 'asc' }
		})
		featuredTools = [...frequentTools, ...fallback]
	}

	return {
		featuredTools,
		hours: parseHours(hoursSetting?.value),
		user: locals.user
	}
}
