-- Phase 1.7: 목표 설정 테이블
-- store_goals 테이블 생성

CREATE TABLE IF NOT EXISTS store_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  store_id UUID NOT NULL,
  goal_type VARCHAR(50) NOT NULL,  -- 'revenue', 'visitors', 'conversion', 'avg_basket'
  period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_value NUMERIC NOT NULL,
  created_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, goal_type, period_type, period_start)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_store_goals_store_period ON store_goals(store_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_store_goals_org ON store_goals(org_id);
CREATE INDEX IF NOT EXISTS idx_store_goals_active ON store_goals(store_id, is_active) WHERE is_active = true;

-- RLS 정책
ALTER TABLE store_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org goals" ON store_goals
  FOR SELECT USING (org_id IN (
    SELECT org_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert goals for their org" ON store_goals
  FOR INSERT WITH CHECK (org_id IN (
    SELECT org_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their org goals" ON store_goals
  FOR UPDATE USING (org_id IN (
    SELECT org_id FROM user_roles WHERE user_id = auth.uid()
  ));

-- Phase 2.1: 알림 테이블
CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  store_id UUID,
  user_id UUID,
  alert_type VARCHAR(50) NOT NULL, -- 'inventory', 'conversion', 'goal', 'recommendation', 'roi'
  severity VARCHAR(20) NOT NULL, -- 'critical', 'warning', 'success', 'info'
  title VARCHAR(255) NOT NULL,
  message TEXT,
  action_url VARCHAR(255),
  action_label VARCHAR(100),
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_alerts_user ON user_alerts(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_alerts_store ON user_alerts(store_id, created_at DESC);

-- RLS 정책
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their alerts" ON user_alerts
  FOR SELECT USING (
    user_id = auth.uid() OR
    org_id IN (SELECT org_id FROM user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their alerts" ON user_alerts
  FOR UPDATE USING (user_id = auth.uid());

-- 푸시 구독 테이블 (Optional)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);
