PRAGMA foreign_keys = OFF;

-- Xóa dữ liệu cũ theo đúng thứ tự bảng (tránh vi phạm FK)
-- Chỉ DELETE bảng có trong schema.sql
DELETE FROM allocations;
DELETE FROM location_quantity_assets;
DELETE FROM maintenances;
DELETE FROM assets;
DELETE FROM quantity_assets;
DELETE FROM supplies;
DELETE FROM users;
DELETE FROM category_need;
DELETE FROM category;
DELETE FROM departments;

PRAGMA foreign_keys = ON;

-- ============================================================
-- PHÒNG BAN
-- ============================================================
INSERT INTO departments (code, name, description, is_active)
VALUES
    ('HCQT', 'Hành chính - Quản trị', 'Phòng Hành chính Quản trị, quản lý tài sản và vật tư toàn học viện', 1),
    ('CNTT', 'Công nghệ thông tin', 'Phòng Công nghệ thông tin, quản trị hạ tầng và thiết bị công nghệ', 1),
    ('LAB',  'Phòng thí nghiệm',       'Quản lý vật tư và thiết bị phòng Lab máy tính', 1),
    ('ĐT',   'Đào tạo',                'Phòng Đào tạo, quản lý giảng đường và lịch học', 1),
    ('KT',   'Kế toán',                 'Phòng Kế toán, theo dõi tài chính và mua sắm', 1);

-- ============================================================
-- NGƯỜI DÙNG
-- Mật khẩu tất cả tài khoản (trừ admin): "matkhauratmanh" -> hash argon2
-- ============================================================
INSERT INTO users (username, email, full_name, hashed_password, phone_number, role, is_active, must_change_password, department_id)
VALUES
    ---('admin',  'admin@ptit.edu.vn',  'Quản trị viên hệ thống',  '$argon2id$v=19$m=65536,t=3,p=4$7yoyWi3UxMnwCf5SkoyevQ$UZcoFT0rMMP/IVQPYAZ+LHZa6f3+FKhCyxu3mamydKM', '0901000001', 'admin',  1, 1, 1),
    ('manager','manager@ptit.edu.vn', 'Nguyễn Thị Minh',         '$argon2id$v=19$m=65536,t=3,p=4$EdabqWNfg0rbakPxLXNDKQ$oG9Wn0lu46Vb5M/STuqlZz4FGWo30xErY/pPYfzfOPg', '0901000002', 'manager', 1, 0, 2),
    ('staff01','staff01@ptit.edu.vn', 'Trần Văn An',             '$argon2id$v=19$m=65536,t=3,p=4$EdabqWNfg0rbakPxLXNDKQ$oG9Wn0lu46Vb5M/STuqlZz4FGWo30xErY/pPYfzfOPg', '0901000003', 'staff',   1, 0, 4),
    ('staff02','staff02@ptit.edu.vn', 'Lê Hoàng Bình',           '$argon2id$v=19$m=65536,t=3,p=4$EdabqWNfg0rbakPxLXNDKQ$oG9Wn0lu46Vb5M/STuqlZz4FGWo30xErY/pPYfzfOPg', '0901000004', 'staff',   1, 0, 4),
    ('staff03','staff03@ptit.edu.vn', 'Phạm Thị Cúc',            '$argon2id$v=19$m=65536,t=3,p=4$EdabqWNfg0rbakPxLXNDKQ$oG9Wn0lu46Vb5M/STuqlZz4FGWo30xErY/pPYfzfOPg', '0901000005', 'staff',   1, 0, 1);

-- ============================================================
-- DANH MỤC (CATEGORY)
-- ============================================================
INSERT INTO category (category_code, category_type, category_name)
VALUES
    ('CAT001', 'supply', 'Bút'),
    ('CAT002', 'supply', 'Giấy'),
    ('CAT003', 'supply', 'Mực in'),
    ('CAT004', 'supply', 'Dây mạng'),
    ('CAT005', 'asset',  'Laptop'),
    ('CAT006', 'asset',  'Máy chiếu'),
    ('CAT007', 'asset',  'Máy in'),
    ('CAT008', 'asset',  'Bàn phím'),
    ('CAT009', 'asset',  'Camera');

-- ============================================================
-- NHU CẦU DANH MỤC (CATEGORY_NEED)
-- ============================================================
INSERT INTO category_need (category_id,department_id, require_quantity, is_active)
VALUES
    (5, 1, 10, 1),   -- Laptop: cần 10 cái
    (6, 2, 5, 1),    -- Máy chiếu: cần 5 cái
    (7, 3, 8, 1),    -- Máy in: cần 8 cái
    (8, 1, 15, 1),   -- Bàn phím: cần 15 cái
    (9, 1, 6, 1);    -- Camera: cần 6 cái

-- ============================================================
-- TÀI SẢN CỐ ĐỊNH (ASSETS)
-- ============================================================
INSERT INTO assets (
    asset_code, name, serial_number, specification,
    purchase_date, purchase_cost, useful_life, status, condition, location,
    note, is_active, required_quantity_category,
    assigned_department_id, assigned_user_id, category_id
)
VALUES
    ('TS001', 'Dell Latitude 5440',
     'DL5440PTIT001', 'Core i7, 16GB RAM, 512GB SSD, Windows 11 Pro',
     '2025-01-15', 23500000.00, 60, 'available', 'new', 'Kho CNTT tầng 2',
     'Sẵn sàng cấp phát cho phòng CNTT', 1, 10, 2, 2),

    ('TS002', 'Epson EB-X06',
     'EPSONX06002', 'XGA 1024x768, 3600 lumens, HDMI/VGA',
     '2024-09-01', 12500000.00, 36, 'in_use', 'good', 'Giảng đường A2',
     'Đang sử dụng tại phòng Đào tạo', 1, 5, 4, 3),

    ('TS003', 'HP LaserJet Pro M404dn',
     'HPLJPRO003', 'In đen trắng tốc độ cao, kết nối LAN/USB',
     '2024-06-20', 6800000.00, 48, 'under_maintenance', 'fair', 'Phòng Hành chính tầng 1',
     'Đang chờ sửa chữa kẹt giấy', 1, 8, 1, 1),

    ('TS004', 'Logitech K380',
     'LTK380004', 'Bluetooth, pin AAA, tương thích Windows/Mac',
     '2024-11-05', 850000.00, 24, 'available', 'new', 'Kho CNTT',
     'Bàn phím không dây chưa qua sử dụng', 1, 15, NULL, NULL),

    ('TS005', 'Dell Latitude 5420',
     'DL5420PTIT005', 'Core i5, 8GB RAM, 256GB SSD, Windows 11 Pro',
     '2024-03-10', 18000000.00, 60, 'in_use', 'good', 'Phòng CNTT',
     'Đang được sử dụng bởi nhân viên IT', 1, 10, 2, 2),

    ('TS006', 'Sony PX310',
     'SNYPX310006', 'PTZ 30x zoom, hồng ngoại, cổng LAN',
     '2023-08-22', 45000000.00, 60, 'available', 'good', 'Kho Hành chính',
     'Camera quan sát phòng họp tầng 3', 1, 6, NULL, NULL);

-- ============================================================
-- TÀI SẢN SỐ LƯỢNG LỚN (QUANTITY_ASSETS)
-- ============================================================
INSERT INTO quantity_assets (
    code, name, quantity, available_quantity,
    serial_number, specification, purchase_date, useful_life, purchase_cost,
    status, condition, location, note,
    is_active, required_quantity_category, approval_status,
    assigned_department_id, assigned_user_id, category_id
)
VALUES
    ('TSL001', 'Ghế văn phòng', 50, 35,
     NULL, 'Ghế xoay có đệm lưng, bọc da PU',
     '2024-02-15', 60, 2500000.00,
     'in_use', 'good', 'Các phòng làm việc tầng 1-3',
     'Ghế xoay cho nhân viên, một số đã phân bổ', 1, 200, 'approved', 1, NULL, NULL),

    ('TSL002', 'Bàn làm việc', 30, 30,
     NULL, 'Bàn 1m2x0.6m, mặt gỗ MF, chân sắt sơn tĩnh điện',
     '2024-02-15', 120, 3500000.00,
     'available', 'new', 'Kho Hành chính tầng 1',
     'Bàn mới chưa phân bổ', 1, 100, 'approved', NULL, NULL, NULL),

    ('TSL003', 'Máy tính để bàn Dell OptiPlex', 20, 12,
     'OPT2025001', 'Core i3, 8GB RAM, 256GB SSD, Windows 11',
     '2025-01-20', 60, 12000000.00,
     'in_use', 'good', 'Phòng Lab 1 và Lab 2',
     'Phân bổ cho các phòng thí nghiệm', 1, 200, 'approved', 3, NULL, NULL),

    ('TSL004', 'Tủ hồ sơ', 15, 15,
     NULL, 'Tủ hồ sơ 4 ngăn, sơn tĩnh điện, khóa bảo mật',
     '2023-12-01', 180, 1800000.00,
     'available', 'good', 'Kho Hành chính',
     'Tủ tài liệu các phòng ban', 1, 50, 'approved', NULL, NULL, NULL);

-- ============================================================
-- VỊ TRÍ TÀI SẢN SỐ LƯỢNG (LOCATION_QUANTITY_ASSETS)
-- ============================================================
INSERT INTO location_quantity_assets (room_code, quantity, used, status_approval, quantity_assets_id)
VALUES
    ('KHO-A1', 20, 0,  'approval', 1),   -- Ghế văn phòng, kho A1: 20 cái
    ('TANG1',  18, 3,  'approval', 1),   -- Ghế văn phòng, tầng 1: 18 cái, dùng 3
    ('TANG2',  12, 12, 'approval', 1),   -- Ghế văn phòng, tầng 2: 12 cái, dùng hết
    ('KHO-A1', 15, 0,  'approval', 2),   -- Bàn làm việc, kho A1: 15 cái
    ('TANG1',  15, 0,  'approval', 2),   -- Bàn làm việc, tầng 1: 15 cái
    ('LAB1',    8, 0,  'approval', 3),   -- Dell OptiPlex, Lab 1: 8 cái
    ('LAB2',    4, 0,  'approval', 3);   -- Dell OptiPlex, Lab 2: 4 cái

-- ============================================================
-- VẬT TƯ (SUPPLIES)
-- ============================================================
INSERT INTO supplies (
    supply_code, name, category_id, unit, quantity_in_stock,
    minimum_stock_level, unit_price, location,
    description, note, managed_department_id, is_active
)
VALUES
    ('VT001', 'Giấy A4 Double A 80gsm',  2,      'ream',     25.00, 10.00, 78000.00,  'Kho văn phòng tầng 1', 'Giấy in A4 chất lượng cao, 500 tờ/ream',          NULL,                       1, 1),
    ('VT002', 'Mực in HP 05A',            3,    'cartridge',  2.00,  5.00, 1850000.00,'Kho CNTT',              'Mực in đen HP LaserJet P2035/P2055',              'Còn 2 hộp, cần nhập thêm',        2, 1),
    ('VT003', 'Dây mạng Cat6 305m/box',  4, 'box',      12.00,  4.00, 950000.00,'Kho CNTT tầng 2',      'Dây cáp mạng Cat6 UTP, vỏ PVC, 305m/box',         NULL,                       2, 1),
    ('VT004', 'Bút bi Thiên Long TL-027', NULL,       'cây',    200.00, 50.00,   5000.00,'Ngăn kéo tủ văn phòng', 'Bút bi mực xanh, trơn',                            NULL,                       1, 1),
    ('VT005', 'Băng keo trong 5cm',        NULL,  'cuộn',    30.00, 10.00,  15000.00,'Kho văn phòng',         'Băng keo trong 5cm x 65m',                          NULL,                       1, 1),
    ('VT006', 'Tẩy bút chì Deli 7061',    NULL,       'cây',     50.00, 15.00,   3000.00,'Ngăn kéo tủ văn phòng', 'Tẩy bút chì hình chữ nhật, mềm',                  NULL,                       1, 1);

-- ============================================================
-- CẤP PHÁT (ALLOCATIONS)
-- ============================================================
INSERT INTO allocations (
    allocation_code, allocation_type, status, asset_id, supply_id, quantity,
    allocated_department_id, allocated_user_id, allocated_by_user_id,
    allocated_at, expected_return_date, returned_at,
    purpose, note, is_active
)
VALUES
    ('CP001', 'asset',  'active',     2, NULL, 1,
     4, 3, 1,
     '2026-03-20 08:00:00', '2026-09-20', NULL,
     'Phục vụ giảng dạy tại giảng đường A2', 'Bàn giao kèm remote điều khiển và cáp nguồn', 1),

    ('CP002', 'supply', 'completed',  NULL, 1, 10.00,
     5, NULL, 1,
     '2026-03-15 09:30:00', NULL, '2026-03-20 14:00:00',
     'Cấp giấy in cho phòng Kế toán tháng 3/2026', NULL, 1),

    ('CP003', 'asset',  'active',    1, NULL, 1,
     2, NULL, 1,
     '2026-04-01 10:00:00', '2026-10-01', NULL,
     'Cấp laptop cho nhân viên phòng CNTT mới tuyển', 'Nhân viên mới, cần setup máy trước khi bàn giao', 1),

    ('CP004', 'supply', 'active',     NULL, 4, 20.00,
     1, NULL, 1,
     '2026-04-05 11:00:00', NULL, NULL,
     'Cấp bút bi cho phòng Hành chính tháng 4', NULL, 1),

    ('CP005', 'asset',  'returned',   5, NULL, 1,
     2, 2, 1,
     '2025-11-10 08:30:00', '2026-02-10', '2026-02-08 15:30:00',
     'Mượn laptop Dell 5420 để demo dự án', 'Đã hoàn trả đúng hạn, tình trạng tốt', 1);

-- ============================================================
-- BẢO TRÌ (MAINTENANCES)
-- ============================================================
INSERT INTO maintenances (
    maintenance_code, asset_id, maintenance_type, status, priority, title,
    description, scheduled_date, started_at, completed_at,
    next_maintenance_date, cost, vendor_name,
    resolution_note, reported_by_user_id, assigned_to_user_id, is_active
)
VALUES
    ('BT001', 3, 'corrective',  'in_progress', 'high',   'Sửa lỗi kẹt giấy máy in HP',
     'Máy in bị kẹt giấy liên tục khi in số lượng lớn, cần kiểm tra con lăn và drum', '2026-03-25', '2026-03-26 08:30:00', NULL,
     '2026-06-25', 350000.00, 'Công ty Dịch vụ Văn phòng ABC',
     NULL, 1, 2, 1),

    ('BT002', 2, 'preventive', 'completed',    'medium', 'Bảo trì định kỳ máy chiếu',
     'Vệ sinh bộ lọc bụi, kiểm tra bóng đèn và keo tản nhiệt', '2026-02-20', '2026-02-20 09:00:00', '2026-02-20 11:00:00',
     '2026-08-20', 200000.00, 'Trung tâm Bảo hành Epson VN',
     'Hoàn thành bảo trì định kỳ. Bóng đèn còn 85% tuổi thọ, bộ lọc đã vệ sinh sạch.', 2, 2, 1),

    ('BT003', 1, 'preventive', 'scheduled',    'low',    'Cài đặt bảo mật và cập nhật Windows',
     'Cài đặt bản vá bảo mật tháng, cập nhật driver, quét virus', '2026-04-15', NULL, NULL,
     '2026-05-15', NULL, NULL,
     NULL, 2, 2, 1);

-- ============================================================
-- PHIẾU BẢO HÀNH (WARRANTY_TICKETS)
-- ============================================================
INSERT INTO warranty_tickets (
    warranty_code, asset_id, maintenance_id, vendor_name, provider_contact,
    warranty_start_date, warranty_end_date, sent_date, expected_return_date,
    received_back_date, issue_description, resolution_note, note,
    status, created_by_user_id, handled_by_user_id
)
VALUES
    ('BH001', 1, 3, 'Dell Việt Nam', '1800-2020',
     '2025-01-15', '2028-01-14', '2026-04-10', '2026-04-20',
     NULL,
     'Laptop bị lỗi bàn phím: phím Space không phản hồi đều',
     NULL,
     'Đã gửi bảo hành tại trung tâm Dell', 'processing', 2, 2),

    ('BH002', 2, 2, 'Epson Việt Nam', '1900-1234',
     '2024-09-01', '2027-08-31', NULL, NULL,
     '2026-02-20',
     'Yêu cầu kiểm tra định kỳ bảo hành: vệ sinh và thay bộ lọc',
     'Đã hoàn thành bảo trì bảo hành. Máy chiếu hoạt động tốt sau kiểm tra.',
     NULL, 'completed', 2, 2);

-- ============================================================
-- PHIẾU XUẤT VẬT TƯ (SUPPLY_EXPORT_VOUCHERS)
-- ============================================================
INSERT INTO supply_export_vouchers (
    voucher_code, export_date, recipient_department_id,
    created_by_user_id, approved_by_user_id, status,
    reason, note, total_quantity, total_amount
)
VALUES
    ('XVT001', '2026-03-15 09:00:00', 5,
     1, 1, 'approved',
     'Cấp vật tư văn phòng quý I/2026 cho phòng Kế toán',
     'Theo kế hoạch cấp phát vật tư đầu năm', 10.00, 780000.00),

    ('XVT002', '2026-04-05 14:00:00', 1,
     1, 1, 'approved',
     'Xuất bổ sung vật tư cho phòng Hành chính',
     NULL, 20.00, 100000.00);

-- ============================================================
-- CHI TIẾT PHIẾU XUẤT VẬT TƯ (SUPPLY_EXPORT_ITEMS)
-- ============================================================
INSERT INTO supply_export_items (
    voucher_id, supply_id, supply_code_snapshot, supply_name_snapshot,
    unit_snapshot, quantity, unit_price, line_total, note
)
VALUES
    (1, 1, 'VT001', 'Giấy A4 Double A 80gsm', 'ream', 10.00, 78000.00, 780000.00, NULL),
    (2, 4, 'VT004', 'Bút bi Thiên Long TL-027', 'cây', 20.00, 5000.00, 100000.00, NULL);

-- ============================================================
-- PHIẾU MƯỢN TÀI SẢN (ASSET_LOAN_VOUCHERS)
-- ============================================================
INSERT INTO asset_loan_vouchers (
    voucher_code, borrower_department_id, borrower_user_id, approved_by_user_id,
    loan_date, expected_return_date, actual_return_date,
    status, purpose, note
)
VALUES
    ('PM001', 2, 2, 1,
     '2026-03-10', '2026-04-10', NULL,
     'approved',
     'Mượn máy chiếu phục vụ hội nghị tổ chức tại hội trường A',
     'Mang theo biên bản bàn giao và check tình trạng trước khi mượn'),

    ('PM002', 4, 3, 1,
     '2026-02-15', '2026-02-28', '2026-02-27',
     'returned',
     'Mượn laptop Dell 5420 để demo phần mềm trong buổi giảng',
     'Hoàn trả đúng hạn, máy hoạt động bình thường'),

    ('PM003', 3, NULL, NULL,
     '2026-04-08', '2026-04-15', NULL,
     'draft',
     'Mượn camera Sony PX310 để quay buổi thực hành sinh viên',
     'Đang chờ phê duyệt');

-- ============================================================
-- CHI TIẾT PHIẾU MƯỢN TÀI SẢN (ASSET_LOAN_ITEMS)
-- ============================================================
INSERT INTO asset_loan_items (
    voucher_id, asset_id, asset_code_snapshot, asset_name_snapshot,
    condition_before_snapshot, condition_after_return, note
)
VALUES
    (1, 2, 'TS002', 'Epson EB-X06',
     'good', NULL,
     'Máy chiếu mới vệ sinh, cáp HDMI đi kèm'),

    (2, 5, 'TS005', 'Dell Latitude 5420',
     'good', 'good',
     'Đã kiểm tra sau khi trả: máy hoạt động tốt, không có hư hỏng'),

    (3, 6, 'TS006', 'Sony PX310',
     'good', NULL,
     NULL);
