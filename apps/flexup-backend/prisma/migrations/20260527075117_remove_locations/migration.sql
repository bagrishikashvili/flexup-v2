/*
  Warnings:

  - The `category` column on the `Flexpool` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `locationId` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `seriesId` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShiftSeries` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `category` on the `Shift` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_seriesId_fkey";

-- DropForeignKey
ALTER TABLE "ShiftSeries" DROP CONSTRAINT "ShiftSeries_companyId_fkey";

-- DropForeignKey
ALTER TABLE "ShiftSeries" DROP CONSTRAINT "ShiftSeries_locationId_fkey";

-- DropIndex
DROP INDEX "Shift_category_idx";

-- DropIndex
DROP INDEX "Shift_locationId_idx";

-- AlterTable
ALTER TABLE "Flexpool" DROP COLUMN "category",
ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "Shift" DROP COLUMN "locationId",
DROP COLUMN "seriesId",
DROP COLUMN "category",
ADD COLUMN     "category" TEXT NOT NULL;

-- DropTable
DROP TABLE "Location";

-- DropTable
DROP TABLE "ShiftSeries";

-- DropEnum
DROP TYPE "JobCategory";
