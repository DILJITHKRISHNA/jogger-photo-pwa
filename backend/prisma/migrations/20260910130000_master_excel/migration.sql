-- AlterEnum
ALTER TYPE "ImportType" ADD VALUE 'MASTER';

-- CreateTable
CREATE TABLE "master_entries" (
    "id" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "master_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "master_entries_article_colour_key" ON "master_entries"("article", "colour");

-- CreateIndex
CREATE INDEX "master_entries_article_colour_idx" ON "master_entries"("article", "colour");

-- Backfill from existing categorised photos so Bulk Photos keep working
-- until the first Master Excel is uploaded.
INSERT INTO "master_entries" ("id", "article", "colour", "category")
SELECT
  ('m' || substr(md5(p."id"), 1, 24)),
  p."article",
  p."colour",
  c."name"
FROM "products" p
INNER JOIN "categories" c ON c."id" = p."categoryId";
