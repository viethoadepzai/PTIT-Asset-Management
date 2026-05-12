PRAGMA foreign_keys = ON;

CREATE TRIGGER IF NOT EXISTS trg_departments_updated_at
AFTER UPDATE ON departments
FOR EACH ROW
BEGIN
    UPDATE departments SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_assets_updated_at
AFTER UPDATE ON assets
FOR EACH ROW
BEGIN
    UPDATE assets SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_supplies_updated_at
AFTER UPDATE ON supplies
FOR EACH ROW
BEGIN
    UPDATE supplies SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_allocations_updated_at
AFTER UPDATE ON allocations
FOR EACH ROW
BEGIN
    UPDATE allocations SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_maintenances_updated_at
AFTER UPDATE ON maintenances
FOR EACH ROW
BEGIN
    UPDATE maintenances SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_allocations_asset_available_before_insert
BEFORE INSERT ON allocations
FOR EACH ROW
WHEN NEW.allocation_type = 'asset' AND NEW.asset_id IS NOT NULL
BEGIN
    SELECT CASE
        WHEN (SELECT status FROM assets WHERE id = NEW.asset_id) <> 'available'
        THEN RAISE(ABORT, 'Asset must be available before allocation')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_allocations_supply_stock_before_insert
BEFORE INSERT ON allocations
FOR EACH ROW
WHEN NEW.allocation_type = 'supply' AND NEW.supply_id IS NOT NULL
BEGIN
    SELECT CASE
        WHEN (SELECT quantity_in_stock FROM supplies WHERE id = NEW.supply_id) < NEW.quantity
        THEN RAISE(ABORT, 'Not enough supply in stock')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_allocations_supply_stock_after_insert
AFTER INSERT ON allocations
FOR EACH ROW
WHEN NEW.allocation_type = 'supply' AND NEW.supply_id IS NOT NULL
BEGIN
    UPDATE supplies
    SET quantity_in_stock = quantity_in_stock - NEW.quantity
    WHERE id = NEW.supply_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_allocations_supply_stock_after_cancel
AFTER UPDATE OF status ON allocations
FOR EACH ROW
WHEN OLD.allocation_type = 'supply'
     AND OLD.supply_id IS NOT NULL
     AND OLD.status <> 'cancelled'
     AND NEW.status = 'cancelled'
BEGIN
    UPDATE supplies
    SET quantity_in_stock = quantity_in_stock + OLD.quantity
    WHERE id = OLD.supply_id;
END;

CREATE VIEW IF NOT EXISTS vw_asset_status_summary AS
SELECT status, COUNT(*) AS total_assets
FROM assets
WHERE is_active = 1
GROUP BY status
ORDER BY total_assets DESC, status;

CREATE VIEW IF NOT EXISTS vw_supply_low_stock AS
SELECT
    s.id,
    s.supply_code,
    s.name,
    s.category,
    s.unit,
    s.quantity_in_stock,
    s.minimum_stock_level,
    d.name AS managed_department_name
FROM supplies s
LEFT JOIN departments d ON d.id = s.managed_department_id
WHERE s.is_active = 1
  AND s.quantity_in_stock <= s.minimum_stock_level
ORDER BY s.quantity_in_stock ASC, s.name ASC;

CREATE VIEW IF NOT EXISTS vw_allocation_status_summary AS
SELECT status, COUNT(*) AS total_allocations
FROM allocations
WHERE is_active = 1
GROUP BY status
ORDER BY total_allocations DESC, status;

CREATE VIEW IF NOT EXISTS vw_maintenance_status_summary AS
SELECT status, COUNT(*) AS total_maintenances
FROM maintenances
WHERE is_active = 1
GROUP BY status
ORDER BY total_maintenances DESC, status;

CREATE VIEW IF NOT EXISTS vw_recent_activities AS
SELECT
    'allocation' AS activity_type,
    allocation_code AS reference_code,
    allocation_type AS subtype,
    status,
    allocated_at AS activity_time,
    purpose AS description
FROM allocations
UNION ALL
SELECT
    'maintenance' AS activity_type,
    maintenance_code AS reference_code,
    maintenance_type AS subtype,
    status,
    COALESCE(started_at, created_at) AS activity_time,
    title AS description
FROM maintenances
ORDER BY activity_time DESC;
