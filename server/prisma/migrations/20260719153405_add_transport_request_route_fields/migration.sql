-- AlterTable
ALTER TABLE "TransportRequest" ADD COLUMN     "destinationLatitude" DOUBLE PRECISION,
ADD COLUMN     "destinationLongitude" DOUBLE PRECISION,
ADD COLUMN     "estimatedDistanceKm" DOUBLE PRECISION,
ADD COLUMN     "estimatedDurationMinutes" INTEGER,
ADD COLUMN     "pickupLatitude" DOUBLE PRECISION,
ADD COLUMN     "pickupLongitude" DOUBLE PRECISION;
