
-- Update visits dates to recent dates (2025)
UPDATE visits SET visit_date = '2025-12-01 10:00:00+00' WHERE id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1';
UPDATE visits SET visit_date = '2025-12-01 14:00:00+00' WHERE id = 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2';
UPDATE visits SET visit_date = '2025-12-02 11:00:00+00' WHERE id = 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3';

-- Update purchases dates to recent dates (2025)
UPDATE purchases SET purchase_date = '2025-12-01 10:30:00+00' WHERE id = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
UPDATE purchases SET purchase_date = '2025-12-01 14:30:00+00' WHERE id = 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2';
UPDATE purchases SET purchase_date = '2025-12-02 11:30:00+00' WHERE id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3';
UPDATE purchases SET purchase_date = '2025-12-02 16:00:00+00' WHERE id = 'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4';

-- Update dashboard_kpis dates to recent dates (2025)
UPDATE dashboard_kpis SET date = '2025-11-26' WHERE date = '2024-11-26';
UPDATE dashboard_kpis SET date = '2025-11-27' WHERE date = '2024-11-27';
UPDATE dashboard_kpis SET date = '2025-11-28' WHERE date = '2024-11-28';
UPDATE dashboard_kpis SET date = '2025-11-29' WHERE date = '2024-11-29';
UPDATE dashboard_kpis SET date = '2025-11-30' WHERE date = '2024-11-30';
UPDATE dashboard_kpis SET date = '2025-12-01' WHERE date = '2024-12-01';
UPDATE dashboard_kpis SET date = '2025-12-02' WHERE date = '2024-12-02';
UPDATE dashboard_kpis SET date = '2025-12-03' WHERE date = '2024-12-03';
