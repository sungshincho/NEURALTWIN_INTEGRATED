-- 1. 먼저 400명의 고객 생성
INSERT INTO customers (user_id, org_id, store_id, customer_name, email, segment)
SELECT 
  'af316ab2-ffb5-4509-bd37-13aa31feb5ad'::uuid,
  '0c6076e3-a993-4022-9b40-0f4e4370f8ef'::uuid,
  CASE WHEN n % 2 = 0 
    THEN '9a382eaf-f12b-48b3-838e-21dc03ed979e'::uuid  -- 강남점
    ELSE '99a1b0e5-d82f-4294-a99c-fa782ad61348'::uuid  -- 홍대점
  END,
  'Customer_' || n,
  'customer' || n || '@test.com',
  CASE (n % 4) 
    WHEN 0 THEN 'VIP'
    WHEN 1 THEN 'Regular'
    WHEN 2 THEN 'New'
    ELSE 'Occasional'
  END
FROM generate_series(100, 499) AS n;