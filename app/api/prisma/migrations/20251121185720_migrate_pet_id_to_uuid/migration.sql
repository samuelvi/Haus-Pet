-- AlterTable: Change pet.id from SERIAL to TEXT (UUID)
-- WARNING: This is a destructive migration. All existing pet data will be lost.

-- Drop the old pet table and recreate with UUID
DROP TABLE IF EXISTS "pet";

CREATE TABLE "pet" (
    "id" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "type" "PetType" NOT NULL,

    CONSTRAINT "pet_pkey" PRIMARY KEY ("id")
);

-- Re-create unique constraint on breed
CREATE UNIQUE INDEX "pet_breed_key" ON "pet"("breed");
