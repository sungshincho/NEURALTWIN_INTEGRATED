-- Fix extension in public schema security issue
-- Move pg_trgm extension from public to extensions schema

-- Drop the extension from public schema
DROP EXTENSION IF EXISTS "pg_trgm" CASCADE;

-- Create the extension in the extensions schema
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";

-- Note: The extension functionality will still work for queries in the public schema
-- because PostgreSQL allows cross-schema extension usage