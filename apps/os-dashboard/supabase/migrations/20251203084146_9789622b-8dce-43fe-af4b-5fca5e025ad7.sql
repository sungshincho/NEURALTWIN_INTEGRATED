-- 홍대점 12/01 중복 레코드 삭제 (total_visits=0인 것)
DELETE FROM dashboard_kpis 
WHERE org_id = '0c6076e3-a993-4022-9b40-0f4e4370f8ef'
  AND store_id = '99a1b0e5-d82f-4294-a99c-fa782ad61348'
  AND date = '2025-12-01'
  AND total_visits = 0;