from app.core.security import verify_password, get_password_hash
import sqlite3
import os

db_path = 'sandar.db'
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute('SELECT hashed_password FROM therapists WHERE email = ?', ('demo@sandar.kz',))
row = cursor.fetchone()

if row:
    hashed = row[0]
    print(f"Hash in DB: {hashed}")
    result = verify_password('Demo1234', hashed)
    print(f"Verification for 'Demo1234': {result}")
    
    # Try re-hashing
    new_hash = get_password_hash('Demo1234')
    print(f"New hash of 'Demo1234': {new_hash}")
    print(f"Verify new hash with 'Demo1234': {verify_password('Demo1234', new_hash)}")
else:
    print("User demo@sandar.kz not found")

conn.close()
