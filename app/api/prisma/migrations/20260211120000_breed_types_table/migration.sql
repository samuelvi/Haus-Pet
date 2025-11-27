-- Create table for breed types
CREATE TABLE IF NOT EXISTS "breed_types" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default types (idempotent)
INSERT INTO "breed_types" ("id", "name")
VALUES
    ('type-cat', 'cat'),
    ('type-dog', 'dog'),
    ('type-bird', 'bird')
ON CONFLICT ("name") DO NOTHING;

-- Add FK column to breed
ALTER TABLE "breed" ADD COLUMN IF NOT EXISTS "breed_type_id" TEXT;

-- Backfill based on existing pet_type values if present
UPDATE "breed" b
SET "breed_type_id" = bt.id
FROM "breed_types" bt
WHERE b.breed_type_id IS NULL
  AND b.pet_type IS NOT NULL
  AND b.pet_type::text <> ''
  AND LOWER(b.pet_type::text) = LOWER(bt.name);

-- Fallback: assign any remaining NULL breed_type_id to 'dog' type to avoid enum cast errors
UPDATE "breed"
SET "breed_type_id" = (SELECT id FROM "breed_types" WHERE name = 'dog' LIMIT 1)
WHERE "breed_type_id" IS NULL;

-- Ensure column is populated
ALTER TABLE "breed" ALTER COLUMN "breed_type_id" SET NOT NULL;

-- Add FK constraint
ALTER TABLE "breed"
    ADD CONSTRAINT "breed_breed_type_id_fkey"
    FOREIGN KEY ("breed_type_id") REFERENCES "breed_types"("id")
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- Drop old enum column if it exists
ALTER TABLE "breed" DROP COLUMN IF EXISTS "pet_type";

-- Update read model pets.type to text
ALTER TABLE "readmodels"."pets"
    ALTER COLUMN "type" TYPE TEXT USING "type"::text;

-- Drop enum type if it still exists (should have no dependents now)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PetType') THEN
        DROP TYPE "PetType";
    END IF;
END $$;
