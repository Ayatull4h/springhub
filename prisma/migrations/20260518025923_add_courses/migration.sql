-- CreateTable
CREATE TABLE "PointRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "points" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Star',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT 'Beginner',
    "duration" TEXT NOT NULL DEFAULT '30 min',
    "icon" TEXT NOT NULL DEFAULT 'BookOpen',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CourseModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CourseModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CoursesProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL DEFAULT '',
    "courseSlug" TEXT NOT NULL,
    "completedModules" INTEGER NOT NULL DEFAULT 0,
    "totalModules" INTEGER NOT NULL DEFAULT 1,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoursesProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CoursesProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CoursesProgress" ("completed", "completedModules", "courseSlug", "createdAt", "id", "totalModules", "updatedAt", "userId") SELECT "completed", "completedModules", "courseSlug", "createdAt", "id", "totalModules", "updatedAt", "userId" FROM "CoursesProgress";
DROP TABLE "CoursesProgress";
ALTER TABLE "new_CoursesProgress" RENAME TO "CoursesProgress";
CREATE UNIQUE INDEX "CoursesProgress_userId_courseSlug_key" ON "CoursesProgress"("userId", "courseSlug");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL DEFAULT '',
    "typeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "goalAmount" INTEGER NOT NULL DEFAULT 0,
    "raisedAmount" INTEGER NOT NULL DEFAULT 0,
    "contactName" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "proposalFile" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("createdAt", "goalAmount", "id", "raisedAmount", "region", "status", "summary", "title", "typeId", "updatedAt", "userId") SELECT "createdAt", "goalAmount", "id", "raisedAmount", "region", "status", "summary", "title", "typeId", "updatedAt", "userId" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
