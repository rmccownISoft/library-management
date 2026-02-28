import { type Handle, type HandleServerError } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth';

// Common exploit paths to block
const BLOCKED_PATHS = [
	'/wp-admin',
	'/wordpress',
	'/wp-content',
	'/wp-includes',
	'.php',
	'.py',
	'.env',
	'.git',
	'phpMyAdmin',
	'/admin.php',
	'/config.php',
	'/settings.py',
	'/setup.php',
	'/.well-known/security.txt'
];

// Check if path contains any blocked patterns
function isBlockedPath(pathname: string): boolean {
	return BLOCKED_PATHS.some(blocked => pathname.includes(blocked));
}

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	// Block suspicious/exploit paths immediately
	if (isBlockedPath(pathname)) {
		// Return 404 to not reveal what exists
		return new Response('Not Found', { status: 404 });
	}

	// Block POST requests to root without valid form data
	// This prevents error logs from bot POST probes
	if (event.request.method === 'POST' && pathname === '/') {
		// Check if it's a legitimate SvelteKit form action request
		const contentType = event.request.headers.get('content-type') || '';
		
		// SvelteKit form actions use application/x-www-form-urlencoded or multipart/form-data
		// and should have a referrer from the same origin
		const referrer = event.request.headers.get('referer') || '';
		const isLegitimateForm = 
			referrer.startsWith(event.url.origin) &&
			(contentType.includes('application/x-www-form-urlencoded') || 
			 contentType.includes('multipart/form-data'));

		if (!isLegitimateForm) {
			// Silently reject without logging errors
			return new Response('Method Not Allowed', { status: 405 });
		}
	}

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

// Handle server errors to prevent crashes
export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	// Log the error for debugging (you can also send to error tracking service)
	console.error('Server error occurred:', {
		status,
		message,
		url: event.url.pathname,
		method: event.request.method,
		error: error instanceof Error ? error.message : String(error),
		stack: error instanceof Error ? error.stack : undefined
	});

	// Return a safe error message to the client
	// Don't expose internal error details in production
	return {
		message: status === 404 
			? 'Page not found' 
			: 'An unexpected error occurred. Please try again later.'
	};
};
