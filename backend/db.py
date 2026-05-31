import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="nikita12345",
        database="predictive_maintenance",
        autocommit=True
    )

db = get_connection()
cursor = db.cursor()

def reconnect():
    global db, cursor
    try:
        db = get_connection()
        cursor = db.cursor()
    except Exception as e:
        print(f"Reconnect failed: {e}")

print("Database Connected Successfully")