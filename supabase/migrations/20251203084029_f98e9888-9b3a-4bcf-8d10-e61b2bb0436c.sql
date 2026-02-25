-- 홍대점 12/01 추가 visit 1건 (129 + 1 = 130)
INSERT INTO visits (user_id, org_id, store_id, customer_id, visit_date, duration_minutes)
SELECT 
  'af316ab2-ffb5-4509-bd37-13aa31feb5ad'::uuid,
  '0c6076e3-a993-4022-9b40-0f4e4370f8ef'::uuid,
  '99a1b0e5-d82f-4294-a99c-fa782ad61348'::uuid,
  c.id,
  '2025-12-01 15:30:00'::timestamp,
  25
FROM customers c
WHERE c.org_id = '0c6076e3-a993-4022-9b40-0f4e4370f8ef'
  AND c.store_id = '99a1b0e5-d82f-4294-a99c-fa782ad61348'
LIMIT 1;

-- 홍대점 dashboard_kpis 추가
INSERT INTO dashboard_kpis (user_id, org_id, store_id, date, total_visits, total_purchases, total_revenue, conversion_rate, funnel_entry, funnel_browse, funnel_fitting, funnel_purchase)
VALUES 
  ('af316ab2-ffb5-4509-bd37-13aa31feb5ad', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', '99a1b0e5-d82f-4294-a99c-fa782ad61348', '2025-12-01', 130, 26, 650000, 20.0, 130, 78, 39, 26),
  ('af316ab2-ffb5-4509-bd37-13aa31feb5ad', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', '99a1b0e5-d82f-4294-a99c-fa782ad61348', '2025-12-02', 1, 0, 0, 0, 1, 0, 0, 0)
ON CONFLICT DO NOTHING;