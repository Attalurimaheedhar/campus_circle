from flask import (
    Flask, render_template, request,
    redirect, url_for, session, flash, jsonify, abort
)
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
import database as db
import os
from datetime import datetime

# EMAIL
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)

# 🔐 SECRET KEY (UPDATED FOR RENDER)
app.secret_key = os.environ.get("SECRET_KEY", "eco_mart_secret_key")

# ---------------- FILE UPLOAD CONFIG ----------------
# ✅ UPDATED: Render-safe upload path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ---------------- HELPERS ----------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("loggedin"):
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function

def send_otp_email(to_email, otp):
    sender_email = "ecomart.campus@gmail.com"
    app_password = os.environ.get("EMAIL_PASSWORD", "ping gsoy euoj jtws")

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = to_email
    msg["Subject"] = "EcoMart OTP Verification"

    body = f"""
Hello,

Your EcoMart OTP is: {otp}

This OTP is valid for 1 minute.
Please do not share it with anyone.

Regards,
EcoMart Team
"""
    msg.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, app_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print("Email error:", e)
        return False

# ---------------- ROUTES ----------------
@app.route("/")
def index():
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"].strip()
        password = request.form["password"].strip()
        user = db.get_user_by_email(email)

        if user and check_password_hash(user["password"], password):
            session["loggedin"] = True
            session["id"] = user["id"]
            session["name"] = user["name"]
            session["role"] = user.get("role", "customer")
            session["cart_count"] = len(db.get_cart(session["id"]))
            return redirect(url_for("home"))

        return render_template("login.html", error="Invalid email or password")

    return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "GET":
        return render_template("signup.html")

    name = request.form["name"].strip()
    phone = request.form["phone"].strip()
    email = request.form["email"].strip()
    password = request.form["password"].strip()
    confirm_password = request.form["confirm_password"].strip()

    if not email.endswith("@bvrit.ac.in"):
        return render_template("signup.html", error="Use college email ID")
    if password != confirm_password:
        return render_template("signup.html", error="Passwords do not match")
    if db.get_user_by_email(email):
        return render_template("signup.html", error="Email already exists")

    otp = db.generate_otp()
    expiry = db.otp_expiry()
    db.store_otp(email, otp, expiry)

    if not send_otp_email(email, otp):
        return render_template("signup.html", error="Failed to send OTP")

    session["temp_user"] = {
        "name": name,
        "phone": phone,
        "email": email,
        "password": generate_password_hash(password)
    }

    return redirect(url_for("verify_otp"))

@app.route("/verify_otp", methods=["GET", "POST"])
def verify_otp():
    if request.method == "POST":
        otp = request.form["otp"].strip()
        temp_user = session.get("temp_user")

        if not temp_user:
            return redirect(url_for("signup"))

        if db.verify_otp(temp_user["email"], otp):
            db.create_user(
                temp_user["name"],
                temp_user["phone"],
                temp_user["email"],
                temp_user["password"]
            )
            session.pop("temp_user", None)
            flash("Signup successful! Please login.", "success")
            return redirect(url_for("login"))

        return render_template("verify_otp.html", error="Invalid or expired OTP")

    return render_template("verify_otp.html")

@app.route("/resend_otp", methods=["POST"])
def resend_otp():
    temp_user = session.get("temp_user")

    if not temp_user:
        return redirect(url_for("signup"))

    otp = db.generate_otp()
    expiry = db.otp_expiry()
    db.store_otp(temp_user["email"], otp, expiry)

    send_otp_email(temp_user["email"], otp)
    flash("New OTP sent to your email", "success")

    return redirect(url_for("verify_otp"))

@app.route("/home")
@login_required
def home():
    return render_template("home.html", name=session.get("name"))

# ---------------- ADMIN PANEL ----------------
@app.route("/admin")
@login_required
def admin_panel():
    if session.get("role") not in ["admin", "super_admin"]:
        abort(403)

    stats = {
        "revenue": db.get_total_revenue(),
        "total_orders": db.get_total_orders(),
        "active_users": db.get_active_users_count(),
        "pending_orders": db.get_pending_orders_count()
    }

    weekly_orders = db.get_orders_this_week()
    order_status = db.get_orders_by_status()

    return render_template(
        "admin_panel.html",
        stats=stats,
        weekly_orders=weekly_orders,
        order_status=order_status,
        now=datetime.now()
    )

# ---------------- BUY ----------------
@app.route("/buy")
@login_required
def buy():
    products = db.get_all_products()
    for p in products:
        p["images"] = p["image"].split(",") if p.get("image") else []

    wishlist_ids = db.get_wishlist_product_ids(session["id"])
    cart_ids = db.get_cart_product_ids(session["id"])

    return render_template(
        "buy.html",
        products=products,
        wishlist_ids=wishlist_ids,
        cart_ids=cart_ids
    )

# ---------------- SELL ----------------
@app.route("/sell", methods=["GET", "POST"])
@login_required
def sell():
    if request.method == "POST":
        name = request.form.get("name")
        category = request.form.get("category")
        description = request.form.get("description")
        is_free = request.form.get("free")
        price = 0 if is_free else request.form.get("price") or 0

        images = request.files.getlist("images")
        saved_images = []

        for image in images:
            if image and image.filename and allowed_file(image.filename):
                filename = secure_filename(image.filename)
                filename = f"{int(datetime.now().timestamp())}_{filename}"
                image.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
                saved_images.append(filename)

        image_string = ",".join(saved_images) if saved_images else None
        db.add_product(session["id"], name, category, price, description, image_string)

        flash("Product listed successfully", "success")
        return redirect(url_for("sell"))

    return render_template("sell.html")

# ---------------- CART ----------------
@app.route("/cart", methods=["GET", "POST"])
@login_required
def cart():
    if request.method == "POST":
        data = request.get_json()
        db.add_to_cart(session["id"], data.get("product_id"), int(data.get("quantity", 1)))
        session["cart_count"] = len(db.get_cart(session["id"]))
        return jsonify({"success": True})

    items = db.get_cart(session["id"])
    return render_template("cart.html", items=items)

@app.route("/remove_from_cart", methods=["POST"])
@login_required
def remove_from_cart():
    db.remove_from_cart(session["id"], request.form.get("product_id"))
    session["cart_count"] = len(db.get_cart(session["id"]))
    flash("Removed from cart", "success")
    return redirect(url_for("cart"))

# ---------------- ORDERS ----------------
@app.route("/place_order", methods=["POST"])
@login_required
def place_order():
    db.place_order(session["id"])
    session["cart_count"] = 0
    flash("Order placed successfully!", "success")
    return redirect(url_for("orders"))

@app.route("/orders")
@login_required
def orders():
    return render_template("orders.html", orders=db.get_orders(session["id"]))

# ---------------- PROFILE ----------------
@app.route("/profile")
@login_required
def profile():
    user = db.get_user_by_id(session["id"])
    return render_template("profile.html", user=user)

@app.route("/update_phone", methods=["POST"])
@login_required
def update_phone():
    db.update_phone(session["id"], request.form.get("phone"))
    flash("Phone number updated successfully", "success")
    return redirect(url_for("profile"))

@app.route("/change_password", methods=["POST"])
@login_required
def change_password():
    user = db.get_user_by_id(session["id"])

    if not check_password_hash(user["password"], request.form.get("current_password")):
        return render_template("profile.html", user=user, error="Current password is incorrect")

    if request.form.get("new_password") != request.form.get("confirm_password"):
        return render_template("profile.html", user=user, error="Passwords do not match")

    db.update_password(session["id"], generate_password_hash(request.form.get("new_password")))
    flash("Password updated successfully", "success")
    return redirect(url_for("profile"))

# ---------------- WISHLIST ----------------
@app.route("/wishlist")
@login_required
def wishlist():
    return render_template("wishlist.html", items=db.get_wishlist(session["id"]))

@app.route("/remove_from_wishlist/<int:product_id>", methods=["POST"])
@login_required
def remove_from_wishlist(product_id):
    db.remove_from_wishlist(session["id"], product_id)
    return jsonify({"success": True})

@app.route("/toggle_wishlist/<int:product_id>", methods=["POST"])
@login_required
def toggle_wishlist(product_id):
    user_id = session["id"]
    ids = db.get_wishlist_product_ids(user_id)

    if product_id in ids:
        db.remove_from_wishlist(user_id, product_id)
    else:
        db.add_to_wishlist(user_id, product_id)

    return redirect(url_for("buy"))

# ---------------- SOLD ----------------
@app.route("/sold")
@login_required
def sold():
    return render_template("sold.html", sold_items=db.get_sold_items(session["id"]))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
