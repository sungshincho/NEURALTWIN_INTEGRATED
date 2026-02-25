-- Update dashboard_kpis org_id to user's org
UPDATE dashboard_kpis 
SET org_id = '0c6076e3-a993-4022-9b40-0f4e4370f8ef'
WHERE user_id = 'e4200130-08e8-47da-8c92-3d0b90fafd77'
AND (org_id IS NULL OR org_id = 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0');

-- Update visits org_id
UPDATE visits 
SET org_id = '0c6076e3-a993-4022-9b40-0f4e4370f8ef'
WHERE user_id = 'e4200130-08e8-47da-8c92-3d0b90fafd77'
AND (org_id IS NULL OR org_id = 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0');

-- Update purchases org_id
UPDATE purchases 
SET org_id = '0c6076e3-a993-4022-9b40-0f4e4370f8ef'
WHERE user_id = 'e4200130-08e8-47da-8c92-3d0b90fafd77'
AND (org_id IS NULL OR org_id = 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0');

-- Update customers org_id
UPDATE customers 
SET org_id = '0c6076e3-a993-4022-9b40-0f4e4370f8ef'
WHERE user_id = 'e4200130-08e8-47da-8c92-3d0b90fafd77'
AND (org_id IS NULL OR org_id = 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0');

-- Update products org_id
UPDATE products 
SET org_id = '0c6076e3-a993-4022-9b40-0f4e4370f8ef'
WHERE user_id = 'e4200130-08e8-47da-8c92-3d0b90fafd77'
AND (org_id IS NULL OR org_id = 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0');

-- Update graph_entities org_id
UPDATE graph_entities 
SET org_id = '0c6076e3-a993-4022-9b40-0f4e4370f8ef'
WHERE user_id = 'e4200130-08e8-47da-8c92-3d0b90fafd77'
AND (org_id IS NULL OR org_id = 'e738e7b1-e4bd-49f1-bd96-6de4c257b5a0');