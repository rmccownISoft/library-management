import { type Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Get session cookie
	const sessionId = event.cookies.get('sessionid');

	// Default to no user
	event.locals.user = null;

	// If session exists, validate it
	if (sessionId) {
		const user = await validateSession(sessionId);
		
		if (user) {
			// Store minimal user data in locals
			event.locals.user = {
				id: user.id,
				userName: user.userName,
				name: user.name,
				role: user.role
			};
		} else {
			// Invalid/expired session, clear the cookie
			event.cookies.delete('sessionid', { path: '/' });
		}
	}

	// Continue with the request
	return resolve(event);
};
