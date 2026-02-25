-- ============================================================================
-- 누락된 API 매핑 템플릿 추가
-- inventory_levels, inventory_movements, visits, zone_events
-- ============================================================================

-- ============================================================================
-- 1. 재고 수준 (inventory_levels) 매핑 템플릿
-- ============================================================================

-- Generic ERP - 재고 수준
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'generic', 'erp', 'inventory_levels',
  'Generic ERP - Inventory Levels', '일반 ERP 재고 수준 데이터 기본 매핑',
  '/api/inventory/levels', 'data',
  '[
    {"source": "product_id", "target": "product_id", "transform": "to_string", "required": true},
    {"source": "sku", "target": "product_sku", "transform": "to_string"},
    {"source": "current_stock", "target": "current_stock", "transform": "to_integer", "required": true},
    {"source": "optimal_stock", "target": "optimal_stock", "transform": "to_integer"},
    {"source": "minimum_stock", "target": "minimum_stock", "transform": "to_integer"},
    {"source": "weekly_demand", "target": "weekly_demand", "transform": "to_integer"},
    {"source": "last_updated", "target": "last_updated", "transform": "to_timestamp"},
    {"source": "warehouse_id", "target": "warehouse_id", "transform": "to_string"},
    {"source": "location", "target": "location", "transform": "to_string"}
  ]'::jsonb,
  'offset', '{"page_param": "page", "limit_param": "limit", "default_limit": 100}'::jsonb,
  'api_key', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- ============================================================================
-- 2. 재고 이동 (inventory_movements) 매핑 템플릿
-- ============================================================================

-- Generic ERP - 재고 이동
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'generic', 'erp', 'inventory_movements',
  'Generic ERP - Inventory Movements', '일반 ERP 재고 이동 데이터 기본 매핑',
  '/api/inventory/movements', 'data',
  '[
    {"source": "id", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "product_id", "target": "product_id", "transform": "to_string", "required": true},
    {"source": "movement_type", "target": "movement_type", "transform": "to_string", "required": true},
    {"source": "quantity", "target": "quantity", "transform": "to_integer", "required": true},
    {"source": "previous_stock", "target": "previous_stock", "transform": "to_integer"},
    {"source": "new_stock", "target": "new_stock", "transform": "to_integer"},
    {"source": "reason", "target": "reason", "transform": "to_string"},
    {"source": "reference_id", "target": "reference_id", "transform": "to_string"},
    {"source": "moved_at", "target": "moved_at", "transform": "to_timestamp", "required": true},
    {"source": "created_by", "target": "created_by", "transform": "to_string"}
  ]'::jsonb,
  'offset', '{"page_param": "page", "limit_param": "limit", "default_limit": 100}'::jsonb,
  'api_key', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- ============================================================================
-- 3. 방문 (visits) 매핑 템플릿
-- ============================================================================

-- Generic Sensor - 방문 데이터
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'generic', 'sensor', 'visits',
  'Generic Sensor - Visits', '일반 센서 방문 데이터 기본 매핑',
  '/api/visits', 'data',
  '[
    {"source": "id", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "customer_id", "target": "customer_external_id", "transform": "to_string"},
    {"source": "visit_date", "target": "visit_date", "transform": "to_timestamp", "required": true},
    {"source": "entry_time", "target": "entry_time", "transform": "to_timestamp"},
    {"source": "exit_time", "target": "exit_time", "transform": "to_timestamp"},
    {"source": "duration_minutes", "target": "duration_minutes", "transform": "to_integer"},
    {"source": "zones_visited", "target": "zones_visited", "transform": "to_array"},
    {"source": "device_id", "target": "device_id", "transform": "to_string"},
    {"source": "is_returning", "target": "is_returning", "transform": "to_boolean"}
  ]'::jsonb,
  'cursor', '{"cursor_param": "since", "cursor_format": "YYYY-MM-DDTHH:mm:ss"}'::jsonb,
  'api_key', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- ============================================================================
-- 4. 구역 이벤트 (zone_events) 매핑 템플릿
-- ============================================================================

-- Generic Sensor - 구역 이벤트
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'generic', 'sensor', 'zone_events',
  'Generic Sensor - Zone Events', '일반 센서 구역 이벤트 데이터 기본 매핑',
  '/api/zone-events', 'data',
  '[
    {"source": "id", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "zone_id", "target": "zone_external_id", "transform": "to_string", "required": true},
    {"source": "zone_name", "target": "zone_name", "transform": "to_string"},
    {"source": "event_type", "target": "event_type", "transform": "to_string", "required": true},
    {"source": "event_date", "target": "event_date", "transform": "to_date", "required": true},
    {"source": "event_timestamp", "target": "event_timestamp", "transform": "to_timestamp", "required": true},
    {"source": "visitor_id", "target": "visitor_id", "transform": "to_string"},
    {"source": "customer_id", "target": "customer_external_id", "transform": "to_string"},
    {"source": "duration_seconds", "target": "duration_seconds", "transform": "to_integer"},
    {"source": "sensor_type", "target": "sensor_type", "transform": "to_string"},
    {"source": "sensor_id", "target": "sensor_id", "transform": "to_string"},
    {"source": "confidence_score", "target": "confidence_score", "transform": "to_decimal"}
  ]'::jsonb,
  'cursor', '{"cursor_param": "since", "cursor_format": "YYYY-MM-DDTHH:mm:ss"}'::jsonb,
  'api_key', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- ============================================================================
-- 5. WiFi/BLE 센서 전용 템플릿
-- ============================================================================

-- NEURALSENSE WiFi - 구역 이벤트
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'neuralsense', 'sensor', 'zone_events',
  'NEURALSENSE WiFi - Zone Events', 'NEURALSENSE WiFi 센서 구역 이벤트 매핑',
  '/api/v1/events', 'events',
  '[
    {"source": "event_id", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "zone_uuid", "target": "zone_external_id", "transform": "to_string", "required": true},
    {"source": "type", "target": "event_type", "transform": "to_lowercase", "required": true},
    {"source": "timestamp", "target": "event_timestamp", "transform": "to_timestamp", "required": true},
    {"source": "mac_hash", "target": "visitor_id", "transform": "to_string"},
    {"source": "dwell_time", "target": "duration_seconds", "transform": "to_integer"},
    {"source": "signal_strength", "target": "confidence_score", "transform": "to_decimal"},
    {"source": "sensor_mac", "target": "sensor_id", "transform": "to_string"}
  ]'::jsonb,
  'cursor', '{"cursor_param": "from_timestamp", "cursor_format": "unix"}'::jsonb,
  'bearer', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- NEURALSENSE WiFi - 방문 데이터
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'neuralsense', 'sensor', 'visits',
  'NEURALSENSE WiFi - Visits', 'NEURALSENSE WiFi 센서 방문 데이터 매핑',
  '/api/v1/visits', 'visits',
  '[
    {"source": "visit_id", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "mac_hash", "target": "visitor_id", "transform": "to_string"},
    {"source": "entry_timestamp", "target": "visit_date", "transform": "to_timestamp", "required": true},
    {"source": "exit_timestamp", "target": "exit_time", "transform": "to_timestamp"},
    {"source": "total_dwell", "target": "duration_minutes", "transform": "to_integer"},
    {"source": "zones_path", "target": "zones_visited", "transform": "to_array"},
    {"source": "is_repeat", "target": "is_returning", "transform": "to_boolean"}
  ]'::jsonb,
  'cursor', '{"cursor_param": "from_timestamp", "cursor_format": "unix"}'::jsonb,
  'bearer', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- ============================================================================
-- 6. Tosspayments 매핑 템플릿 추가
-- ============================================================================

-- Tosspayments - 거래 데이터
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'tosspayments', 'pos', 'transactions',
  'Tosspayments - Transactions', '토스페이먼츠 거래 데이터 기본 매핑',
  '/v1/transactions', 'data',
  '[
    {"source": "transactionKey", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "transactionAt", "target": "transaction_date", "transform": "to_date", "required": true},
    {"source": "transactionAt", "target": "transaction_time", "transform": "to_timestamp"},
    {"source": "amount", "target": "total_amount", "transform": "to_decimal"},
    {"source": "balanceAmount", "target": "net_amount", "transform": "to_decimal"},
    {"source": "discountAmount", "target": "discount_amount", "transform": "to_decimal"},
    {"source": "status", "target": "payment_status", "transform": "to_string"},
    {"source": "method", "target": "payment_method", "transform": "to_string"},
    {"source": "orderId", "target": "order_id", "transform": "to_string"},
    {"source": "orderName", "target": "order_name", "transform": "to_string"},
    {"source": "currency", "target": "currency", "transform": "to_uppercase"}
  ]'::jsonb,
  'offset', '{"page_param": "page", "limit_param": "size", "default_limit": 100}'::jsonb,
  'basic', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- ============================================================================
-- 7. HubSpot CRM 매핑 템플릿 추가
-- ============================================================================

-- HubSpot - 고객(Contact) 데이터
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'hubspot', 'crm', 'customers',
  'HubSpot - Contacts', 'HubSpot CRM 연락처 데이터 기본 매핑',
  '/crm/v3/objects/contacts', 'results',
  '[
    {"source": "id", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "properties.email", "target": "email", "transform": "to_lowercase"},
    {"source": "properties.firstname", "target": "first_name", "transform": "to_string"},
    {"source": "properties.lastname", "target": "last_name", "transform": "to_string"},
    {"source": "properties.phone", "target": "phone_number", "transform": "to_string"},
    {"source": "properties.company", "target": "company_name", "transform": "to_string"},
    {"source": "properties.lifecyclestage", "target": "lifecycle_stage", "transform": "to_string"},
    {"source": "properties.hs_lead_status", "target": "lead_status", "transform": "to_string"},
    {"source": "createdAt", "target": "registered_date", "transform": "to_timestamp"},
    {"source": "updatedAt", "target": "updated_at", "transform": "to_timestamp"}
  ]'::jsonb,
  'cursor', '{"cursor_param": "after", "cursor_field": "paging.next.after"}'::jsonb,
  'bearer', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- HubSpot - 거래(Deal) 데이터
INSERT INTO api_mapping_templates (
  provider, data_category, target_table, name, description,
  default_endpoint, response_data_path,
  field_mappings, pagination_type, pagination_config,
  suggested_auth_type, is_official
) VALUES (
  'hubspot', 'crm', 'transactions',
  'HubSpot - Deals', 'HubSpot CRM 거래(Deal) 데이터 매핑',
  '/crm/v3/objects/deals', 'results',
  '[
    {"source": "id", "target": "external_id", "transform": "to_string", "required": true},
    {"source": "properties.dealname", "target": "deal_name", "transform": "to_string"},
    {"source": "properties.amount", "target": "total_amount", "transform": "to_decimal"},
    {"source": "properties.dealstage", "target": "deal_stage", "transform": "to_string"},
    {"source": "properties.closedate", "target": "transaction_date", "transform": "to_date"},
    {"source": "properties.pipeline", "target": "pipeline", "transform": "to_string"},
    {"source": "createdAt", "target": "created_at", "transform": "to_timestamp"},
    {"source": "updatedAt", "target": "updated_at", "transform": "to_timestamp"}
  ]'::jsonb,
  'cursor', '{"cursor_param": "after", "cursor_field": "paging.next.after"}'::jsonb,
  'bearer', true
) ON CONFLICT (provider, data_category, target_table, version) DO NOTHING;

-- ============================================================================
-- 완료 메시지
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== 매핑 템플릿 추가 완료 ===';
  RAISE NOTICE 'inventory_levels, inventory_movements, visits, zone_events 템플릿 추가됨';
  RAISE NOTICE 'Tosspayments, HubSpot, NEURALSENSE 템플릿 추가됨';
END $$;
