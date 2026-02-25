-- Delete all dashboard_kpis records with null org_id (garbage data)
DELETE FROM dashboard_kpis WHERE org_id IS NULL;

-- Update remaining records that might have correct data but wrong org_id  
-- Set org_id for 강남점 and 홍대점 records based on store's org_id
UPDATE dashboard_kpis dk
SET org_id = s.org_id
FROM stores s
WHERE dk.store_id = s.id
AND dk.org_id IS NULL;