import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'backend', 'database.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("Updating database schema...")

# Crear tabla customers
c.execute('''
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dni TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIMEDEFAULT CURRENT_TIMESTAMP
)
''')

# Añadir customer_id a transactions si no existe
c.execute("PRAGMA table_info(transactions)")
columns = [col[1] for col in c.fetchall()]
if 'customer_id' not in columns:
    print("Adding customer_id to transactions table...")
    c.execute('ALTER TABLE transactions ADD COLUMN customer_id INTEGER REFERENCES customers(id)')

conn.commit()
conn.close()
print("Database schema updated successfully.")
