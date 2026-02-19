import sqlite3

# Create or connect to a database file
#connection = sqlite3.connect("databaseWT.db")

# Create a cursor to run SQL commands
#cursor = connection.cursor()

def create_tables():

    connection = sqlite3.connect("databaseWT.db")
    cursor = connection.cursor()

    #users table 
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fist_name TEXT NOT NULL,
        last_name TEXT NOT NULL,          
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone_number TEXT,
        image_url TEXT -- Image, might change 
    )
    """)
    print("Users Table create")
    #Posts table 
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT,
        image_url TEXT, -- Image, might change 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)
    print("Posts Table create")

    #Locations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        latitude REAL,
        longitude REAL,
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        FOREIGN KEY (post_id) REFERENCES posts(id)
    )
    """)
    print("Locations Table create")
    
    #Comments Table 
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)
    print("Comments Table create")

    #Likes table 
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE (post_id, user_id)
    )
    """)
    print("Likes Table create")
    
    #Trips table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        location_name TEXT NOT NULL,
        planned_time TEXT,
        duration_hours REAL,
        note TEXT,
        location_place_id TEXT,
        order_index INTEGER NOT NULL,
        latitude REAL,
        longitude REAL,
        status TEXT DEFAULT 'Pending',
        actual_arrival_time TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)
    print("Trips Table create")

####

try:
    connection = sqlite3.connect("databaseWT.db")
    print("Connected to database")
    create_tables()
except sqlite3.Error as error:
    print("Failed to connect:", error)

