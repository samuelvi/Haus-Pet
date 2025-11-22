-- Refactor: Rename Pet model to Breed for semantic clarity
-- Rename PetType enum to AnimalType
-- Rename table columns for better naming

-- Step 1: Rename the enum type
ALTER TYPE "PetType" RENAME TO "AnimalType";

-- Step 2: Rename the table
ALTER TABLE public.pet RENAME TO breed;

-- Step 3: Rename the column 'breed' to 'name' in the breed table
ALTER TABLE public.breed RENAME COLUMN breed TO name;

-- Step 4: Rename the column 'type' to 'animal_type' in the breed table
ALTER TABLE public.breed RENAME COLUMN type TO animal_type;

-- Step 5: Update index names
ALTER INDEX "pet_pkey" RENAME TO "breed_pkey";
ALTER INDEX "pet_breed_key" RENAME TO "breed_name_key";
