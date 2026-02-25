
-- Final corrected seed data

-- 1. Stores
INSERT INTO stores (id, store_name, store_code, address, manager_name, user_id, org_id, area_sqm)
VALUES 
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '강남점', 'STORE-001', '서울시 강남구 테헤란로 123', '김매니저', 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 500),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', '홍대점', 'STORE-002', '서울시 마포구 홍대입구역 456', '이매니저', 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 350)
ON CONFLICT (id) DO NOTHING;

-- 2. Customers
INSERT INTO customers (id, customer_name, email, phone, segment, user_id, org_id, store_id)
VALUES
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '고객A', 'customera@email.com', '010-1111-1111', 'VIP', 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', '고객B', 'customerb@email.com', '010-2222-2222', 'Regular', 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '고객C', 'customerc@email.com', '010-3333-3333', 'New', 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2')
ON CONFLICT (id) DO NOTHING;

-- 3. Products
INSERT INTO products (id, product_name, sku, category, price, cost_price, user_id, org_id, store_id)
VALUES
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '프리미엄 자켓', 'SKU-001', '의류', 150000, 80000, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '캐주얼 티셔츠', 'SKU-002', '의류', 35000, 15000, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', '스니커즈', 'SKU-003', '신발', 89000, 45000, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2'),
  ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', '데님 팬츠', 'SKU-004', '의류', 79000, 35000, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2')
ON CONFLICT (id) DO NOTHING;

-- 4. Visits
INSERT INTO visits (id, customer_id, visit_date, duration_minutes, user_id, org_id, store_id)
VALUES
  ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '2024-12-01 10:00:00', 45, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', '2024-12-01 14:00:00', 30, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '2024-12-02 11:00:00', 20, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2')
ON CONFLICT (id) DO NOTHING;

-- 5. Purchases
INSERT INTO purchases (id, customer_id, product_id, visit_id, purchase_date, quantity, unit_price, total_price, user_id, org_id, store_id)
VALUES
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', '2024-12-01 10:30:00', 1, 150000, 150000, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', '2024-12-01 10:35:00', 2, 35000, 70000, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', '2024-12-01 14:20:00', 1, 35000, 35000, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', '2024-12-02 11:15:00', 1, 89000, 89000, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2')
ON CONFLICT (id) DO NOTHING;

-- 6. Inventory levels (no store_id column)
INSERT INTO inventory_levels (id, product_id, current_stock, minimum_stock, optimal_stock, weekly_demand, user_id, org_id)
VALUES
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 25, 10, 50, 5, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 100, 30, 150, 20, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0'),
  ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 45, 20, 80, 8, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0'),
  ('f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 60, 25, 100, 12, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0')
ON CONFLICT (id) DO NOTHING;

-- 7. Dashboard KPIs
INSERT INTO dashboard_kpis (id, date, total_visits, total_purchases, total_revenue, conversion_rate, funnel_entry, funnel_browse, funnel_fitting, funnel_purchase, user_id, org_id, store_id)
VALUES
  ('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024-12-01', 150, 45, 2500000, 30.0, 150, 100, 60, 45, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024-12-02', 120, 35, 1800000, 29.2, 120, 80, 50, 35, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('cccc3333-cccc-cccc-cccc-cccccccccccc', '2024-12-01', 80, 25, 1200000, 31.3, 80, 55, 35, 25, 'e4200130-08e8-47da-8c92-3d0b90fafd77', 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2')
ON CONFLICT (id) DO NOTHING;
