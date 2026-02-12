import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/prisma';
import { verifyPassword, createSession } from '$lib/server/auth';

// Redirect to home if already logged in
export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(303, '/');
	}
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const userName = data.get('userName');
		const password = data.get('password');

		// Validate input
		if (!userName || !password) {
			return fail(400, { userName: userName?.toString() ?? '', missing: true });
		}

		// Check password length (minimum 8 characters)
		if (typeof password !== 'string' || password.length < 8) {
			return fail(400, { userName: userName.toString(), invalid: true });
		}

		// Find user by username
		const user = await prisma.user.findUnique({
			where: { userName: userName.toString() }
		});

		// If user doesn't exist or password is wrong
		if (!user || !(await verifyPassword(password, user.passwordHash))) {
			return fail(400, { userName: userName.toString(), invalid: true });
		}

		// Check if user is active
		if (!user.active) {
			return fail(400, { userName: userName.toString(), invalid: true });
		}

		// Create session
		const sessionId = createSession(user.id);

		// Set session cookie (httpOnly, secure in production)
		cookies.set('sessionid', sessionId, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 // 24 hours
		});

		// Log the login
		await prisma.loginHistory.create({
			data: {
				userId: user.id,
				ipAddress: null, // Could add request IP here
				userAgent: null  // Could add user agent here
			}
		});

		// Redirect to home
		redirect(303, '/');
	}
};
