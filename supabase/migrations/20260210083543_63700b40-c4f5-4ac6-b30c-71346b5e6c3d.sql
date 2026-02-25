
-- Fix notification_settings org_rls to require authentication
DROP POLICY IF EXISTS "org_rls" ON public.notification_settings;
CREATE POLICY "org_rls" ON public.notification_settings FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      org_id IS NULL OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid() AND om.org_id = notification_settings.org_id
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      org_id IS NULL OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid() AND om.org_id = notification_settings.org_id
      )
    )
  );
