-- Requested Photos: an Article + Colour list uploaded from Excel, like New Model.
-- AlterEnum
ALTER TYPE "ImportType" ADD VALUE 'REQUESTED';

-- CreateTable
CREATE TABLE "requested_entries" (
    "id" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requested_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "requested_entries_article_colour_key" ON "requested_entries"("article", "colour");
