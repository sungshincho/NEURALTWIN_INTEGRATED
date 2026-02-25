-- Make phone column required (NOT NULL)
-- First, update any existing NULL values to a placeholder
UPDATE public.contact_submissions
SET phone = ''
WHERE phone IS NULL;

-- Then, set the column to NOT NULL
ALTER TABLE public.contact_submissions
ALTER COLUMN phone SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.contact_submissions.phone IS '연락처 (필수)';
