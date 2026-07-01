-- CreateEnum
CREATE TYPE "VehicleIssueStatus" AS ENUM ('REPORTED', 'IN_PROGRESS', 'RESOLVED');

-- CreateTable
CREATE TABLE "VehicleIssueReport" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "issueTitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "VehicleIssueStatus" NOT NULL DEFAULT 'REPORTED',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleIssueReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VehicleIssueReport" ADD CONSTRAINT "VehicleIssueReport_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleIssueReport" ADD CONSTRAINT "VehicleIssueReport_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
