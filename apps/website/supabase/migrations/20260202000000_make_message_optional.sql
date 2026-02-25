-- Make message column optional (allow NULL)
ALTER TABLE public.contact_submissions
ALTER COLUMN message DROP NOT NULL;
