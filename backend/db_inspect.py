from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

print("=== CASES COLUMNS ===")
cols = db.execute(text(
    "SELECT column_name, data_type FROM information_schema.columns "
    "WHERE table_name='cases' ORDER BY ordinal_position"
)).fetchall()
for c in cols:
    print(c)

print("\n=== CASES DATA ===")
rows = db.execute(text("SELECT * FROM cases ORDER BY id LIMIT 5")).fetchall()
print("col names:", db.execute(text("SELECT * FROM cases LIMIT 0")).keys())
for r in rows:
    print(r)

print("\n=== EVIDENCE COLUMNS ===")
cols = db.execute(text(
    "SELECT column_name, data_type FROM information_schema.columns "
    "WHERE table_name='evidence' ORDER BY ordinal_position"
)).fetchall()
for c in cols:
    print(c)

print("\n=== EVIDENCE DATA ===")
rows = db.execute(text("SELECT * FROM evidence ORDER BY id LIMIT 5")).fetchall()
print("col names:", db.execute(text("SELECT * FROM evidence LIMIT 0")).keys())
for r in rows:
    print(r)

db.close()
