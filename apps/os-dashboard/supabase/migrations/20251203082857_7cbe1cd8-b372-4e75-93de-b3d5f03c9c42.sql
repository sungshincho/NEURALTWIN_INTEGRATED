
-- 값이 0인 중복 레코드 삭제 (실제 데이터가 있는 레코드만 유지)
DELETE FROM dashboard_kpis 
WHERE org_id = '0c6076e3-a993-4022-9b40-0f4e4370f8ef'
  AND total_visits = 0 
  AND total_revenue = 0;
