-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('citizen', 'authority');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('pending', 'acknowledged', 'in_progress', 'resolved', 'escalated');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'citizen',
    "address" TEXT,
    "department" TEXT,
    "position" TEXT,
    "walletAddress" TEXT,
    "walletLinkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grievance" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "GrievanceStatus" NOT NULL DEFAULT 'pending',
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "ward" TEXT,
    "userId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "isEscalated" BOOLEAN NOT NULL DEFAULT false,
    "blockchainHash" TEXT,
    "blockchainTxHash" TEXT,
    "verifiedOnChain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceFile" (
    "id" TEXT NOT NULL,
    "grievanceId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrievanceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceUpdate" (
    "id" TEXT NOT NULL,
    "grievanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "status" "GrievanceStatus",
    "blockchainTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrievanceUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upvote" (
    "id" TEXT NOT NULL,
    "grievanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upvote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Grievance_blockchainHash_key" ON "Grievance"("blockchainHash");

-- CreateIndex
CREATE INDEX "Grievance_userId_idx" ON "Grievance"("userId");

-- CreateIndex
CREATE INDEX "Grievance_status_idx" ON "Grievance"("status");

-- CreateIndex
CREATE INDEX "Grievance_category_idx" ON "Grievance"("category");

-- CreateIndex
CREATE INDEX "Grievance_priorityScore_idx" ON "Grievance"("priorityScore");

-- CreateIndex
CREATE INDEX "Grievance_createdAt_idx" ON "Grievance"("createdAt");

-- CreateIndex
CREATE INDEX "GrievanceFile_grievanceId_idx" ON "GrievanceFile"("grievanceId");

-- CreateIndex
CREATE INDEX "GrievanceUpdate_grievanceId_idx" ON "GrievanceUpdate"("grievanceId");

-- CreateIndex
CREATE INDEX "GrievanceUpdate_userId_idx" ON "GrievanceUpdate"("userId");

-- CreateIndex
CREATE INDEX "Upvote_grievanceId_idx" ON "Upvote"("grievanceId");

-- CreateIndex
CREATE INDEX "Upvote_userId_idx" ON "Upvote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Upvote_grievanceId_userId_key" ON "Upvote"("grievanceId", "userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceFile" ADD CONSTRAINT "GrievanceFile_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceUpdate" ADD CONSTRAINT "GrievanceUpdate_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceUpdate" ADD CONSTRAINT "GrievanceUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
