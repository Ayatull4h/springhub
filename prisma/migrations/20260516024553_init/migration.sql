-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'volunteer',
    "phone" TEXT NOT NULL DEFAULT '',
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "region" TEXT NOT NULL DEFAULT '',
    "points" INTEGER NOT NULL DEFAULT 0,
    "trustScore" INTEGER NOT NULL DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "guestId" TEXT,
    "formSlug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fieldData" TEXT NOT NULL,
    "preciseLat" REAL,
    "preciseLng" REAL,
    "snappedLat" REAL,
    "snappedLng" REAL,
    "reviewedById" TEXT,
    "reviewNote" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL DEFAULT '',
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "width" INTEGER NOT NULL DEFAULT 0,
    "height" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportPhoto_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL DEFAULT '',
    "typeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "goalAmount" INTEGER NOT NULL DEFAULT 0,
    "raisedAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "projectId" TEXT,
    "invoiceId" TEXT NOT NULL DEFAULT '',
    "externalId" TEXT NOT NULL DEFAULT '',
    "amountIdr" INTEGER NOT NULL,
    "tierId" TEXT NOT NULL DEFAULT '',
    "donorName" TEXT NOT NULL DEFAULT '',
    "donorEmail" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Donation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PointsLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "guestId" TEXT,
    "reportId" TEXT,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PointsLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PointsLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoursesProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseSlug" TEXT NOT NULL,
    "completedModules" INTEGER NOT NULL DEFAULT 0,
    "totalModules" INTEGER NOT NULL DEFAULT 1,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoursesProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CoursesProgress_userId_courseSlug_key" ON "CoursesProgress"("userId", "courseSlug");
