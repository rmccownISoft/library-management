-- CreateTable
CREATE TABLE "activity_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action" TEXT NOT NULL,
    "userId" INTEGER,
    "payload" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "response" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
