/*
  Warnings:

  - Added the required column `userName` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "mailingStreet" TEXT NOT NULL,
    "mailingCity" TEXT NOT NULL,
    "mailingState" TEXT NOT NULL,
    "mailingZipcode" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VOLUNTEER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "trainingDate" DATETIME,
    "trainedById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_trainedById_fkey" FOREIGN KEY ("trainedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("active", "createdAt", "email", "id", "mailingCity", "mailingState", "mailingStreet", "mailingZipcode", "name", "passwordHash", "phone", "role", "trainedById", "trainingDate", "updatedAt") SELECT "active", "createdAt", "email", "id", "mailingCity", "mailingState", "mailingStreet", "mailingZipcode", "name", "passwordHash", "phone", "role", "trainedById", "trainingDate", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_userName_key" ON "users"("userName");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
