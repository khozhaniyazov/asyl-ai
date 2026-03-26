import sqlite3
import os

db_path = 'c:/asyl-ai/backend/asyl_ai.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

columns = [
    ('verification_status', 'VARCHAR'),
    ('verification_submitted_at', 'DATETIME'),
    ('verification_notes', 'TEXT'),
    ('verified_at', 'DATETIME'),
    ('verified_by_id', 'INTEGER'),
    ('rejection_reason', 'TEXT')
]

for col_name, col_type in columns:
    try:
        cursor.execute(f"ALTER TABLE therapist_profiles ADD COLUMN {col_name} {col_type}")
        print(f"Added column: {col_name}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"Column {col_name} already exists, skipping.")
        else:
            print(f"Error adding {col_name}: {e}")

conn.commit()
conn.close()
print("Database schema update complete.")
