import { writeFileSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { dev } from '$app/environment';
import prisma from '$lib/prisma';
import { EntityType } from '$generated/prisma/enums';
import sharp from 'sharp';

/**
 * Configuration for file upload
 */
export interface FileUploadConfig {
	entityType: EntityType;
	entityId: number;
	uploadedBy: number;
	label?: string;
	basePath?: string;
}

/**
 * Gets the base upload path from environment or uses defaults
 */
function getBaseUploadPath(): string {
	// Check for environment variable first (recommended for production)
	if (process.env.UPLOAD_BASE_PATH) {
		return process.env.UPLOAD_BASE_PATH;
	}
	
	// Fall back to old defaults (for backward compatibility)
	return dev ? 'C:/Temp' : '/var/www/html/files';
}

/**
 * Image optimization settings
 * Used to resize and compress images before saving
 */
const IMAGE_OPTIMIZATION = {
	maxWidth: 1200,        // Maximum width in pixels
	quality: 85,           // JPEG/WebP quality (1-100)
	stripMetadata: true,   // Remove EXIF data to reduce file size and protect privacy
} as const;

/**
 * Checks if a file is an image based on MIME type
 */
function isImage(mimeType: string): boolean {
	return mimeType.startsWith('image/');
}

/**
 * Optimizes an image buffer using sharp
 * - Resizes to max width while maintaining aspect ratio
 * - Compresses with specified quality
 * - Strips metadata
 * - Converts to JPEG for consistent format and best compression
 * 
 * @param buffer - Original image buffer
 * @returns Optimized image buffer
 */
async function optimizeImage(buffer: Buffer): Promise<Buffer> {
	return sharp(buffer)
		.resize(IMAGE_OPTIMIZATION.maxWidth, null, {
			fit: 'inside',
			withoutEnlargement: true // Don't upscale small images
		})
		.jpeg({
			quality: IMAGE_OPTIMIZATION.quality,
			mozjpeg: true // Use mozjpeg for better compression
		})
		.withMetadata(IMAGE_OPTIMIZATION.stripMetadata ? {} : undefined)
		.toBuffer();
}

/**
 * Maps entity type to the appropriate ID field name
 */
function getEntityIdField(entityType: EntityType): string {
	switch (entityType) {
		case EntityType.TOOL:
			return 'toolId';
		case EntityType.PATRON:
			return 'patronId';
		case EntityType.VOLUNTEER:
			return 'volunteerId';
		case EntityType.DAMAGE_REPORT:
			return 'damageReportId';
		default:
			throw new Error(`Unknown entity type: ${entityType}`);
	}
}

/**
 * Result of file write operation
 */
export interface FileWriteResult {
	id: number;
	fileName: string;
	filePath: string;
	fileType: string;
	label?: string;
}

/**
 * Result of batch file write operation
 */
export interface BatchFileWriteResult {
	successful: FileWriteResult[];
	failed: Array<{ file: File; error: Error }>;
}

/**
 * Writes a file to the filesystem and creates a File record in the database using Prisma
 * 
 * @param file - The File object to write
 * @param config - Configuration for the file upload
 * @returns Promise with the created File record details
 * 
 * @example
 * ```typescript
 * const result = await writeFileWithPrisma(file, {
 *   entityType: EntityType.TOOL,
 *   entityId: toolId,
 *   uploadedBy: userId,
 *   label: 'Tool Photo'
 * });
 * console.log(`File saved with ID: ${result.id}`);
 * ```
 */
export async function writeFileAndPrismaCreate(
	file: File,
	config: FileUploadConfig
): Promise<FileWriteResult> {
	try {
		// Determine base path based on environment
		const basePath = config.basePath || getBaseUploadPath();
		
		// Create subdirectory based on entity type
		const subDir = config.entityType.toLowerCase();
		const fullPath = join(basePath, subDir);
		
		// Ensure directory exists with proper error handling
		try {
			mkdirSync(fullPath, { recursive: true });
		} catch (error) {
			console.error(`Failed to create directory ${fullPath}:`, error);
			throw new Error(`Unable to create upload directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
		
		// Generate unique filename
		const originalExtension = extname(file.name);
		const arrayBuffer = await file.arrayBuffer();
		let buffer: Buffer = Buffer.from(new Uint8Array(arrayBuffer));
		let fileExtension = originalExtension;
		let actualFileType = file.type || 'application/octet-stream';
		
		// Optimize image if it's an image file
		if (isImage(file.type)) {
			try {
				buffer = await optimizeImage(buffer);
				fileExtension = '.jpg'; // Always save optimized images as JPEG
				actualFileType = 'image/jpeg';
			} catch (error) {
				console.warn('Failed to optimize image, saving original:', error);
				// Continue with original buffer and extension
			}
		}
		
		const uniqueFileName = randomUUID() + fileExtension;
		const filePath = join(fullPath, uniqueFileName);
		
		// Write file to filesystem with error handling
		try {
			writeFileSync(filePath, buffer);
			console.log(`Successfully wrote file to: ${filePath}`);
		} catch (error) {
			console.error(`Failed to write file to ${filePath}:`, error);
			throw new Error(`Unable to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
		
		// Create File record in database using Prisma
		console.log('Creating file record for:', file.name);
		console.log('File config:', { 
			entityType: config.entityType, 
			entityId: config.entityId,
			uploadedBy: config.uploadedBy
		});
		
		// Determine which ID field to use based on entity type
		const idField = getEntityIdField(config.entityType);
		
		try {
			const fileRecord = await prisma.file.create({
				data: {
					entityType: config.entityType,
					[idField]: config.entityId,
					filePath: filePath,
					fileName: file.name, // Original filename
					fileType: actualFileType, // Use actual type (may be converted to jpeg)
					label: config.label || null,
					uploadedBy: config.uploadedBy
				}
			});
			
			console.log(`Successfully created file record with ID: ${fileRecord.id}`);
			
			return {
				id: fileRecord.id,
				fileName: fileRecord.fileName,
				filePath: fileRecord.filePath,
				fileType: fileRecord.fileType,
				label: fileRecord.label || undefined
			};
		} catch (error) {
			console.error('Failed to create file record in database:', error);
			// Clean up the file we just wrote since DB insert failed
			try {
				const fs = await import('fs');
				fs.unlinkSync(filePath);
				console.log(`Cleaned up orphaned file: ${filePath}`);
			} catch (cleanupError) {
				console.error(`Failed to clean up orphaned file ${filePath}:`, cleanupError);
			}
			throw new Error(`Database error while saving file: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	} catch (error) {
		// Re-throw with more context if it's not already our error
		if (error instanceof Error && error.message.includes('Unable to')) {
			throw error;
		}
		console.error('Unexpected error in writeFileAndPrismaCreate:', error);
		throw new Error(`Failed to process file upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Writes multiple files to the filesystem and creates File records in the database in parallel
 * Uses Promise.allSettled to handle individual file failures gracefully
 * 
 * @param files - Array of File objects to write
 * @param config - Configuration for the file upload (same for all files)
 * @returns Promise with object containing successful and failed file writes
 * 
 * @example
 * ```typescript
 * const results = await writeMultipleFilesWithPrisma(files, {
 *   entityType: EntityType.DAMAGE_REPORT,
 *   entityId: damageReportId,
 *   uploadedBy: userId
 * });
 * console.log(`Saved ${results.successful.length} files, ${results.failed.length} failed`);
 * results.failed.forEach(f => console.error(`Failed to save ${f.file.name}:`, f.error.message));
 * ```
 */
export async function writeMultipleFilesAndPrismaCreate(
	files: File[],
	config: FileUploadConfig
): Promise<BatchFileWriteResult> {
	console.log(`Starting upload of ${files.length} file(s)`);
	
	// Process all files in parallel
	const results = await Promise.allSettled(
		files.map(file => writeFileAndPrismaCreate(file, config))
	);
	
	const successful: FileWriteResult[] = [];
	const failed: Array<{ file: File; error: Error }> = [];
	
	results.forEach((result, index) => {
		if (result.status === 'fulfilled') {
			successful.push(result.value);
		} else {
			const error = result.reason instanceof Error ? result.reason : new Error(String(result.reason));
			console.error(`Failed to upload file ${files[index].name}:`, error);
			failed.push({
				file: files[index],
				error
			});
		}
	});
	
	console.log(`Upload complete: ${successful.length} succeeded, ${failed.length} failed`);
	
	return { successful, failed };
}

/**
 * Writes files and returns their database IDs (useful for relating to other records)
 * Throws an error if any file fails to upload
 * 
 * @param files - Array of File objects to write
 * @param config - Configuration for the file upload
 * @returns Promise with array of created File record IDs
 * @throws Error if any file fails to upload
 */
export async function writeFilesAndGetIds(
	files: File[],
	config: FileUploadConfig
): Promise<number[]> {
	const results = await writeMultipleFilesAndPrismaCreate(files, config);
	
	if (results.failed.length > 0) {
		const failedNames = results.failed.map(f => f.file.name).join(', ');
		throw new Error(`Failed to upload ${results.failed.length} file(s): ${failedNames}`);
	}
	
	return results.successful.map(r => r.id);
}
