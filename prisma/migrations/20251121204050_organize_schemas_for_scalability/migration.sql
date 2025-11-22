-- Organize tables into logical schemas for future scalability
-- This migration moves tables to separate schemas without data loss

-- Create new schemas
CREATE SCHEMA IF NOT EXISTS eventstore;
CREATE SCHEMA IF NOT EXISTS readmodels;

-- Move Event Store table to 'eventstore' schema
ALTER TABLE public.events SET SCHEMA eventstore;

-- Move Read Models to 'readmodels' schema
ALTER TABLE public.animals SET SCHEMA readmodels;
ALTER TABLE public.sponsorships SET SCHEMA readmodels;

-- Note: Pet, User tables, and enums remain in 'public' schema
-- This organization allows for future database separation:
-- - eventstore schema can be moved to a dedicated Event Store database
-- - readmodels schema can be moved to a dedicated Read Models database
-- - public schema stays in the main application database
