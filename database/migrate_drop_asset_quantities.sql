-- Migrate data from legacy table `asset_quantities` (if any) into `quantity_assets`,
-- then drop `asset_quantities`.
--
-- Usage:
--   sqlite3 ptit_assets.db < migrate_drop_asset_quantities.sql

PRAGMA foreign_keys = ON;

INSERT INTO quantity_assets (
    name,
    quantity,
    available_quantity,
    category,
    specification,
    purchase_date,
    purchase_cost,
    status,
    condition,
    location,
    note,
    is_active,
    assigned_department_id,
    assigned_user_id,
    created_at,
    updated_at
)
SELECT
    aq.name,
    aq.quantity,
    aq.quantity,
    aq.category,
    aq.specification,
    aq.purchase_date,
    aq.purchase_cost,
    aq.status,
    aq.condition,
    aq.location,
    aq.note,
    aq.is_active,
    aq.assigned_department_id,
    aq.assigned_user_id,
    aq.created_at,
    aq.updated_at
FROM asset_quantities aq
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='asset_quantities');

DROP TABLE IF EXISTS asset_quantities;

