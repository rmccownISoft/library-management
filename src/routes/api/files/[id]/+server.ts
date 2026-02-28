import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import prisma from '$lib/prisma';

// In-memory rate limiter for unauthenticated requests
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 100;  // per IP per window

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const entry = rateLimitMap.get(ip);

	if (!entry || now >= entry.resetAt) {
		rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
		return false;
	}

	if (entry.count >= MAX_REQUESTS) return true;

	entry.count++;
	return false;
}

// Periodically prune expired entries to avoid unbounded memory growth
setInterval(() => {
	const now = Date.now();
	for (const [ip, entry] of rateLimitMap) {
		if (now >= entry.resetAt) rateLimitMap.delete(ip);
	}
}, WINDOW_MS);

export const GET: RequestHandler = async ({ params, locals, getClientAddress }) => {
	// Unauthenticated requests are allowed but rate-limited per IP.
	// Authenticated users bypass the rate limit entirely.
	if (!locals.user) {
		const ip = getClientAddress();
		console.log('ip from getClientAddress in file server: ', ip)
		if (isRateLimited(ip)) {
			return json({ error: 'Too many requests' }, { status: 429 });
		}
	}

	const fileId = parseInt(params.id);

	if (isNaN(fileId)) {
		throw error(400, 'Invalid file ID');
	}

	// Get file record from database
	const fileRecord = await prisma.file.findUnique({
		where: { id: fileId }
	});

	if (!fileRecord) {
		throw error(404, 'File not found');
	}

	try {
		// Read file from filesystem
		const fileBuffer = readFileSync(fileRecord.filePath);

		// Return file with appropriate content-type
		return new Response(fileBuffer, {
			headers: {
				'Content-Type': fileRecord.fileType || 'application/octet-stream',
				'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
			}
		});
	} catch (err) {
		console.error(`Error reading file ${fileRecord.filePath}:`, err);
		throw error(500, 'Failed to read file');
	}
};
