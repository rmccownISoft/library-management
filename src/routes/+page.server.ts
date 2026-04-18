import type { PageServerLoad } from './$types'
import prisma from '$lib/prisma'

// We'll need to pick which photos we want to show
export const load: PageServerLoad = async ({ locals }) => {
  const featuredTools = await prisma.tool.findMany({
    where: {
      files: { some: {} }
    },
    include: {
      files: {
        take: 1,
        orderBy: { id: 'asc' }
      },
      category: true
    },
    take: 6,
    orderBy: { name: 'asc' }
  })

  return {
    featuredTools,
    user: locals.user
  }
}