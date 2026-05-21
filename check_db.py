import sqlite3
conn = sqlite3.connect(r'C:\Users\Useradmin\Documents\Saas\database.db')
c = conn.cursor()
c.execute("PRAGMA table_info(products)")
cols = [row[1] for row in c.fetchall()]
print('Products columns:', cols)
c.execute("PRAGMA table_info(customers)")
cols = [row[1] for row in c.fetchall()]
print('Customers columns:', cols)
c.execute("PRAGMA table_info(transactions)")
cols = [row[1] for row in c.fetchall()]
print('Transactions columns:', cols)
c.execute("PRAGMA table_info(transaction_details)")
cols = [row[1] for row in c.fetchall()]
print('TransactionDetails columns:', cols)
conn.close()
