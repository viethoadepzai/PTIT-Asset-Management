"""Migration script: Add workflow columns to category_need table."""
import sqlite3
import sys

DB_PATH = r"C:\Users\Admin\Downloads\BTL-python-final-main\BTL-python-final-main\ptit_assets.db"


def main():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Check existing columns
    cols = [row[1] for row in c.execute("PRAGMA table_info(category_need)").fetchall()]
    print("Existing columns:", cols)

    new_cols = [
        ("status", "VARCHAR(20) DEFAULT 'approved' NOT NULL"),
        ("created_by_user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL"),
        ("submitted_at", "DATETIME"),
        ("approved_at", "DATETIME"),
        ("approved_by_user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL"),
        ("rejected_reason", "TEXT"),
    ]

    for col_name, col_def in new_cols:
        if col_name not in cols:
            sql = f"ALTER TABLE category_need ADD COLUMN {col_name} {col_def}"
            print(f"Running: {sql}")
            c.execute(sql)
        else:
            print(f"Column {col_name} already exists, skipping.")

    conn.commit()

    # Verify
    cols_after = [row[1] for row in c.execute("PRAGMA table_info(category_need)").fetchall()]
    print("Columns after migration:", cols_after)

    # Check existing data
    count = c.execute("SELECT COUNT(*) FROM category_need").fetchone()[0]
    print(f"Existing records: {count}")

    conn.close()
    print("Migration complete!")


if __name__ == "__main__":
    main()
