-- Create contact_submissions table for contact form data
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  stores INTEGER,
  features TEXT[],
  timeline TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for contact_submissions
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can submit contact form
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- Create subscriptions table for managing organization subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('FREE', 'BASIC', 'PRO', 'ENTERPRISE')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  store_quota INTEGER NOT NULL DEFAULT 1,
  hq_seat_quota INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id)
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON public.subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Org members can view their subscription"
  ON public.subscriptions
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org owners and admins can update subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid()
        AND role IN ('ORG_OWNER', 'ORG_ADMIN')
    )
  );

CREATE POLICY "NEURALTWIN admins have full access to subscriptions"
  ON public.subscriptions
  USING (is_neuraltwin_admin(auth.uid()));