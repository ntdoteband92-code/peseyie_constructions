-- =====================================================
-- PESPEYIE CONSTRUCTIONS — SCHEMA MIGRATION
-- Run this BEFORE running seed.sql to sync your DB schema
-- =====================================================

-- Add missing columns to tenders (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'issuing_department') THEN
    ALTER TABLE public.tenders ADD COLUMN issuing_department TEXT;
  END IF;
END $$;

-- Add missing columns to projects (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_type') THEN
    ALTER TABLE public.projects ADD COLUMN project_type TEXT[];
  END IF;
END $$;

-- Make sure estimations table has needed columns (already exists in schema, but safe to check)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'estimations' AND column_name = 'grand_total') THEN
    ALTER TABLE public.estimations ADD COLUMN grand_total NUMERIC(14,2) DEFAULT 0;
  END IF;
END $$;

RAISE NOTICE 'Schema migration completed. Now run seed.sql';