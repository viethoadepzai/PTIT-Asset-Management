import sqlite3

conn = sqlite3.connect("ptit_assets.db")

with open("database/sample_data.sql", "r", encoding="utf-8") as f:
    conn.executescript(f.read())

conn.commit()
conn.close()

print("Done!")