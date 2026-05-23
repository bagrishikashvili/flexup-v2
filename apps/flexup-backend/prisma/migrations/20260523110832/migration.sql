-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('WORKER', 'COMPANY_USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CompanyMemberRole" AS ENUM ('OWNER', 'MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ShiftVisibility" AS ENUM ('OPEN', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'FILLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('HOSPITALITY', 'RETAIL', 'LOGISTICS', 'DELIVERY', 'EVENTS', 'CLEANING', 'OTHER');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "registrationNumber" TEXT,
    "vatNumber" TEXT,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'GEL',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "CompanyMemberRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'GE',
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flexpool" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "JobCategory",
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flexpool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlexpoolMember" (
    "id" TEXT NOT NULL,
    "flexpoolId" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlexpoolMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GEL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateTemplateRule" (
    "id" TEXT NOT NULL,
    "rateTemplateId" TEXT NOT NULL,
    "timeFrom" TEXT NOT NULL,
    "timeTo" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "appliesOnDays" "DayOfWeek"[],

    CONSTRAINT "RateTemplateRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftSeries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "JobCategory" NOT NULL,
    "seriesStartsOn" TIMESTAMP(3) NOT NULL,
    "seriesEndsOn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT,
    "companyId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "JobCategory" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tbilisi',
    "currency" TEXT NOT NULL DEFAULT 'GEL',
    "flatRateMinor" INTEGER,
    "positionsTotal" INTEGER NOT NULL DEFAULT 1,
    "positionsFilled" INTEGER NOT NULL DEFAULT 0,
    "visibility" "ShiftVisibility" NOT NULL DEFAULT 'OPEN',
    "status" "ShiftStatus" NOT NULL DEFAULT 'DRAFT',
    "requiredSkills" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftRateRule" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "timeFrom" TEXT NOT NULL,
    "timeTo" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "appliesOnDays" "DayOfWeek"[],

    CONSTRAINT "ShiftRateRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftInvitation" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "workerProfileId" TEXT,
    "flexpoolId" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "city" TEXT,
    "skills" TEXT[],
    "averageRating" DOUBLE PRECISION,
    "totalShiftsCompleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "proposedRateMinor" INTEGER,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "CompanyMember_companyId_idx" ON "CompanyMember"("companyId");

-- CreateIndex
CREATE INDEX "CompanyMember_userId_idx" ON "CompanyMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMember_userId_companyId_key" ON "CompanyMember"("userId", "companyId");

-- CreateIndex
CREATE INDEX "Location_companyId_idx" ON "Location"("companyId");

-- CreateIndex
CREATE INDEX "Location_city_idx" ON "Location"("city");

-- CreateIndex
CREATE INDEX "Location_latitude_longitude_idx" ON "Location"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Flexpool_companyId_idx" ON "Flexpool"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Flexpool_companyId_name_key" ON "Flexpool"("companyId", "name");

-- CreateIndex
CREATE INDEX "FlexpoolMember_flexpoolId_idx" ON "FlexpoolMember"("flexpoolId");

-- CreateIndex
CREATE INDEX "FlexpoolMember_workerProfileId_idx" ON "FlexpoolMember"("workerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "FlexpoolMember_flexpoolId_workerProfileId_key" ON "FlexpoolMember"("flexpoolId", "workerProfileId");

-- CreateIndex
CREATE INDEX "RateTemplate_companyId_idx" ON "RateTemplate"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "RateTemplate_companyId_name_key" ON "RateTemplate"("companyId", "name");

-- CreateIndex
CREATE INDEX "RateTemplateRule_rateTemplateId_idx" ON "RateTemplateRule"("rateTemplateId");

-- CreateIndex
CREATE INDEX "ShiftSeries_companyId_idx" ON "ShiftSeries"("companyId");

-- CreateIndex
CREATE INDEX "ShiftSeries_locationId_idx" ON "ShiftSeries"("locationId");

-- CreateIndex
CREATE INDEX "Shift_companyId_idx" ON "Shift"("companyId");

-- CreateIndex
CREATE INDEX "Shift_locationId_idx" ON "Shift"("locationId");

-- CreateIndex
CREATE INDEX "Shift_status_idx" ON "Shift"("status");

-- CreateIndex
CREATE INDEX "Shift_startsAt_idx" ON "Shift"("startsAt");

-- CreateIndex
CREATE INDEX "Shift_category_idx" ON "Shift"("category");

-- CreateIndex
CREATE INDEX "Shift_visibility_status_idx" ON "Shift"("visibility", "status");

-- CreateIndex
CREATE INDEX "ShiftRateRule_shiftId_idx" ON "ShiftRateRule"("shiftId");

-- CreateIndex
CREATE INDEX "ShiftInvitation_shiftId_idx" ON "ShiftInvitation"("shiftId");

-- CreateIndex
CREATE INDEX "ShiftInvitation_workerProfileId_idx" ON "ShiftInvitation"("workerProfileId");

-- CreateIndex
CREATE INDEX "ShiftInvitation_flexpoolId_idx" ON "ShiftInvitation"("flexpoolId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_userId_key" ON "WorkerProfile"("userId");

-- CreateIndex
CREATE INDEX "WorkerProfile_city_idx" ON "WorkerProfile"("city");

-- CreateIndex
CREATE INDEX "Application_shiftId_idx" ON "Application"("shiftId");

-- CreateIndex
CREATE INDEX "Application_workerProfileId_idx" ON "Application"("workerProfileId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Application_shiftId_workerProfileId_key" ON "Application"("shiftId", "workerProfileId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flexpool" ADD CONSTRAINT "Flexpool_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlexpoolMember" ADD CONSTRAINT "FlexpoolMember_flexpoolId_fkey" FOREIGN KEY ("flexpoolId") REFERENCES "Flexpool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlexpoolMember" ADD CONSTRAINT "FlexpoolMember_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateTemplate" ADD CONSTRAINT "RateTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateTemplateRule" ADD CONSTRAINT "RateTemplateRule_rateTemplateId_fkey" FOREIGN KEY ("rateTemplateId") REFERENCES "RateTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSeries" ADD CONSTRAINT "ShiftSeries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSeries" ADD CONSTRAINT "ShiftSeries_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "ShiftSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRateRule" ADD CONSTRAINT "ShiftRateRule_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftInvitation" ADD CONSTRAINT "ShiftInvitation_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftInvitation" ADD CONSTRAINT "ShiftInvitation_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftInvitation" ADD CONSTRAINT "ShiftInvitation_flexpoolId_fkey" FOREIGN KEY ("flexpoolId") REFERENCES "Flexpool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
