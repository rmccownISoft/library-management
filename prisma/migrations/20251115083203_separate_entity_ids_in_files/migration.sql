/*
  Warnings:

  - You are about to drop the column `entityId` on the `files` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_files" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "label" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" INTEGER NOT NULL,
    "patronId" INTEGER,
    "volunteerId" INTEGER,
    "toolId" INTEGER,
    "damageReportId" INTEGER,
    CONSTRAINT "files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "files_patronId_fkey" FOREIGN KEY ("patronId") REFERENCES "patrons" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "files_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "files_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "files_damageReportId_fkey" FOREIGN KEY ("damageReportId") REFERENCES "damage_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_files" ("entityType", "fileName", "filePath", "fileType", "id", "label", "uploadedAt", "uploadedBy") SELECT "entityType", "fileName", "filePath", "fileType", "id", "label", "uploadedAt", "uploadedBy" FROM "files";
DROP TABLE "files";
ALTER TABLE "new_files" RENAME TO "files";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
