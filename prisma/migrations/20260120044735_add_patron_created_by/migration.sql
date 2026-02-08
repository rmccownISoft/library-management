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
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "patrons_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_patrons" ("active", "blocked", "createdAt", "damageCount", "email", "firstName", "id", "lastName", "mailingCity", "mailingState", "mailingStreet", "mailingZipcode", "overdueCount", "phone", "updatedAt") SELECT "active", "blocked", "createdAt", "damageCount", "email", "firstName", "id", "lastName", "mailingCity", "mailingState", "mailingStreet", "mailingZipcode", "overdueCount", "phone", "updatedAt" FROM "patrons";
DROP TABLE "patrons";
ALTER TABLE "new_patrons" RENAME TO "patrons";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
