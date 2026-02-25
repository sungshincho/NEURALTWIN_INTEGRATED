-- Drop old HQ sync tables
DROP TABLE IF EXISTS store_mappings CASCADE;
DROP TABLE IF EXISTS hq_sync_logs CASCADE;
DROP TABLE IF EXISTS hq_store_master CASCADE;

-- HQ-Store Messages table
CREATE TABLE hq_store_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  sender_role app_role NOT NULL,
  sender_name TEXT NOT NULL,
  recipient_store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  recipient_role app_role,
  message_type TEXT NOT NULL DEFAULT 'general',
  subject TEXT,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Store Comments table
CREATE TABLE store_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role app_role NOT NULL,
  comment TEXT NOT NULL,
  parent_comment_id UUID REFERENCES store_comments(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- HQ Guidelines table
CREATE TABLE hq_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  target_stores UUID[] DEFAULT ARRAY[]::UUID[],
  priority TEXT DEFAULT 'normal',
  effective_date DATE,
  expiry_date DATE,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- HQ Notifications table
CREATE TABLE hq_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_messages_org_store ON hq_store_messages(org_id, recipient_store_id);
CREATE INDEX idx_messages_created ON hq_store_messages(created_at DESC);
CREATE INDEX idx_comments_store ON store_comments(store_id, created_at DESC);
CREATE INDEX idx_guidelines_org ON hq_guidelines(org_id, is_active);
CREATE INDEX idx_notifications_user_read ON hq_notifications(user_id, is_read, created_at DESC);

-- RLS Policies
ALTER TABLE hq_store_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_notifications ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Org members can view org messages"
  ON hq_store_messages FOR SELECT
  USING (
    org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)
  );

CREATE POLICY "Org members can create messages"
  ON hq_store_messages FOR INSERT
  WITH CHECK (
    org_id IS NOT NULL AND is_org_member(auth.uid(), org_id) AND auth.uid() = user_id
  );

CREATE POLICY "Message sender can update their messages"
  ON hq_store_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Org members can view org comments"
  ON store_comments FOR SELECT
  USING (
    org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)
  );

CREATE POLICY "Org members can create comments"
  ON store_comments FOR INSERT
  WITH CHECK (
    org_id IS NOT NULL AND is_org_member(auth.uid(), org_id) AND auth.uid() = user_id
  );

CREATE POLICY "Comment author can update their comments"
  ON store_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Comment author can delete their comments"
  ON store_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Guidelines policies
CREATE POLICY "Org members can view org guidelines"
  ON hq_guidelines FOR SELECT
  USING (
    org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)
  );

CREATE POLICY "HQ admins can create guidelines"
  ON hq_guidelines FOR INSERT
  WITH CHECK (
    org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id) AND auth.uid() = user_id
  );

CREATE POLICY "HQ admins can update guidelines"
  ON hq_guidelines FOR UPDATE
  USING (
    org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)
  );

CREATE POLICY "HQ admins can delete guidelines"
  ON hq_guidelines FOR DELETE
  USING (
    org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON hq_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Org members can create notifications"
  ON hq_notifications FOR INSERT
  WITH CHECK (
    org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)
  );

CREATE POLICY "Users can update their own notifications"
  ON hq_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON hq_store_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON store_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guidelines_updated_at
  BEFORE UPDATE ON hq_guidelines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();