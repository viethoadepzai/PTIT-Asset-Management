Hướng dẫn demo nhanh ở dưới cùng


# PTIT Asset Management

Hệ thống quản lý tài sản và vật tư được xây dựng với **FastAPI + SQLAlchemy + SQLite** ở backend và **React + Chakra UI** ở frontend. Dự án phục vụ quản lý tài sản, vật tư, cấp phát, bảo trì, cho mượn tài sản, xuất vật tư, bảo hành và theo dõi báo cáo tổng quan.

---

## Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
- [3. Kiến trúc tổng quan](#3-kiến-trúc-tổng-quan)
- [4. Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
- [5. Chức năng chính](#5-chức-năng-chính)
- [6. Cách chạy dự án](#6-cách-chạy-dự-án)
- [7. Cấu hình môi trường](#7-cấu-hình-môi-trường)
- [8. Tài khoản khởi tạo và dữ liệu mẫu](#8-tài-khoản-khởi-tạo-và-dữ-liệu-mẫu)
- [9. API và tài liệu kiểm thử](#9-api-và-tài-liệu-kiểm-thử)
- [10. Hướng phát triển tiếp theo](#10-hướng-phát-triển-tiếp-theo)
- [11. Tác giả](#11-tác-giả)
- [12. Hướng dẫn chạy demo nhanh](## Ghi chú sử dụng nhanh)

---

## 1. Giới thiệu

**PTIT Asset Management** là hệ thống quản lý tài sản/vật tư nội bộ, hỗ trợ:

- Quản lý tài sản và vật tư.
- Quản lý phòng ban và người dùng.
- Ghi nhận cấp phát tài sản/vật tư.
- Theo dõi bảo trì, bảo hành.
- Quản lý phiếu cho mượn tài sản.
- Quản lý phiếu xuất vật tư.
- Hiển thị báo cáo tổng quan trên dashboard.
- Phân quyền người dùng theo vai trò.

Dự án phù hợp để demo đồ án môn học, thực hành phát triển ứng dụng web fullstack, hoặc làm nền tảng mở rộng cho hệ thống quản trị nội bộ.

---

## 2. Công nghệ sử dụng

### Backend

- **Python**
- **FastAPI**
- **SQLAlchemy**
- **Pydantic Settings**
- **JWT Authentication**
- **SQLite**
- **ReportLab**
- **Uvicorn**

### Frontend

- **React 18**
- **Chakra UI**
- **React Router DOM**
- **Axios / Fetch wrapper**
- **ApexCharts**
- **Framer Motion**

---

## 3. Kiến trúc tổng quan

Dự án được chia thành 2 phần chính:

### Backend – `BTLPython/backend`

Backend xây dựng bằng **FastAPI**, tổ chức theo hướng tách lớp:

- `routers`: định nghĩa API endpoint.
- `services`: xử lý nghiệp vụ.
- `models`: mô hình dữ liệu ORM.
- `schemas`: schema request/response.
- `core`: cấu hình, database, security.
- `dependencies`: xác thực và phân quyền.

Backend dùng **SQLite** mặc định thông qua file `BTLPython/ptit_assets.db`.

### Frontend – `horizon-ui-chakra`

Frontend xây dựng trên template **Horizon UI Chakra**, được tùy biến thành giao diện quản trị tài sản.

- `src/api`: lớp gọi API cho từng module.
- `src/views`: màn hình nghiệp vụ.
- `src/layouts`: layout đăng nhập và admin.
- `src/routes.js`: cấu hình route theo vai trò.
- `src/config/api.js`: cấu hình URL backend.

Frontend giao tiếp với backend qua base URL mặc định:

- `http://127.0.0.1:8000/api/v1`

---

## 4. Cấu trúc thư mục

```bash
PTIT-Asset-Management/
├── BTLPython/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   ├── dependencies/
│   │   │   ├── models/
│   │   │   ├── routers/
│   │   │   ├── schemas/
│   │   │   ├── seed/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── main.py
│   │   ├── media/
│   │   │   └── avatars/
│   │   ├── tests/
│   │   ├── .env
│   │   ├── requirements.txt
│   │   └── run.py
│   ├── database/
│   │   ├── README.md
│   │   ├── schema.sql
│   │   ├── trigger_procedure.sql
│   │   ├── sample_data.sql
│   │   └── full_setup.sql
│   └── ptit_assets.db
│
├── horizon-ui-chakra/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── config/
│   │   ├── contexts/
│   │   ├── layouts/
│   │   ├── theme/
│   │   ├── variables/
│   │   ├── views/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── routes.js
│   ├── .env
│   ├── package.json
│   └── README.md
│
└── README.md
```

---

## 5. Chức năng chính

### 5.1. Xác thực và người dùng

- Đăng nhập bằng JWT.
- Xem thông tin người dùng hiện tại.
- Đổi mật khẩu.
- Upload avatar.
- Phân quyền theo vai trò:
  - `admin`
  - `manager`
  - `staff`

### 5.2. Quản lý danh mục nền tảng

- Quản lý phòng ban.
- Quản lý người dùng.

### 5.3. Quản lý tài sản và vật tư

- Thêm, sửa, xem chi tiết tài sản.
- Cập nhật trạng thái tài sản.
- Ngừng sử dụng tài sản.
- Quản lý vật tư.
- Tìm kiếm và lọc theo nhiều tiêu chí.

### 5.4. Nghiệp vụ vận hành

- Cấp phát tài sản/vật tư.
- Bảo trì.
- Cho mượn tài sản.
- Xuất vật tư.
- Bảo hành.

### 5.5. Dashboard và báo cáo

- Tổng quan dashboard.
- Thống kê trạng thái tài sản.
- Thống kê cấp phát.
- Thống kê bảo trì.
- Cảnh báo vật tư tồn kho thấp.
- Hoạt động gần đây.

---

## 6. Cách chạy dự án

## 6.1. Yêu cầu môi trường

Khuyến nghị chuẩn bị:

- **Python 3.10+**
- **Node.js 18+**
- **npm**

> Repo hiện đã có sẵn file SQLite `BTLPython/ptit_assets.db`, nên bạn có thể chạy nhanh mà không cần dựng database từ đầu.

---

## 6.2. Clone repository

```bash
git clone https://github.com/viethoadepzai/PTIT-Asset-Management.git
cd PTIT-Asset-Management
```

---

## 6.3. Chạy backend

Di chuyển vào thư mục backend:

```bash
cd BTLPython/backend
```

Tạo virtual environment:

### Windows

```bash
py -m venv .venv
.\.venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Cài dependencies:

```bash
pip install -r requirements.txt
```

Chạy server:

```bash
uvicorn app.main:app --reload 
```

Backend mặc định chạy tại:

```bash
http://127.0.0.1:8000
```

Kiểm tra nhanh:

- Trang gốc: `http://127.0.0.1:8000/`
- Health check: `http://127.0.0.1:8000/health`
- Swagger docs: `http://127.0.0.1:8000/docs`
- API v1 health: `http://127.0.0.1:8000/api/v1/health`

---

## 6.4. Chạy frontend

Mở terminal mới, di chuyển vào thư mục frontend:

```bash
cd horizon-ui-chakra
```

Cài dependencies:

```bash
npm install
```

Chạy ứng dụng React:

```bash
npm start
```

Frontend mặc định chạy tại:

```bash
http://localhost:3000
```

---

## 6.5. Thứ tự chạy chuẩn

1. Chạy **backend** trước.
2. Sau khi backend hoạt động ổn định, chạy **frontend**.
3. Mở trình duyệt tại `http://localhost:3000`.
4. Đăng nhập để sử dụng hệ thống.

---

## 7. Cấu hình môi trường

## 7.1. Backend `.env`

File môi trường backend nằm tại:

```bash
BTLPython/backend/.env
```

Các biến quan trọng:

```env
PROJECT_NAME=PTIT Asset Management API
API_V1_STR=/api/v1
DATABASE_URL=sqlite:///../ptit_assets.db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=5
DISABLE_PUBLIC_REGISTER=true
BOOTSTRAP_ADMIN_ENABLED=true
BOOTSTRAP_ADMIN_USERNAME=admin
BOOTSTRAP_ADMIN_EMAIL=admin@ptit.edu.vn
BOOTSTRAP_ADMIN_FULL_NAME=System Administrator
BOOTSTRAP_ADMIN_PASSWORD=matkhauratmanh
```

### Ý nghĩa nhanh

- `DATABASE_URL`: trỏ tới database SQLite dùng chung cho backend.
- `SECRET_KEY`: khóa ký JWT.
- `DISABLE_PUBLIC_REGISTER=true`: khóa đăng ký công khai.
- `BOOTSTRAP_ADMIN_ENABLED=true`: cho phép tạo tài khoản admin mặc định khi khởi động.

> Lưu ý: nên thay `SECRET_KEY` và `BOOTSTRAP_ADMIN_PASSWORD` trước khi demo hoặc triển khai chính thức.

---

## 7.2. Frontend `.env`

File môi trường frontend nằm tại:

```bash
horizon-ui-chakra/.env
```

Giá trị mặc định:

```env
GENERATE_SOURCEMAP=false
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api/v1
REACT_APP_BACKEND_BASE_URL=http://127.0.0.1:8000
```

Nếu backend chạy ở host/port khác, hãy sửa lại các biến trên trước khi chạy frontend.

---

## 8. Tài khoản khởi tạo và dữ liệu mẫu

### 8.1. Tài khoản bootstrap admin

Khi backend khởi động lần đầu, hệ thống có thể tự tạo tài khoản admin theo cấu hình `.env`.

Mặc định đang để:

- **Username:** `admin`
- **Email:** `admin@ptit.edu.vn`
- **Password:** `matkhauratmanh`

Sau khi đăng nhập lần đầu, nên đổi mật khẩu ngay.

### 8.2. Database SQL mẫu

Ngoài file `ptit_assets.db` có sẵn, repo còn có bộ SQL trong `BTLPython/database/`:

- `schema.sql`: tạo bảng và ràng buộc.
- `trigger_procedure.sql`: trigger và view báo cáo.
- `sample_data.sql`: dữ liệu demo.
- `full_setup.sql`: file dựng nhanh toàn bộ database.

Nếu muốn tự tạo database bằng SQLite shell:

```bash
cd BTLPython/database
sqlite3 ptit_assets.db < full_setup.sql
```

Hoặc chạy từng bước:

```bash
sqlite3 ptit_assets.db < schema.sql
sqlite3 ptit_assets.db < trigger_procedure.sql
sqlite3 ptit_assets.db < sample_data.sql
```

Theo ghi chú trong thư mục database, bộ SQL còn có tài khoản demo:

- `admin / Admin@123`
- `manager / Manager@123`

> Nếu bạn đang dùng file `BTLPython/ptit_assets.db` sẵn trong repo, dữ liệu thực tế có thể khác đôi chút tùy trạng thái file hiện tại.

---

## 9. API và tài liệu kiểm thử

### 9.1. Các nhóm API chính

Backend hiện có các module API:

- `auth`
- `departments`
- `users`
- `assets`
- `supplies`
- `allocations`
- `maintenances`
- `reports`
- `asset_loans`
- `supply_exports`
- `warranties`

### 9.2. Tài liệu Swagger

Sau khi chạy backend, có thể test API trực tiếp tại:

```bash
http://127.0.0.1:8000/docs
```

Swagger cho phép:

- Đăng nhập lấy token.
- Test request CRUD.
- Kiểm tra schema request/response.
- Kiểm tra các endpoint báo cáo.

---

## 10. Hướng phát triển tiếp theo

Một số hướng mở rộng phù hợp cho dự án:

- Thêm phân trang cho các bảng dữ liệu lớn.
- Thêm soft delete / archive cho phiếu cũ.
- Xuất Excel/PDF cho báo cáo nghiệp vụ.
- Thêm bộ lọc nâng cao theo thời gian.
- Tách cấu hình môi trường cho dev / production.
- Bổ sung test backend và test frontend.
- Docker hóa toàn bộ hệ thống.
- Triển khai lên VPS hoặc cloud.

---

## 11. Tác giả

- **Chủ repo:** ``
- Dự án phục vụ học tập / đồ án quản lý tài sản PTIT.

---

## Ghi chú sử dụng nhanh

Nếu bạn chỉ muốn chạy demo nhanh nhất, hãy dùng đúng 6 lệnh sau:

### Terminal 1 – Backend

```bash
cd PTIT-Asset-Management/BTLPython/backend
py -m venv .venv
.\.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload 
```

### Terminal 2 – Frontend

```bash
cd PTIT-Asset-Management/horizon-ui-chakra
npm install
npm start
```

Tài khoản mặc định: admin
Mật khẩu mặc định: matkhauratmanh
Sau khi đổi mật khẩu tài khoản mặc định 
Mở terminal 3

### Terminal 3 – Sample data

```bash
cd PTIT-Asset-Management
python3 run_sql.py
```

Sau đó truy cập:

```bash
http://localhost:3000
```

