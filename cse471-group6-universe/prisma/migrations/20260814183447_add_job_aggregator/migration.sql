-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "currentCgpa" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "semesterNumber" INTEGER NOT NULL,
    "currentCgpa" DOUBLE PRECISION NOT NULL,
    "completedCredits" INTEGER NOT NULL,
    "targetCgpa" DOUBLE PRECISION NOT NULL,
    "upcomingCredits" INTEGER NOT NULL,
    "requiredGpa" DOUBLE PRECISION NOT NULL,
    "isPossible" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulatedCourse" (
    "id" TEXT NOT NULL,
    "academicGoalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL,
    "targetGrade" TEXT NOT NULL,

    CONSTRAINT "SimulatedCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "semesterNumber" INTEGER NOT NULL DEFAULT 1,
    "classDays" TEXT NOT NULL DEFAULT 'SUN, TUE',
    "startTime" TEXT NOT NULL DEFAULT '09:30 AM',
    "endTime" TEXT NOT NULL DEFAULT '10:45 AM',
    "grade" TEXT,
    "totalClasses" INTEGER NOT NULL DEFAULT 0,
    "attendedClasses" INTEGER NOT NULL DEFAULT 0,
    "missedClasses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "course" TEXT,
    "type" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "reminderHours" INTEGER NOT NULL DEFAULT 24,
    "notes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobListing" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companyLogo" TEXT,
    "location" TEXT NOT NULL DEFAULT 'Dhaka, Bangladesh',
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "jobType" TEXT NOT NULL DEFAULT 'INTERNSHIP',
    "experienceLevel" TEXT NOT NULL DEFAULT 'ENTRY',
    "description" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "salaryText" TEXT,
    "minCgpa" DOUBLE PRECISION,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "jobTypes" TEXT[] DEFAULT ARRAY['INTERNSHIP']::TEXT[],
    "minMatchScore" INTEGER NOT NULL DEFAULT 50,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SAVED',
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_month_year_key" ON "Budget"("userId", "month", "year");

-- CreateIndex
CREATE INDEX "AcademicTask_userId_dueAt_idx" ON "AcademicTask"("userId", "dueAt");

-- CreateIndex
CREATE INDEX "JobListing_postedAt_idx" ON "JobListing"("postedAt");

-- CreateIndex
CREATE INDEX "JobListing_category_jobType_idx" ON "JobListing"("category", "jobType");

-- CreateIndex
CREATE UNIQUE INDEX "JobListing_source_externalId_key" ON "JobListing"("source", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "JobPreference_userId_key" ON "JobPreference"("userId");

-- CreateIndex
CREATE INDEX "SavedJob_userId_status_idx" ON "SavedJob"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SavedJob_userId_jobId_key" ON "SavedJob"("userId", "jobId");

-- CreateIndex
CREATE INDEX "JobAlert_userId_isRead_idx" ON "JobAlert"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "JobAlert_userId_jobId_key" ON "JobAlert"("userId", "jobId");

-- AddForeignKey
ALTER TABLE "AcademicGoal" ADD CONSTRAINT "AcademicGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulatedCourse" ADD CONSTRAINT "SimulatedCourse_academicGoalId_fkey" FOREIGN KEY ("academicGoalId") REFERENCES "AcademicGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicTask" ADD CONSTRAINT "AcademicTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPreference" ADD CONSTRAINT "JobPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAlert" ADD CONSTRAINT "JobAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAlert" ADD CONSTRAINT "JobAlert_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
