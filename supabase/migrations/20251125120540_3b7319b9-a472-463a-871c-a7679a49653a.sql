-- Create function to create notification when message is sent
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_user_id UUID;
  recipient_users UUID[];
BEGIN
  -- If specific store is targeted, find store managers
  IF NEW.recipient_store_id IS NOT NULL THEN
    SELECT ARRAY_AGG(DISTINCT om.user_id)
    INTO recipient_users
    FROM organization_members om
    JOIN stores s ON s.org_id = om.org_id
    WHERE s.id = NEW.recipient_store_id
      AND om.role IN ('ORG_STORE', 'ORG_HQ');
  ELSE
    -- If no specific store, notify all org members except sender
    SELECT ARRAY_AGG(user_id)
    INTO recipient_users
    FROM organization_members
    WHERE org_id = NEW.org_id
      AND user_id != NEW.user_id;
  END IF;

  -- Create notification for each recipient
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS message_notification_trigger ON hq_store_messages;
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON hq_store_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Create function to create notification when guideline is created
CREATE OR REPLACE FUNCTION create_guideline_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_user_id UUID;
  recipient_users UUID[];
BEGIN
  -- If specific stores are targeted
  IF NEW.target_stores IS NOT NULL AND ARRAY_LENGTH(NEW.target_stores, 1) > 0 THEN
    SELECT ARRAY_AGG(DISTINCT om.user_id)
    INTO recipient_users
    FROM organization_members om
    JOIN stores s ON s.org_id = om.org_id
    WHERE s.id = ANY(NEW.target_stores)
      AND om.role IN ('ORG_STORE', 'ORG_HQ')
      AND om.user_id != NEW.user_id;
  ELSE
    -- If no specific stores, notify all org members except sender
    SELECT ARRAY_AGG(user_id)
    INTO recipient_users
    FROM organization_members
    WHERE org_id = NEW.org_id
      AND user_id != NEW.user_id;
  END IF;

  -- Create notification for each recipient
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for guideline notifications
DROP TRIGGER IF EXISTS guideline_notification_trigger ON hq_guidelines;
CREATE TRIGGER guideline_notification_trigger
  AFTER INSERT ON hq_guidelines
  FOR EACH ROW
  EXECUTE FUNCTION create_guideline_notification();