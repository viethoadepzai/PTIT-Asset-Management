import sqlite3
import os

DB_PATH = "ptit_assets.db"

def run_migration():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found!")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Thêm qr_code vào assets
    try:
        cursor.execute("ALTER TABLE assets ADD COLUMN qr_code VARCHAR(255) UNIQUE;")
        print("Đã thêm cột qr_code vào bảng assets.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Cột qr_code đã tồn tại trong bảng assets.")
        else:
            print(f"Lỗi khi thêm qr_code vào assets: {e}")

    # Không thể drop qr_value ở SQLite một cách an toàn mà ko rebuild table
    # Nên ở đây chúng ta chỉ bỏ qua cột này trong SQLAlchemy, nhưng vì SQLite 3.35+ hỗ trợ DROP COLUMN, ta thử:
    try:
        cursor.execute("ALTER TABLE quantity_assets DROP COLUMN qr_value;")
        print("Đã xóa cột qr_value khỏi bảng quantity_assets.")
    except sqlite3.OperationalError as e:
        print(f"Lỗi khi xóa qr_value khỏi quantity_assets: {e}. (Có thể SQLite version cũ, bỏ qua vì SQLAlchemy sẽ tự ignore)")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    run_migration()
