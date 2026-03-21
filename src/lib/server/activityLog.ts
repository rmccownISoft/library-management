import prisma from '$lib/prisma'

export type ActivityAction =
	| 'CREATE_PATRON'
	| 'EDIT_PATRON'
	| 'CREATE_TOOL'
	| 'EDIT_TOOL'
	| 'CHECKOUT'
	| 'CHECKIN'

export async function logActivity({
	action,
	userId,
	payload,
	success,
	response
}: {
	action: ActivityAction
	userId?: number
	payload: unknown
	success: boolean
	response?: unknown
}): Promise<void> {
	try {
		await prisma.activityLog.create({
			data: {
				action,
				userId: userId ?? null,
				payload: JSON.stringify(payload),
				success,
				response: response !== undefined ? JSON.stringify(response) : null
			}
		})
	} catch (e) {
		// Never let logging failures break the main flow
		console.error('Failed to write activity log:', e)
	}
}
