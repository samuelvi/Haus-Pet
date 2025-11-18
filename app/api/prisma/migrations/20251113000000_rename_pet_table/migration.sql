-- Rename table from "Pet" (case-sensitive) to "pet" (lowercase)
-- This fixes the issue where tests expect lowercase table name
ALTER TABLE "Pet" RENAME TO "pet";
