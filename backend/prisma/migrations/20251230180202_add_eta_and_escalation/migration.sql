-- AlterTable
ALTER TABLE "Grievance" ADD COLUMN     "escalatedAt" TIMESTAMP(3),
ADD COLUMN     "estimatedResolutionDate" TIMESTAMP(3),
ADD COLUMN     "expectedResolutionDays" INTEGER;
