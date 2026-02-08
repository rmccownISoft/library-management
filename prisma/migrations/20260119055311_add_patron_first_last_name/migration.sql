/*
  Warnings:

  - You are about to drop the column `name` on the `patrons` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `patrons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `patrons` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_patrons" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mailingStreet" TEXT NOT NULL,
    "mailingCity" TEXT NOT NULL,
    "mailingState" TEXT NOT NULL,
    "mailingZipcode" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "overdueCount" INTEGER NOT NULL DEFAULT 0,
    "damageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_patrons" ("active", "blocked", "createdAt", "damageCount", "email", "id", "mailingCity", "mailingState", "mailingStreet", "mailingZipcode", "overdueCount", "phone", "updatedAt") SELECT "active", "blocked", "createdAt", "damageCount", "email", "id", "mailingCity", "mailingState", "mailingStreet", "mailingZipcode", "overdueCount", "phone", "updatedAt" FROM "patrons";
DROP TABLE "patrons";
ALTER TABLE "new_patrons" RENAME TO "patrons";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
