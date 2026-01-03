-- Drop tables if they exist (order matters due to foreign keys)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS otps CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ---------------- USERS ----------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------- OTPS ----------------
CREATE TABLE otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expiry TIMESTAMP NOT NULL
);

-- ---------------- PRODUCTS ----------------
CREATE TABLE products (
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

-- ---------------- CART ----------------
CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1
);

-- ---------------- WISHLIST ----------------
CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- ---------------- ORDERS ----------------
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    total NUMERIC(10,2),
    status VARCHAR(20) DEFAULT 'Placed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------- ORDER ITEMS ----------------
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    quantity INT DEFAULT 1,
    price NUMERIC(10,2)
);

-- ---------------- INITIAL DATA ----------------
-- Example: create an admin user if not exists
INSERT INTO users (name, phone, email, password)
VALUES ('Admin', '1234567890', 'admin@eco.com', 'adminhashedpassword')
ON CONFLICT (email) DO NOTHING;
