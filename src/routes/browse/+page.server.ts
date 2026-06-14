import type { PageServerLoad } from './$types';
import prisma from '$lib/prisma';
import { parseHours, LIBRARY_HOURS_KEY } from '$lib/server/systemSettings';

export const load: PageServerLoad = async ({ url, locals }) => {
	const searchQuery = url.searchParams.get('search') || '';

	const [tools, categories, hoursSetting] = await Promise.all([
		prisma.tool.findMany({
			where: searchQuery ? {
				name: { contains: searchQuery }
			} : undefined,
			include: {
				category: true,
				files: {
					take: 1,
					orderBy: { id: 'asc' }
				}
			},
			orderBy: { name: 'asc' }
		}),
		prisma.category.findMany({
			include: {
				children: {
					include: {
						_count: { select: { tools: true } },
						children: {
							include: {
								_count: { select: { tools: true } }
							}
						}
					}
				},
				_count: { select: { tools: true } }
			},
			orderBy: { name: 'asc' }
		}),
		prisma.systemSetting.findUnique({ where: { key: LIBRARY_HOURS_KEY } })
	]);

	return {
		tools,
		categories,
		hours: parseHours(hoursSetting?.value),
		user: locals.user,
		searchQuery
	};
};
