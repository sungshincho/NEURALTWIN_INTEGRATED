-- 강남점 12/01 visits 추가 (148건)
INSERT INTO visits (user_id, org_id, store_id, customer_id, visit_date, duration_minutes)
SELECT 
  'af316ab2-ffb5-4509-bd37-13aa31feb5ad'::uuid,
  '0c6076e3-a993-4022-9b40-0f4e4370f8ef'::uuid,
  '9a382eaf-f12b-48b3-838e-21dc03ed979e'::uuid,
  c.id,
  '2025-12-01'::timestamp + (interval '1 hour' * (9 + (row_number() OVER () % 12))) + (interval '1 minute' * (row_number() OVER () % 60)),
  (15 + (row_number() OVER () % 45))::int
FROM customers c
WHERE c.org_id = '0c6076e3-a993-4022-9b40-0f4e4370f8ef'
  AND c.store_id = '9a382eaf-f12b-48b3-838e-21dc03ed979e'
LIMIT 148;

-- 강남점 12/02 visits 추가 (120건)
INSERT INTO visits (user_id, org_id, store_id, customer_id, visit_date, duration_minutes)
SELECT 
  'af316ab2-ffb5-4509-bd37-13aa31feb5ad'::uuid,
  '0c6076e3-a993-4022-9b40-0f4e4370f8ef'::uuid,
  '9a382eaf-f12b-48b3-838e-21dc03ed979e'::uuid,
  c.id,
  '2025-12-02'::timestamp + (interval '1 hour' * (9 + (row_number() OVER () % 12))) + (interval '1 minute' * (row_number() OVER () % 60)),
  (15 + (row_number() OVER () % 45))::int
FROM customers c
WHERE c.org_id = '0c6076e3-a993-4022-9b40-0f4e4370f8ef'
  AND c.store_id = '9a382eaf-f12b-48b3-838e-21dc03ed979e'
LIMIT 120;

-- 홍대점 12/01 visits 추가 (129건)
INSERT INTO visits (user_id, org_id, store_id, customer_id, visit_date, duration_minutes)
SELECT 
  'af316ab2-ffb5-4509-bd37-13aa31feb5ad'::uuid,
  '0c6076e3-a993-4022-9b40-0f4e4370f8ef'::uuid,
  '99a1b0e5-d82f-4294-a99c-fa782ad61348'::uuid,
  c.id,
  '2025-12-01'::timestamp + (interval '1 hour' * (9 + (row_number() OVER () % 12))) + (interval '1 minute' * (row_number() OVER () % 60)),
  (15 + (row_number() OVER () % 45))::int
FROM customers c
WHERE c.org_id = '0c6076e3-a993-4022-9b40-0f4e4370f8ef'
  AND c.store_id = '99a1b0e5-d82f-4294-a99c-fa782ad61348'
LIMIT 129;