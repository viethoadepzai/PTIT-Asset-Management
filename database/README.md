# PTIT database bundle

Bo file nay duoc viet de khop voi backend FastAPI hien tai cua do an quan ly tai san vat tu.

## Tep tin

- `schema.sql`: dinh nghia bang, rang buoc, chi muc
- `trigger_procedure.sql`: trigger cap nhat `updated_at`, trigger ton kho, va cac view bao cao
- `sample_data.sql`: du lieu mau de demo
- `full_setup.sql`: file chay nhanh cho SQLite shell

## Cach dung

### Cach 1: Tao database bang SQLite shell

```bash
sqlite3 ptit_assets.db < full_setup.sql
```

### Cach 2: Chay tung file

```bash
sqlite3 ptit_assets.db < schema.sql
sqlite3 ptit_assets.db < trigger_procedure.sql
sqlite3 ptit_assets.db < sample_data.sql
```

## Tai khoan demo

- `admin / Admin@123`
- `manager / Manager@123`

## View phuc vu dashboard

- `vw_asset_status_summary`
- `vw_supply_low_stock`
- `vw_allocation_status_summary`
- `vw_maintenance_status_summary`
- `vw_recent_activities`

## Ghi chu

- Bo SQL nay uu tien tuong thich voi SQLite vi backend dang mac dinh dung `sqlite:///./ptit_assets.db`.
- Neu ban muon, co the chuyen sang MySQL/PostgreSQL sau, nhung version hien tai hop nhat de demo va bao ve do an.
