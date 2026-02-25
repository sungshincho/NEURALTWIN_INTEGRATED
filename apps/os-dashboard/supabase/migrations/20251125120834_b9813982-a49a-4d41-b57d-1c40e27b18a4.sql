-- Fix search_path for security definer functions
CREATE OR REPLACE FUNCTION can_access_membership(membership_user_id UUID, membership_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() = membership_user_id THEN
    RETURN TRUE;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'neuraltwin.hq@neuraltwin.io'
  ) THEN
    RETURN TRUE;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.org_id = membership_org_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix search_path for is_org_admin_simple
CREATE OR REPLACE FUNCTION is_org_admin_simple(check_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'neuraltwin.hq@neuraltwin.io'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.org_id = check_org_id
    AND om.role IN ('ORG_OWNER', 'ORG_ADMIN', 'ORG_HQ')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix search_path for notification functions
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_user_id UUID;
  recipient_users UUID[];
BEGIN
  IF NEW.recipient_store_id IS NOT NULL THEN
    SELECT ARRAY_AGG(DISTINCT om.user_id)
    INTO recipient_users
    FROM organization_members om
    JOIN stores s ON s.org_id = om.org_id
    WHERE s.id = NEW.recipient_store_id
      AND om.role IN ('ORG_STORE', 'ORG_HQ');
  ELSE
    SELECT ARRAY_AGG(user_id)
    INTO recipient_users
    FROM organization_members
    WHERE org_id = NEW.org_id
      AND user_id != NEW.user_id;
  END IF;

  IF recipient_users IS NOT NULL THEN
    FOR recipient_user_id IN SELECT UNNEST(recipient_users)
    LOOP
      INSERT INTO hq_notifications (
        user_id,
        org_id,
        notification_type,
        title,
        message,
        reference_id,
        reference_type
      ) VALUES (
        recipient_user_id,
        NEW.org_id,
        'message',
        CASE
          WHEN NEW.subject IS NOT NULL THEN NEW.subject
          ELSE '새 메시지: ' || NEW.message_type
        END,
        NEW.sender_name || '님이 메시지를 보냈습니다: ' || 
        SUBSTRING(NEW.content, 1, 100) || 
        CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
        NEW.id,
        'message'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION create_guideline_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_user_id UUID;
  recipient_users UUID[];
BEGIN
  IF NEW.target_stores IS NOT NULL AND ARRAY_LENGTH(NEW.target_stores, 1) > 0 THEN
    SELECT ARRAY_AGG(DISTINCT om.user_id)
    INTO recipient_users
    FROM organization_members om
    JOIN stores s ON s.org_id = om.org_id
    WHERE s.id = ANY(NEW.target_stores)
      AND om.role IN ('ORG_STORE', 'ORG_HQ')
      AND om.user_id != NEW.user_id;
  ELSE
    SELECT ARRAY_AGG(user_id)
    INTO recipient_users
    FROM organization_members
    WHERE org_id = NEW.org_id
      AND user_id != NEW.user_id;
  END IF;

  IF recipient_users IS NOT NULL THEN
    FOR recipient_user_id IN SELECT UNNEST(recipient_users)
    LOOP
      INSERT INTO hq_notifications (
        user_id,
        org_id,
        notification_type,
        title,
        message,
        reference_id,
        reference_type
      ) VALUES (
        recipient_user_id,
        NEW.org_id,
        'guideline',
        '새 가이드라인: ' || NEW.title,
        '카테고리: ' || NEW.category || ' | 우선순위: ' || NEW.priority,
        NEW.id,
        'guideline'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;