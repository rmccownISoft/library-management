import type { PageServerLoad } from './$types';
import prisma from '$lib/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	// Public page - fetch tools and categories for everyone
	const [tools, categories] = await Promise.all([
		prisma.tool.findMany({
			include: {
				category: true,
				files: {
					take: 1,
					orderBy: {
						id: 'asc'
					}
				}
			},
			orderBy: {
				name: 'asc'
			}
		}),
		prisma.category.findMany({
			include: {
				children: {
					include: {
						_count: {
							select: { tools: true }
						}
					}
				},
				_count: {
					select: { tools: true }
				}
			},
			orderBy: {
				name: 'asc'
			}
		})
	]);

	return {
		tools,
		categories,
		user: locals.user // Pass user data for conditional rendering
	};
};
