-- Scheme articles are now grouped by Size, like Today's Stock.
-- AlterTable
ALTER TABLE "scheme_entries" ADD COLUMN "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[];
