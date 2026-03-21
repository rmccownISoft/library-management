import type { PageServerLoad } from './$types'
import prisma from '$lib/prisma'

const PAGE_SIZE = 50

export const load: PageServerLoad = async ({ url }) => {
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
	const skip = (page - 1) * PAGE_SIZE

	const [logs, total] = await Promise.all([
		prisma.activityLog.findMany({
			skip,
			take: PAGE_SIZE,
			orderBy: { createdAt: 'desc' }
		}),
		prisma.activityLog.count()
	])

	// Join user names manually (no FK relation on ActivityLog)
	const userIds = [...new Set(logs.map(l => l.userId).filter((id): id is number => id !== null))]
	const users = userIds.length
		? await prisma.user.findMany({
				where: { id: { in: userIds } },
				select: { id: true, name: true }
		  })
		: []
	const userMap = Object.fromEntries(users.map(u => [u.id, u]))

	return {
		logs: logs.map(log => ({
			...log,
			user: log.userId !== null ? (userMap[log.userId] ?? null) : null
		})),
		total,
		page,
		pageSize: PAGE_SIZE
	}
}
