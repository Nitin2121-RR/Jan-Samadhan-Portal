-- AlterTable
ALTER TABLE "Grievance" ADD COLUMN     "aiAnalysisHash" TEXT,
ADD COLUMN     "autoResponse" TEXT,
ADD COLUMN     "detectedLanguage" TEXT,
ADD COLUMN     "duplicateOf" TEXT,
ADD COLUMN     "embedding" DOUBLE PRECISION[],
ADD COLUMN     "imageAnalysis" JSONB,
ADD COLUMN     "similarGrievances" TEXT[],
ADD COLUMN     "translatedDesc" TEXT,
ADD COLUMN     "translatedTitle" TEXT;

-- CreateIndex
CREATE INDEX "Grievance_detectedLanguage_idx" ON "Grievance"("detectedLanguage");
