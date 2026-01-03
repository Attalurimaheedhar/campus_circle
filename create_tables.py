# create_tables.py
import os
import psycopg2
from psycopg2.extras import RealDictCursor

DB_URL = os.environ.get("DATABASE_URL")

def get_connection():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)

conn = get_connection()
cur = conn.cursor()

# ---------------- USERS ----------------
cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

# ---------------- OTPS ----------------
cur.execute("""
CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expiry TIMESTAMP NOT NULL
);
""")

# ---------------- PRODUCTS ----------------
cur.execute("""
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    seller_id INT REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price NUMERIC(10,2),
    description TEXT,
    image TEXT,
    is_sold BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

# ---------------- CART ----------------
cur.execute("""
CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1
);
""")

# ---------------- WISHLIST ----------------
cur.execute("""
CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);
""")

# ---------------- ORDERS ----------------
cur.execute("""
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    total NUMERIC(10,2),
    status VARCHAR(20) DEFAULT 'Placed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

# ---------------- ORDER ITEMS ----------------
cur.execute("""
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    quantity INT DEFAULT 1,
    price NUMERIC(10,2)
);
""")

# ---------------- INITIAL DATA ----------------
# Example: create an admin user if not exists
cur.execute("""
INSERT INTO users (name, phone, email, password)
VALUES ('Admin', '1234567890', 'admin@eco.com', 'adminhashedpassword')
ON CONFLICT (email) DO NOTHING;
""")

# Commit and close
conn.commit()
cur.close()
conn.close()
print("All tables created and initial data inserted successfully!")
