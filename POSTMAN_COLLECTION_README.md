# PTIT Asset Management API - Postman Collection

## Cách import vào Postman

1. Mở Postman
2. Click **Import** > chọn tab **File**
3. Import lần lượt 2 file:
   - `PTIT_Asset_Management_API.postman_collection.json`
   - `PTIT_Asset_Management.postman_environment.json`
4. Chọn environment **PTIT Asset Management - Environment** từ dropdown góc phải trên

## Cách sử dụng

### 1. Khởi động Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Lấy Token

1. Chọn request **Auth > Login (JSON)**
2. Click **Send**
3. Token sẽ tự động được lưu vào biến `{{token}}` (nhờ script trong event)
4. Các request khác sẽ tự động sử dụng token này

### 3. Tài khoản mẫu

| Username  | Password            | Role    |
|-----------|---------------------|---------|
| admin     | matkhauratmanh      | admin   |
| manager   | matkhauratmanh      | manager |
| staff01   | matkhauratmanh      | staff   |

> Public registration đã bị vô hiệu hóa. Đăng nhập bằng tài khoản mẫu trên.

### 4. Thứ tự test khuyến nghị

Để test API flow hoàn chỉnh, nên theo thứ tự sau:

#### Bước 1: Authentication
- **Login (JSON)** - Lấy token

#### Bước 2: Dữ liệu nền tảng (Admin/Manager)
- **Departments > List** - Xem các phòng ban có sẵn
- **Categories > List** - Xem danh mục có sẵn
- **Users > List** - Xem người dùng có sẵn

#### Bước 3: CRUD Assets
- **Assets > List** - Xem tài sản
- **Assets > Create** - Tạo tài sản mới
- **Assets > Update** - Cập nhật
- **Assets > Update Status** - Đổi trạng thái
- **Assets > Deactivate/Activate** - Bật/tắt tài sản

#### Bước 4: CRUD Supplies
- **Supplies > List** - Xem vật tư
- **Supplies > Create** - Tạo vật tư mới
- **Supplies > Update Stock** - Cập nhật tồn kho
- **Supplies > Deactivate/Activate** - Bật/tắt vật tư

#### Bước 5: Asset Quantities
- **Asset Quantities > List** - Xem tài sản số lượng lớn
- **Asset Quantities > Create** - Tạo mới
- **Asset Quantities > Add Location** - Thêm vị trí

#### Bước 6: Allocations
- **Allocations > Create Asset Allocation** - Tạo cấp phát tài sản
- **Allocations > Create Supply Allocation** - Tạo cấp phát vật tư
- **Allocations > Update Status** - Cập nhật trạng thái

#### Bước 7: Asset Loans
- **Asset Loans > Create** - Tạo phiếu mượn
- **Asset Loans > Approve** - Phê duyệt (Manager/Admin)
- **Asset Loans > Receive** - Nhận tài sản
- **Asset Loans > Return** - Hoàn trả
- **Asset Loans > Export PDF** - Xuất PDF

#### Bước 8: Supply Exports
- **Supply Exports > Create** - Tạo phiếu xuất vật tư
- **Supply Exports > Approve** - Phê duyệt
- **Supply Exports > Export PDF** - Xuất PDF

#### Bước 9: Maintenances
- **Maintenances > Create** - Tạo bảo trì
- **Maintenances > Update Status** - Cập nhật trạng thái

#### Bước 10: Warranties
- **Warranties > Create** - Tạo phiếu bảo hành
- **Warranties > Send** - Gửi bảo hành
- **Warranties > Complete** - Hoàn thành
- **Warranties > Export PDF** - Xuất PDF

#### Bước 11: Reports
- **Reports > Dashboard Summary** - Tổng quan dashboard
- **Reports > Asset Status Summary** - Thống kê tài sản
- **Reports > Low Stock Supplies** - Vật tư sắp hết
- **Reports > Recent Activity** - Hoạt động gần đây
- **Reports > Pending Approvals** - Chờ phê duyệt

### 5. Lưu ý quan trọng

- Hầu hết các endpoint yêu cầu JWT Bearer token
- Token được lưu tự động sau khi login
- Các request tạo mới sử dụng ID từ dữ liệu mẫu - có thể cần điều chỉnh theo data thực tế
- Một số endpoint chỉ dành cho Admin (`require_roles(UserRole.ADMIN)`)
- Một số endpoint dành cho Admin/Manager (`require_roles(UserRole.ADMIN, UserRole.MANAGER)`)
