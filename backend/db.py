import mysql.connector

def get_connection():
    connection = mysql.connector.connect(
        host     = "localhost",
        port     = 3306,
        user     = "root",
        password = "Tejasvini@06",      # your MySQL password
        database = "alignai_db"
    )
    return connection