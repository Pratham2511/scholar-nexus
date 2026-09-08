BEGIN;

-- AlterTable
ALTER TABLE "SavedPaper" ADD COLUMN     "metadata" TEXT;

-- CreateTable
CREATE TABLE "ResearchWorkspace" (
    "id" TEXT NOT NULL DEFAULT 'local',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "data" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedPaper_userId_paperId_key" ON "SavedPaper"("userId", "paperId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionPaper_collectionId_paperId_key" ON "CollectionPaper"("collectionId", "paperId");


COMMIT;
