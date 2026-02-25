-- Update visits: a1a1... (강남점) → 9a382eaf...
UPDATE visits SET store_id = '9a382eaf-f12b-48b3-838e-21dc03ed979e'
WHERE store_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';

-- Update visits: a2a2... (홍대점) → 99a1b0e5...
UPDATE visits SET store_id = '99a1b0e5-d82f-4294-a99c-fa782ad61348'
WHERE store_id = 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2';

-- Update purchases: a1a1... (강남점) → 9a382eaf...
UPDATE purchases SET store_id = '9a382eaf-f12b-48b3-838e-21dc03ed979e'
WHERE store_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';

-- Update purchases: a2a2... (홍대점) → 99a1b0e5...
UPDATE purchases SET store_id = '99a1b0e5-d82f-4294-a99c-fa782ad61348'
WHERE store_id = 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2';

-- Update dashboard_kpis: a1a1... (강남점) → 9a382eaf...
UPDATE dashboard_kpis SET store_id = '9a382eaf-f12b-48b3-838e-21dc03ed979e'
WHERE store_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';

-- Update dashboard_kpis: a2a2... (홍대점) → 99a1b0e5...
UPDATE dashboard_kpis SET store_id = '99a1b0e5-d82f-4294-a99c-fa782ad61348'
WHERE store_id = 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2';

-- Update customers: a1a1... (강남점) → 9a382eaf...
UPDATE customers SET store_id = '9a382eaf-f12b-48b3-838e-21dc03ed979e'
WHERE store_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';

-- Update customers: a2a2... (홍대점) → 99a1b0e5...
UPDATE customers SET store_id = '99a1b0e5-d82f-4294-a99c-fa782ad61348'
WHERE store_id = 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2';

-- Update products: a1a1... (강남점) → 9a382eaf...
UPDATE products SET store_id = '9a382eaf-f12b-48b3-838e-21dc03ed979e'
WHERE store_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';

-- Update products: a2a2... (홍대점) → 99a1b0e5...
UPDATE products SET store_id = '99a1b0e5-d82f-4294-a99c-fa782ad61348'
WHERE store_id = 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2';

-- Update graph_entities: a1a1... (강남점) → 9a382eaf...
UPDATE graph_entities SET store_id = '9a382eaf-f12b-48b3-838e-21dc03ed979e'
WHERE store_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';

-- Update graph_entities: a2a2... (홍대점) → 99a1b0e5...
UPDATE graph_entities SET store_id = '99a1b0e5-d82f-4294-a99c-fa782ad61348'
WHERE store_id = 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2';

-- Delete duplicate stores (a1a1... and a2a2...)
DELETE FROM stores WHERE id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
DELETE FROM stores WHERE id = 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2';