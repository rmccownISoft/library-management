import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deleteSession } from '$lib/server/auth';

// Redirect to login if accessing GET
export const load: PageServerLoad = async () => {
	redirect(303, '/login');
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		const sessionId = cookies.get('sessionid');
		
		if (sessionId) {
			// Delete session from store
			deleteSession(sessionId);
			
			// Clear cookie
			cookies.delete('sessionid', { path: '/' });
		}
		
		// Redirect to login
		redirect(303, '/login');
	}
};
