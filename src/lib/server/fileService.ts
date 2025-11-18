import { writeFileSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { dev } from '$app/environment';
import prisma from '$lib/prisma';
import { EntityType } from '$generated/prisma/enums';

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
	// Determine base path based on environment
	const basePath = config.basePath || (dev ? 'C:/Temp' : '/var/www/html/files');
	
	// Create subdirectory based on entity type
	const subDir = config.entityType.toLowerCase();
	const fullPath = join(basePath, subDir);
	
	// Ensure directory exists
	mkdirSync(fullPath, { recursive: true });
	
	// Generate unique filename
	const fileExtension = extname(file.name);
	const uniqueFileName = randomUUID() + fileExtension;
	const filePath = join(fullPath, uniqueFileName);
	
	// Write file to filesystem
	const buffer = Buffer.from(await file.arrayBuffer());
	writeFileSync(filePath, buffer);
	
	// Create File record in database using Prisma
	console.log('file create: ', file)
	console.log('file create config: ', config)
	
	// Determine which ID field to use based on entity type
	const idField = getEntityIdField(config.entityType);
	
	const fileRecord = await prisma.file.create({
		data: {
			entityType: config.entityType,
			[idField]: config.entityId,
			filePath: filePath,
			fileName: file.name, // Original filename
			fileType: file.type || 'application/octet-stream',
			label: config.label || null,
			uploadedBy: config.uploadedBy
		}
	});
	
	return {
		id: fileRecord.id,
		fileName: fileRecord.fileName,
		filePath: fileRecord.filePath,
		fileType: fileRecord.fileType,
		label: fileRecord.label || undefined
	};
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
	// Process all files in parallel
	const results = await Promise.allSettled(
		files.map(file => writeFileAndPrismaCreate(file, config))
	);
	console.log('results: ', results)
	const successful: FileWriteResult[] = [];
	const failed: Array<{ file: File; error: Error }> = [];
	
	results.forEach((result, index) => {
		if (result.status === 'fulfilled') {
			successful.push(result.value);
		} else {
			failed.push({
				file: files[index],
				error: result.reason instanceof Error ? result.reason : new Error(String(result.reason))
			});
		}
	});
	
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
