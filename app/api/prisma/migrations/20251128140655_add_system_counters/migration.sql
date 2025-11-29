/*
  Warnings:

  - You are about to drop the `animals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sponsorships` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "eventstore";

-- DropForeignKey
ALTER TABLE "sponsorships" DROP CONSTRAINT "sponsorships_animal_id_fkey";

-- DropForeignKey
ALTER TABLE "sponsorships" DROP CONSTRAINT "sponsorships_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."breed_types" ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropTable
DROP TABLE "animals";

-- DropTable
DROP TABLE "events";

-- DropTable
DROP TABLE "sponsorships";

-- CreateTable
CREATE TABLE "eventstore"."events" (
    "id" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB NOT NULL,
    "metadata" JSONB,
    "version" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readmodels"."pets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "total_sponsored" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readmodels"."sponsorships" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsorships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_counters" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "total_breeds" INTEGER NOT NULL DEFAULT 0,
    "total_active_pets" INTEGER NOT NULL DEFAULT 0,
    "total_breed_types" INTEGER NOT NULL DEFAULT 0,
    "total_sponsorships" INTEGER NOT NULL DEFAULT 0,
    "total_users" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_aggregate_id_version_idx" ON "eventstore"."events"("aggregate_id", "version");

-- CreateIndex
CREATE INDEX "events_aggregate_type_idx" ON "eventstore"."events"("aggregate_type");

-- CreateIndex
CREATE INDEX "events_event_type_idx" ON "eventstore"."events"("event_type");

-- CreateIndex
CREATE INDEX "sponsorships_pet_id_idx" ON "readmodels"."sponsorships"("pet_id");

-- CreateIndex
CREATE INDEX "sponsorships_user_id_idx" ON "readmodels"."sponsorships"("user_id");

-- AddForeignKey
ALTER TABLE "readmodels"."sponsorships" ADD CONSTRAINT "sponsorships_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "readmodels"."pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readmodels"."sponsorships" ADD CONSTRAINT "sponsorships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
