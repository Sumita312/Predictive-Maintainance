import mysql.connector

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="nikita12345",
    database="predictive_maintenance"
)

cursor = db.cursor()

print("Database Connected Successfully")