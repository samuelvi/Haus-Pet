/*
  Warnings:

  - A unique constraint covering the columns `[breed]` on the table `Pet` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Pet_breed_key" ON "Pet"("breed");
