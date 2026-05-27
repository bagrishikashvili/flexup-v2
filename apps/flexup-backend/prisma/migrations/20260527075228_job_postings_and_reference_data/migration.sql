-- CreateTable
CREATE TABLE "JobSection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKa" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCategory" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleKa" TEXT NOT NULL,
    "isExperienceRequired" BOOLEAN NOT NULL DEFAULT false,
    "isTippable" BOOLEAN NOT NULL DEFAULT false,
    "minimumEarningsPerHourMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GEL',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKa" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appearance" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKa" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKa" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "briefing" TEXT NOT NULL,
    "coverPhotoUrl" TEXT,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'GE',
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "contactPersonName" TEXT NOT NULL,
    "contactPersonPhone" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPostingSkill" (
    "jobPostingId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "JobPostingSkill_pkey" PRIMARY KEY ("jobPostingId","skillId")
);

-- CreateTable
CREATE TABLE "JobPostingAppearance" (
    "jobPostingId" TEXT NOT NULL,
    "appearanceId" TEXT NOT NULL,

    CONSTRAINT "JobPostingAppearance_pkey" PRIMARY KEY ("jobPostingId","appearanceId")
);

-- CreateTable
CREATE TABLE "JobPostingLanguage" (
    "jobPostingId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,

    CONSTRAINT "JobPostingLanguage_pkey" PRIMARY KEY ("jobPostingId","languageId")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobSection_slug_key" ON "JobSection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "JobSection_name_key" ON "JobSection"("name");

-- CreateIndex
CREATE INDEX "JobSection_sortOrder_idx" ON "JobSection"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "JobCategory_slug_key" ON "JobCategory"("slug");

-- CreateIndex
CREATE INDEX "JobCategory_sectionId_idx" ON "JobCategory"("sectionId");

-- CreateIndex
CREATE INDEX "JobCategory_slug_idx" ON "JobCategory"("slug");

-- CreateIndex
CREATE INDEX "JobCategory_sortOrder_idx" ON "JobCategory"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "Skill_sortOrder_idx" ON "Skill"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Appearance_slug_key" ON "Appearance"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Appearance_name_key" ON "Appearance"("name");

-- CreateIndex
CREATE INDEX "Appearance_sortOrder_idx" ON "Appearance"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Language_slug_key" ON "Language"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE INDEX "Language_sortOrder_idx" ON "Language"("sortOrder");

-- CreateIndex
CREATE INDEX "JobPosting_companyId_idx" ON "JobPosting"("companyId");

-- CreateIndex
CREATE INDEX "JobPosting_categoryId_idx" ON "JobPosting"("categoryId");

-- CreateIndex
CREATE INDEX "JobPosting_city_idx" ON "JobPosting"("city");

-- CreateIndex
CREATE INDEX "JobPosting_latitude_longitude_idx" ON "JobPosting"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "JobPosting_isArchived_idx" ON "JobPosting"("isArchived");

-- CreateIndex
CREATE INDEX "JobPostingSkill_skillId_idx" ON "JobPostingSkill"("skillId");

-- CreateIndex
CREATE INDEX "JobPostingAppearance_appearanceId_idx" ON "JobPostingAppearance"("appearanceId");

-- CreateIndex
CREATE INDEX "JobPostingLanguage_languageId_idx" ON "JobPostingLanguage"("languageId");

-- AddForeignKey
ALTER TABLE "JobCategory" ADD CONSTRAINT "JobCategory_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "JobSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "JobCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingSkill" ADD CONSTRAINT "JobPostingSkill_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingSkill" ADD CONSTRAINT "JobPostingSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingAppearance" ADD CONSTRAINT "JobPostingAppearance_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingAppearance" ADD CONSTRAINT "JobPostingAppearance_appearanceId_fkey" FOREIGN KEY ("appearanceId") REFERENCES "Appearance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingLanguage" ADD CONSTRAINT "JobPostingLanguage_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostingLanguage" ADD CONSTRAINT "JobPostingLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
