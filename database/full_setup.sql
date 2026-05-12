-- SQLite shell entrypoint
-- Usage: sqlite3 ptit_assets.db < full_setup.sql

.read schema.sql
.read trigger_procedure.sql
.read sample_data.sql
