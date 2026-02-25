-- Add consent columns to contact_submissions table
ALTER TABLE public.contact_submissions
ADD COLUMN IF NOT EXISTS privacy_consent BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.contact_submissions.privacy_consent IS '개인정보 수집 및 이용 동의 (필수)';
COMMENT ON COLUMN public.contact_submissions.marketing_consent IS '소식 및 혜택 정보 수신 동의 (선택)';
