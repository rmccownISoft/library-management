import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import prisma from '$lib/prisma';

export const GET: RequestHandler = async ({ params }) => {
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
