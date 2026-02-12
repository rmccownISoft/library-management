import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import prisma from '$lib/prisma';
import type { User } from '$generated/prisma/client';

// Session expiry time (24 hours)
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

interface SessionData {
	userId: number;
	createdAt: number;
}

// Session storage - in-memory for MVP (lost on server restart)
const sessionStore = new Map<string, SessionData>();

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return await bcrypt.compare(password, hash);
}

/**
 * Create a new session for a user
 */
export function createSession(userId: number): string {
	const sessionId = randomBytes(32).toString('hex');
	sessionStore.set(sessionId, {
		userId,
		createdAt: Date.now()
	});
	return sessionId;
}

/**
 * Validate a session and return the user if valid
 */
export async function validateSession(sessionId: string): Promise<User | null> {
	const session = sessionStore.get(sessionId);
	
	if (!session) {
		return null;
	}

	// Check if session has expired
	if (Date.now() - session.createdAt > SESSION_EXPIRY_MS) {
		sessionStore.delete(sessionId);
		return null;
	}

	// Fetch user from database
	const user = await prisma.user.findUnique({
		where: { id: session.userId }
	});

	// If user no longer exists or is inactive, delete session
	if (!user || !user.active) {
		sessionStore.delete(sessionId);
		return null;
	}

	return user;
}

/**
 * Delete a session (logout)
 */
export function deleteSession(sessionId: string): void {
	sessionStore.delete(sessionId);
}

/**
 * Clean up expired sessions (optional, for long-running servers)
 */
export function cleanupExpiredSessions(): void {
	const now = Date.now();
	for (const [sessionId, session] of sessionStore.entries()) {
		if (now - session.createdAt > SESSION_EXPIRY_MS) {
			sessionStore.delete(sessionId);
		}
	}
}
