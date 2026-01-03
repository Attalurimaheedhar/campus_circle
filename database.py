import os
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from random import randint

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Mahee2006.",
    "database": "eco_mart"
}

DATABASE_URL = os.environ.get("DATABASE_URL")

def get_connection():
    return psycopg2.connect(DATABASE_URL)

# ---------------- USER ----------------
def get_user_by_email(email):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user

def get_user_by_id(user_id):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM users WHERE id=%s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user

def create_user(name, phone, email, password):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (name, phone, email, password) VALUES (%s,%s,%s,%s)",
        (name, phone, email, password)
    )
    conn.commit()
    cursor.close()
    conn.close()

def update_phone(user_id, phone):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET phone=%s WHERE id=%s", (phone, user_id))
    conn.commit()
    cursor.close()
    conn.close()

def update_password(user_id, password_hash):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password=%s WHERE id=%s", (password_hash, user_id))
    conn.commit()
    cursor.close()
    conn.close()

# ---------------- OTP ----------------
def generate_otp():
    return str(randint(100000, 999999))

def otp_expiry(minutes=5):
    return datetime.now() + timedelta(minutes=minutes)

def store_otp(email, otp, expiry):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM otps WHERE email=%s", (email,))
    cursor.execute(
        "INSERT INTO otps (email, otp, expiry) VALUES (%s,%s,%s)",
        (email, otp, expiry)
    )
    conn.commit()
    cursor.close()
    conn.close()

def verify_otp(email, otp):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT * FROM otps WHERE email=%s AND otp=%s AND expiry > NOW() "
        "ORDER BY id DESC LIMIT 1",
        (email, otp)
    )
    result = cursor.fetchone()
    if result:
        cursor.execute("DELETE FROM otps WHERE email=%s", (email,))
        conn.commit()
    cursor.close()
    conn.close()
    return result is not None

# ---------------- PRODUCTS ----------------
def add_product(seller_id, name, category, price, description, image_string):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO products (seller_id, name, category, price, description, image, created_at) "
        "VALUES (%s,%s,%s,%s,%s,%s,NOW())",
        (seller_id, name, category, price, description, image_string)
    )
    conn.commit()
    cursor.close()
    conn.close()

def get_all_products():
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT p.*, u.name AS seller_name FROM products p "
        "JOIN users u ON p.seller_id=u.id "
        "WHERE p.is_sold = FALSE "
        "ORDER BY p.created_at DESC"
    )
    products = cursor.fetchall() or []
    cursor.close()
    conn.close()
    return products

# ---------------- CART ----------------
def add_to_cart(user_id, product_id, quantity=1):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT quantity FROM cart WHERE user_id=%s AND product_id=%s",
        (user_id, product_id)
    )
    row = cursor.fetchone()

    if row:
        cursor.execute(
            "UPDATE cart SET quantity = quantity + %s "
            "WHERE user_id=%s AND product_id=%s",
            (quantity, user_id, product_id)
        )
    else:
        cursor.execute(
            "INSERT INTO cart (user_id, product_id, quantity) VALUES (%s,%s,%s)",
            (user_id, product_id, quantity)
        )

    cursor.execute(
        "DELETE FROM wishlist WHERE user_id=%s AND product_id=%s",
        (user_id, product_id)
    )

    conn.commit()
    cursor.close()
    conn.close()

def get_cart(user_id):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT p.id AS product_id, p.name, p.price, c.quantity, p.image "
        "FROM cart c JOIN products p ON c.product_id=p.id "
        "WHERE c.user_id=%s",
        (user_id,)
    )
    items = cursor.fetchall() or []
    cursor.close()
    conn.close()
    return items

def remove_from_cart(user_id, product_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM cart WHERE user_id=%s AND product_id=%s",
        (user_id, product_id)
    )
    conn.commit()
    cursor.close()
    conn.close()

def get_cart_product_ids(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT product_id FROM cart WHERE user_id=%s", (user_id,))
    rows = cursor.fetchall() or []
    cursor.close()
    conn.close()
    return [r[0] for r in rows]

# ---------------- WISHLIST ----------------
def add_to_wishlist(user_id, product_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO wishlist (user_id, product_id, created_at) "
        "VALUES (%s,%s,NOW()) ON CONFLICT DO NOTHING",
        (user_id, product_id)
    )
    conn.commit()
    cursor.close()
    conn.close()

def remove_from_wishlist(user_id, product_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM wishlist WHERE user_id=%s AND product_id=%s",
        (user_id, product_id)
    )
    conn.commit()
    cursor.close()
    conn.close()

def get_wishlist(user_id):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT p.* FROM wishlist w JOIN products p ON w.product_id=p.id "
        "WHERE w.user_id=%s ORDER BY w.created_at DESC",
        (user_id,)
    )
    items = cursor.fetchall() or []
    cursor.close()
    conn.close()
    return items

def get_wishlist_product_ids(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT product_id FROM wishlist WHERE user_id=%s", (user_id,))
    rows = cursor.fetchall() or []
    cursor.close()
    conn.close()
    return [r[0] for r in rows]

# ---------------- ADMIN DASHBOARD ----------------
def get_total_revenue():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COALESCE(SUM(total),0) FROM orders")
    total = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return total

def get_total_orders():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM orders")
    count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return count

def get_active_users_count():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return count

def get_pending_orders_count():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM orders WHERE status='Placed'")
    count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return count

def get_orders_this_week():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT TO_CHAR(created_at, 'Dy'), COUNT(*)
        FROM orders
        WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY TO_CHAR(created_at, 'Dy')
    """)
    rows = cursor.fetchall()

    days = ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"]
    data = {d: 0 for d in days}

    for day, count in rows:
        data[day.strip()] = count

    cursor.close()
    conn.close()
    return [data[d] for d in days]

def get_orders_by_status():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT status, COUNT(*) FROM orders GROUP BY status"
    )
    rows = cursor.fetchall()

    result = {"pending": 0, "confirmed": 0, "cancelled": 0}

    for status, count in rows:
        key = status.lower()
        if key in result:
            result[key] = count

    cursor.close()
    conn.close()
    return result
