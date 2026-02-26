import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import prisma from '$lib/prisma';

export const GET: RequestHandler = async ({ params, locals }) => {
	// Require authentication to access files
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
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
