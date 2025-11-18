-- CreateEnum
CREATE TYPE "PetType" AS ENUM ('cat', 'dog', 'bird');

-- CreateTable
CREATE TABLE "Pet" (
    "id" SERIAL NOT NULL,
    "breed" TEXT NOT NULL,
    "type" "PetType" NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Pet_breed_key" ON "Pet"("breed");
