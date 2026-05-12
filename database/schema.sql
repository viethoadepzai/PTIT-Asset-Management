PRAGMA foreign_keys = OFF;

DROP VIEW IF EXISTS vw_recent_activities;
DROP VIEW IF EXISTS vw_maintenance_status_summary;
DROP VIEW IF EXISTS vw_allocation_status_summary;
DROP VIEW IF EXISTS vw_supply_low_stock;
DROP VIEW IF EXISTS vw_asset_status_summary;

-- Bảng không phụ thuộc ai (leaf nodes)
DROP TABLE IF EXISTS warranty_tickets;
DROP TABLE IF EXISTS supply_export_items;
DROP TABLE IF EXISTS supply_export_vouchers;
DROP TABLE IF EXISTS asset_loan_items;
DROP TABLE IF EXISTS asset_loan_vouchers;
DROP TABLE IF EXISTS maintenances;
DROP TABLE IF EXISTS allocations;
DROP TABLE IF EXISTS location_quantity_assets;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS quantity_assets;
DROP TABLE IF EXISTS supplies;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS category_need;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    avatar_path VARCHAR(500),
    role VARCHAR(20) NOT NULL DEFAULT 'staff'
        CHECK (role IN ('admin', 'manager', 'staff')),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    must_change_password BOOLEAN NOT NULL DEFAULT 0,
    department_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_code VARCHAR(50) NOT NULL UNIQUE,
    category_type VARCHAR(20) NOT NULL DEFAULT 'supply'
        CHECK (category_type IN ('supply', 'asset')),
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    note TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE category_need (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    require_quantity INTEGER NOT NULL DEFAULT 0 CHECK (require_quantity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);


CREATE TABLE assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,

    serial_number VARCHAR(100) UNIQUE,
    specification TEXT,
    purchase_date DATE,
    purchase_cost NUMERIC(15, 2),
    useful_life INTEGER,

    status VARCHAR(30) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'in_use', 'under_maintenance', 'damaged', 'liquidated')),

    condition VARCHAR(20) NOT NULL DEFAULT 'good'
        CHECK (condition IN ('new', 'good', 'fair', 'poor', 'broken')),

    location VARCHAR(255),
    note TEXT,
    vendor_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    required_quantity_category INTEGER NOT NULL DEFAULT 5,

    assigned_department_id INTEGER,
    assigned_user_id INTEGER,
    category_id INTEGER,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (assigned_department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
);

CREATE TABLE quantity_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,

    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    available_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (available_quantity >= 0 AND available_quantity <= quantity),

    serial_number VARCHAR(100) UNIQUE,
    specification TEXT,
    purchase_date DATE,
    useful_life INTEGER,
    purchase_cost NUMERIC(15, 2),

    status VARCHAR(30) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'in_use', 'under_maintenance', 'damaged', 'liquidated')),

    condition VARCHAR(20) NOT NULL DEFAULT 'good'
        CHECK (condition IN ('new', 'good', 'fair', 'poor', 'broken')),

    location VARCHAR(255),
    note TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,

    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (approval_status IN ('pending', 'approved', 'rejected')),

    required_quantity_category INTEGER NOT NULL DEFAULT 200,

    assigned_department_id INTEGER,
    assigned_user_id INTEGER,
    category_id INTEGER,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (assigned_department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
);

CREATE TABLE location_quantity_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_code VARCHAR(50) NOT NULL DEFAULT 'KHO',

    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0 AND used <= quantity),

    status_approval VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status_approval IN ('not_approval', 'pending', 'approval')),

    quantity_assets_id INTEGER,

    FOREIGN KEY (quantity_assets_id) REFERENCES quantity_assets(id) ON DELETE CASCADE
);

CREATE TABLE supplies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supply_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,

    unit VARCHAR(50) NOT NULL DEFAULT 'item',
    quantity_in_stock NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    minimum_stock_level NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (minimum_stock_level >= 0),
    unit_price NUMERIC(15, 2),

    location VARCHAR(255),

    description TEXT,
    note TEXT,

    managed_department_id INTEGER,
    category_id INTEGER,

    is_active BOOLEAN NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (managed_department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
);


CREATE TABLE allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    allocation_code VARCHAR(50) NOT NULL UNIQUE,
    allocation_type VARCHAR(20) NOT NULL
        CHECK (allocation_type IN ('asset', 'supply')),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'returned', 'cancelled')),
    asset_id INTEGER,
    supply_id INTEGER,
    quantity NUMERIC(15, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    allocated_department_id INTEGER,
    allocated_user_id INTEGER,
    allocated_by_user_id INTEGER,
    allocated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_return_date DATE,
    returned_at DATETIME,
    purpose TEXT,
    note TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL,
    FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE SET NULL,
    FOREIGN KEY (allocated_department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (allocated_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (allocated_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CHECK (
        (allocation_type = 'asset' AND asset_id IS NOT NULL AND supply_id IS NULL AND quantity = 1)
        OR
        (allocation_type = 'supply' AND supply_id IS NOT NULL AND asset_id IS NULL)
    )
);

CREATE TABLE maintenances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    maintenance_code VARCHAR(50) NOT NULL UNIQUE,
    asset_id INTEGER NOT NULL,
    maintenance_type VARCHAR(20) NOT NULL DEFAULT 'corrective'
        CHECK (maintenance_type IN ('preventive', 'corrective', 'inspection', 'warranty', 'other')),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date DATE,
    started_at DATETIME,
    completed_at DATETIME,
    next_maintenance_date DATE,
    cost NUMERIC(15, 2),
    vendor_name VARCHAR(255),
    resolution_note TEXT,
    reported_by_user_id INTEGER,
    assigned_to_user_id INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX ix_departments_id ON departments(id);
CREATE INDEX ix_departments_code ON departments(code);
CREATE INDEX ix_departments_name ON departments(name);

CREATE INDEX ix_users_id ON users(id);
CREATE INDEX ix_users_username ON users(username);
CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_department_id ON users(department_id);

CREATE INDEX ix_assets_id ON assets(id);
CREATE INDEX ix_assets_asset_code ON assets(asset_code);
CREATE INDEX ix_assets_name ON assets(name);
CREATE INDEX ix_assets_category_id ON assets(category_id);
CREATE INDEX ix_assets_assigned_department_id ON assets(assigned_department_id);
CREATE INDEX ix_assets_assigned_user_id ON assets(assigned_user_id);

CREATE INDEX ix_supplies_id ON supplies(id);
CREATE INDEX ix_supplies_supply_code ON supplies(supply_code);
CREATE INDEX ix_supplies_name ON supplies(name);
CREATE INDEX ix_supplies_category_id ON supplies(category_id);
CREATE INDEX ix_supplies_managed_department_id ON supplies(managed_department_id);

CREATE INDEX ix_allocations_id ON allocations(id);
CREATE INDEX ix_allocations_allocation_code ON allocations(allocation_code);
CREATE INDEX ix_allocations_allocation_type ON allocations(allocation_type);
CREATE INDEX ix_allocations_status ON allocations(status);
CREATE INDEX ix_allocations_asset_id ON allocations(asset_id);
CREATE INDEX ix_allocations_supply_id ON allocations(supply_id);
CREATE INDEX ix_allocations_allocated_department_id ON allocations(allocated_department_id);
CREATE INDEX ix_allocations_allocated_user_id ON allocations(allocated_user_id);

CREATE INDEX ix_maintenances_id ON maintenances(id);
CREATE INDEX ix_maintenances_maintenance_code ON maintenances(maintenance_code);
CREATE INDEX ix_maintenances_asset_id ON maintenances(asset_id);
CREATE INDEX ix_maintenances_status ON maintenances(status);
CREATE INDEX ix_maintenances_title ON maintenances(title);
