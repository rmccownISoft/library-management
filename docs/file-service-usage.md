# File Service Usage Guide

This guide explains how to use the `fileService.ts` module to write files to the filesystem and save metadata to the database using Prisma.

## Overview

The file service provides three main functions:
1. `writeFileWithPrisma` - Write a single file
2. `writeMultipleFilesWithPrisma` - Write multiple files in parallel (uses Promise.allSettled)
3. `writeFilesAndGetIds` - Write files and return their database IDs (throws on any failure)

## Basic Usage

### Single File Upload

```typescript
import { writeFileWithPrisma } from '$lib/server/fileService';
import { EntityType } from '$generated/prisma/enums';

// In your +page.server.ts action
export const actions = {
  uploadFile: async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    const result = await writeFileWithPrisma(file, {
      entityType: EntityType.TOOL,
      entityId: toolId,
      uploadedBy: userId,
      label: 'Product Image'
    });
    
    console.log(`File saved with ID: ${result.id}`);
    return { success: true, fileId: result.id };
  }
};
```

### Multiple Files Upload (Graceful Error Handling)

```typescript
import { writeMultipleFilesWithPrisma } from '$lib/server/fileService';
import { EntityType } from '$generated/prisma/enums';

export const actions = {
  uploadFiles: async ({ request }) => {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    const results = await writeMultipleFilesWithPrisma(files, {
      entityType: EntityType.DAMAGE_REPORT,
      entityId: damageReportId,
      uploadedBy: userId
    });
    
    // Handle partial success
    if (results.failed.length > 0) {
      console.error(`Failed to save ${results.failed.length} files`);
      results.failed.forEach(f => {
        console.error(`- ${f.file.name}: ${f.error.message}`);
      });
    }
    
    // Extract IDs from successful uploads
    const fileIds = results.successful.map(f => f.id);
    
    return {
      success: results.successful.length > 0,
      savedCount: results.successful.length,
      failedCount: results.failed.length,
      fileIds
    };
  }
};
```

### Multiple Files Upload (Strict - All or Nothing)

```typescript
import { writeFilesAndGetIds } from '$lib/server/fileService';
import { EntityType } from '$generated/prisma/enums';

export const actions = {
  uploadFiles: async ({ request }) => {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    try {
      const fileIds = await writeFilesAndGetIds(files, {
        entityType: EntityType.PATRON,
        entityId: patronId,
        uploadedBy: userId,
        label: 'ID Documents'
      });
      
      return { success: true, fileIds };
    } catch (error) {
      return fail(500, { 
        error: error.message 
      });
    }
  }
};
```

## Updating Existing Tool Creation

Here's how to update `src/routes/tools/new/+page.server.ts` to use the file service:

```typescript
import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { ConditionStatus, EntityType } from '$generated/prisma/enums';
import { writeMultipleFilesWithPrisma } from '$lib/server/fileService';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    
    // Get files
    const files = formData.getAll('files') as Array<File>;
    
    // Extract and validate form data
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;
    const quantity = formData.get('quantity') as string;
    const donor = formData.get('donor') as string;
    const conditionStatus = formData.get('conditionStatus') as string;
    
    // Validation...
    const errors: Record<string, string> = {};
    
    if (!name || name.trim().length === 0) {
      errors.name = 'Tool name is required';
    }
    
    if (Object.keys(errors).length > 0) {
      return fail(400, { errors, values: { name, description, categoryId, quantity, donor, conditionStatus } });
    }
    
    // Create tool first
    const tool = await prisma.tool.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        categoryId: parseInt(categoryId),
        quantity: parseInt(quantity),
        donor: donor?.trim() || null,
        conditionStatus: conditionStatus as ConditionStatus || ConditionStatus.GOOD
      }
    });
    
    // Now save files with Prisma (if any files were uploaded)
    if (files.length > 0 && files[0].size > 0) {
      const fileResults = await writeMultipleFilesWithPrisma(files, {
        entityType: EntityType.TOOL,
        entityId: tool.id,
        uploadedBy: locals.user.id, // Assumes you have auth middleware
        label: 'Tool Photo'
      });
      
      // Log any failed uploads
      if (fileResults.failed.length > 0) {
        console.error(`Failed to save ${fileResults.failed.length} files for tool ${tool.id}`);
      }
    }
    
    // Redirect to the new tool's detail page
    throw redirect(303, `/tools/${tool.id}`);
  }
};
```

## Entity Types

The service supports all Prisma entity types:
- `EntityType.TOOL`
- `EntityType.PATRON`
- `EntityType.VOLUNTEER`
- `EntityType.DAMAGE_REPORT`

## File Organization

Files are automatically organized by entity type:
- Development: `C:/Temp/{entity_type}/`
- Production: `/var/www/html/files/{entity_type}/`

Examples:
- `C:/Temp/tool/550e8400-e29b-41d4-a716-446655440000.jpg`
- `/var/www/html/files/damage_report/6ba7b810-9dad-11d1-80b4-00c04fd430c8.pdf`

## Custom Base Path

You can override the base path:

```typescript
const result = await writeFileWithPrisma(file, {
  entityType: EntityType.TOOL,
  entityId: toolId,
  uploadedBy: userId,
  basePath: '/custom/upload/path'
});
```

## Key Features

1. **Parallel Processing**: `writeMultipleFilesWithPrisma` uses `Promise.allSettled` to process all files in parallel
2. **Graceful Error Handling**: Returns both successful and failed uploads
3. **Automatic Directory Creation**: Creates subdirectories as needed
4. **Unique Filenames**: Uses UUIDs to prevent filename collisions
5. **Database Integration**: Automatically creates File records in Prisma
6. **Original Filename Preservation**: Stores both the original filename and the unique filesystem path

## Return Types

### FileWriteResult
```typescript
{
  id: number;           // Database record ID
  fileName: string;     // Original filename
  filePath: string;     // Filesystem path
  fileType: string;     // MIME type
  label?: string;       // Optional label
}
```

### BatchFileWriteResult
```typescript
{
  successful: FileWriteResult[];    // Array of successfully uploaded files (each has an id)
  failed: Array<{                   // Array of failed uploads
    file: File;
    error: Error;
  }>;
}
```

To get all IDs from successful uploads:
```typescript
const results = await writeMultipleFilesWithPrisma(files, config);
const ids = results.successful.map(f => f.id);
```
