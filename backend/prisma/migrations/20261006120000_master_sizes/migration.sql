-- AlterTable
ALTER TABLE "master_entries" ADD COLUMN "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[];
