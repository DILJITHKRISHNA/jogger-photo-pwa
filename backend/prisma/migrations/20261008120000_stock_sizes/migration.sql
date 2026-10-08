-- Sizes moved from the Master Excel to the Stock Excel.
-- AlterTable
ALTER TABLE "master_entries" DROP COLUMN "sizes";

-- AlterTable
ALTER TABLE "stock_entries" ADD COLUMN "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[];
