import os
from datetime import datetime, timedelta

from flask import (
    Flask,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.security import check_password_hash

from database import get_database_connection


app = Flask(__name__)

# ==========================================================
# SESSION / AUTHENTICATION CONFIGURATION
# ==========================================================

# For deployment, set FLASK_SECRET_KEY as an environment variable.
app.secret_key = os.environ.get(
    "FLASK_SECRET_KEY",
    "madha-marines-development-secret-key-change-before-deployment",
)

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    PERMANENT_SESSION_LIFETIME=timedelta(days=30),
)


# Routes that can be opened without logging in.
PUBLIC_ENDPOINTS = {
    "home",
    "login_page",
    "login",
    "static",
}


@app.before_request
def require_authentication():
    """Protect application pages and APIs from unauthenticated access."""

    if request.endpoint is None:
        return None

    if request.endpoint in PUBLIC_ENDPOINTS:
        return None

    if session.get("admin_id"):
        return None

    # API requests should receive JSON instead of an HTML redirect.
    if request.path.startswith("/api/"):
        return jsonify(
            {
                "success": False,
                "message": "Authentication required.",
            }
        ), 401

    return redirect(
        url_for(
            "login_page",
            next=request.path,
        )
    )


# ==========================================================
# PAGE ROUTES
# ==========================================================


@app.route("/")
def home():
    if session.get("admin_id"):
        return redirect(
            url_for("dashboard_page")
        )

    return redirect(
        url_for("login_page")
    )


@app.route("/login")
def login_page():
    if session.get("admin_id"):
        return redirect(
            url_for("dashboard_page")
        )

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()

    return redirect(
        url_for("login_page")
    )


@app.route("/suppliers")
def suppliers_page():
    return render_template("suppliers.html")


@app.route("/products")
def products_page():
    return render_template("products.html")


@app.route("/customers")
def customers_page():
    return render_template("customers.html")


@app.route("/stock-in")
def stock_in_page():
    return render_template("stock-in.html")


@app.route("/stock-out")
def stock_out_page():
    return render_template("stock-out.html")


@app.route("/invoice/<invoice_number>")
def invoice_page(invoice_number):
    return render_template(
        "invoice.html",
        invoice_number=invoice_number,
    )


@app.route("/dashboard")
def dashboard_page():
    return render_template("dashboard.html")


@app.route("/inventory")
def inventory_page():
    return render_template("inventory.html")


@app.route("/reports")
def reports_page():
    return render_template("reports.html")


@app.route("/settings")
def settings_page():
    return render_template("settings.html")


# ==========================================================
# LOGIN API
# ==========================================================


@app.route(
    "/api/login",
    methods=["POST"],
)
def login():
    data = request.get_json(silent=True) or {}

    username = str(
        data.get("username", "")
    ).strip()

    password = str(
        data.get("password", "")
    )

    remember_me = bool(
        data.get("rememberMe", False)
    )

    if not username or not password:
        return jsonify(
            {
                "success": False,
                "message": (
                    "Username and password are required."
                ),
            }
        ), 400

    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT
                admin_id,
                username,
                password_hash,
                full_name,
                status
            FROM admins
            WHERE username = %s
            LIMIT 1
            """,
            (username,),
        )

        admin = cursor.fetchone()

        if admin is None:
            return jsonify(
                {
                    "success": False,
                    "message": (
                        "Invalid username or password."
                    ),
                }
            ), 401

        if admin.get("status") != "Active":
            return jsonify(
                {
                    "success": False,
                    "message": (
                        "This account is inactive."
                    ),
                }
            ), 403

        if not check_password_hash(
            admin["password_hash"],
            password,
        ):
            return jsonify(
                {
                    "success": False,
                    "message": (
                        "Invalid username or password."
                    ),
                }
            ), 401

        session.clear()

        session["admin_id"] = (
            admin["admin_id"]
        )

        session["username"] = (
            admin["username"]
        )

        session["full_name"] = (
            admin.get("full_name")
            or admin["username"]
        )

        session.permanent = remember_me

        return jsonify(
            {
                "success": True,
                "message": "Login successful.",
                "admin": {
                    "id": admin["admin_id"],
                    "username": admin["username"],
                    "fullName": (
                        admin.get("full_name")
                        or admin["username"]
                    ),
                },
                "redirect": url_for(
                    "dashboard_page"
                ),
            }
        )

    except Exception as error:
        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


@app.route(
    "/api/session",
    methods=["GET"],
)
def get_session_details():
    return jsonify(
        {
            "success": True,
            "loggedIn": True,
            "admin": {
                "id": session.get("admin_id"),
                "username": session.get("username"),
                "fullName": session.get("full_name"),
            },
        }
    )


# ==========================================================
# DATABASE TEST ROUTE
# ==========================================================


@app.route("/test-database")
def test_database():
    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Unable to connect to MySQL.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                DATABASE() AS database_name,
                VERSION() AS mysql_version
            """
        )

        result = cursor.fetchone()

        return jsonify(
            {
                "success": True,
                "message": "MySQL connection successful.",
                "database": result["database_name"],
                "mysql_version": result["mysql_version"],
            }
        )

    except Exception as error:
        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# GET ALL SUPPLIERS
# ==========================================================


@app.route("/api/suppliers", methods=["GET"])
def get_suppliers():
    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                supplier_id AS id,
                supplier_name AS name,
                contact_person AS contactPerson,
                phone,
                email,
                address,
                city,
                state,
                gst_number AS gst,
                status,
                notes,
                created_at AS createdAt,
                updated_at AS updatedAt
            FROM suppliers
            ORDER BY supplier_id DESC
            """
        )

        suppliers = cursor.fetchall()

        for supplier in suppliers:
            if supplier.get("createdAt"):
                supplier["createdAt"] = (
                    supplier["createdAt"].isoformat()
                )

            if supplier.get("updatedAt"):
                supplier["updatedAt"] = (
                    supplier["updatedAt"].isoformat()
                )

        return jsonify(
            {
                "success": True,
                "suppliers": suppliers,
            }
        )

    except Exception as error:
        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# ADD SUPPLIER
# ==========================================================


@app.route("/api/suppliers", methods=["POST"])
def add_supplier():
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    gst = str(data.get("gst", "")).strip().upper()

    if not name:
        return jsonify(
            {
                "success": False,
                "message": "Supplier name is required.",
            }
        ), 400

    if not phone.isdigit() or len(phone) != 10:
        return jsonify(
            {
                "success": False,
                "message": "Enter a valid 10-digit phone number.",
            }
        ), 400

    if gst and len(gst) != 15:
        return jsonify(
            {
                "success": False,
                "message": "GST number must contain 15 characters.",
            }
        ), 400

    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO suppliers (
                supplier_name,
                contact_person,
                phone,
                email,
                address,
                city,
                state,
                gst_number,
                status,
                notes
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s
            )
            """,
            (
                name,
                str(
                    data.get(
                        "contactPerson",
                        "",
                    )
                ).strip() or None,

                phone,

                str(
                    data.get(
                        "email",
                        "",
                    )
                ).strip() or None,

                str(
                    data.get(
                        "address",
                        "",
                    )
                ).strip() or None,

                str(
                    data.get(
                        "city",
                        "",
                    )
                ).strip() or None,

                str(
                    data.get(
                        "state",
                        "",
                    )
                ).strip() or None,

                gst or None,

                str(
                    data.get(
                        "status",
                        "Active",
                    )
                ).strip(),

                str(
                    data.get(
                        "notes",
                        "",
                    )
                ).strip() or None,
            ),
        )

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": "Supplier added successfully.",
                "supplier_id": cursor.lastrowid,
            }
        ), 201

    except Exception as error:
        connection.rollback()

        if "Duplicate entry" in str(error):
            return jsonify(
                {
                    "success": False,
                    "message": (
                        "A supplier with this phone "
                        "number already exists."
                    ),
                }
            ), 409

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# UPDATE SUPPLIER
# ==========================================================


@app.route(
    "/api/suppliers/<int:supplier_id>",
    methods=["PUT"],
)
def update_supplier(supplier_id):
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    gst = str(data.get("gst", "")).strip().upper()

    if not name:
        return jsonify(
            {
                "success": False,
                "message": "Supplier name is required.",
            }
        ), 400

    if not phone.isdigit() or len(phone) != 10:
        return jsonify(
            {
                "success": False,
                "message": "Enter a valid 10-digit phone number.",
            }
        ), 400

    if gst and len(gst) != 15:
        return jsonify(
            {
                "success": False,
                "message": "GST number must contain 15 characters.",
            }
        ), 400

    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE suppliers
            SET
                supplier_name = %s,
                contact_person = %s,
                phone = %s,
                email = %s,
                address = %s,
                city = %s,
                state = %s,
                gst_number = %s,
                status = %s,
                notes = %s
            WHERE supplier_id = %s
            """,
            (
                name,

                str(
                    data.get(
                        "contactPerson",
                        "",
                    )
                ).strip() or None,

                phone,

                str(
                    data.get(
                        "email",
                        "",
                    )
                ).strip() or None,

                str(
                    data.get(
                        "address",
                        "",
                    )
                ).strip() or None,

                str(
                    data.get(
                        "city",
                        "",
                    )
                ).strip() or None,

                str(
                    data.get(
                        "state",
                        "",
                    )
                ).strip() or None,

                gst or None,

                str(
                    data.get(
                        "status",
                        "Active",
                    )
                ).strip(),

                str(
                    data.get(
                        "notes",
                        "",
                    )
                ).strip() or None,

                supplier_id,
            ),
        )

        if cursor.rowcount == 0:
            cursor.execute(
                """
                SELECT supplier_id
                FROM suppliers
                WHERE supplier_id = %s
                """,
                (supplier_id,),
            )

            if cursor.fetchone() is None:
                return jsonify(
                    {
                        "success": False,
                        "message": "Supplier not found.",
                    }
                ), 404

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": "Supplier updated successfully.",
            }
        )

    except Exception as error:
        connection.rollback()

        if "Duplicate entry" in str(error):
            return jsonify(
                {
                    "success": False,
                    "message": (
                        "A supplier with this phone "
                        "number already exists."
                    ),
                }
            ), 409

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# DELETE SUPPLIER
# ==========================================================


@app.route(
    "/api/suppliers/<int:supplier_id>",
    methods=["DELETE"],
)
def delete_supplier(supplier_id):
    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM suppliers
            WHERE supplier_id = %s
            """,
            (supplier_id,),
        )

        if cursor.rowcount == 0:
            return jsonify(
                {
                    "success": False,
                    "message": "Supplier not found.",
                }
            ), 404

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": "Supplier deleted successfully.",
            }
        )

    except Exception as error:
        connection.rollback()

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# PRODUCT API ROUTES
# ==========================================================

# ==========================================================
# GET ALL PRODUCTS
# ==========================================================


@app.route("/api/products", methods=["GET"])
def get_products():
    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                p.product_id AS id,
                p.product_name AS name,
                p.category,
                p.brand,
                p.quantity,
                p.unit,
                p.purchase_price AS price,
                p.selling_price AS sellingPrice,
                p.minimum_stock AS minimumStock,
                p.supplier_id AS supplierId,
                s.supplier_name AS supplier,
                p.status,
                p.created_at AS createdAt,
                p.updated_at AS updatedAt
            FROM products p
            LEFT JOIN suppliers s
                ON p.supplier_id = s.supplier_id
            ORDER BY p.product_id DESC
            """
        )

        products = cursor.fetchall()

        for product in products:
            product["quantity"] = float(
                product["quantity"] or 0
            )

            product["price"] = float(
                product["price"] or 0
            )

            product["sellingPrice"] = float(
                product["sellingPrice"] or 0
            )

            product["minimumStock"] = float(
                product["minimumStock"] or 0
            )

            if product.get("createdAt"):
                product["createdAt"] = (
                    product["createdAt"].isoformat()
                )

            if product.get("updatedAt"):
                product["updatedAt"] = (
                    product["updatedAt"].isoformat()
                )

        return jsonify(
            {
                "success": True,
                "products": products,
            }
        )

    except Exception as error:
        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# ADD PRODUCT
# ==========================================================


@app.route("/api/products", methods=["POST"])
def add_product():
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    category = str(data.get("category", "")).strip()
    brand = str(data.get("brand", "")).strip()
    unit = str(data.get("unit", "")).strip()

    try:
        quantity = float(data.get("quantity", 0))
        price = float(data.get("price", 0))
        supplier_id = int(data.get("supplierId"))
    except (TypeError, ValueError):
        return jsonify(
            {
                "success": False,
                "message": "Invalid product information.",
            }
        ), 400

    if not name:
        return jsonify(
            {
                "success": False,
                "message": "Product name is required.",
            }
        ), 400

    if not category:
        return jsonify(
            {
                "success": False,
                "message": "Category is required.",
            }
        ), 400

    if not unit:
        return jsonify(
            {
                "success": False,
                "message": "Unit is required.",
            }
        ), 400

    if quantity < 0:
        return jsonify(
            {
                "success": False,
                "message": "Quantity cannot be negative.",
            }
        ), 400

    if price < 0:
        return jsonify(
            {
                "success": False,
                "message": "Price cannot be negative.",
            }
        ), 400

    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT supplier_id
            FROM suppliers
            WHERE
                supplier_id = %s
                AND status = 'Active'
            """,
            (supplier_id,),
        )

        supplier = cursor.fetchone()

        if supplier is None:
            return jsonify(
                {
                    "success": False,
                    "message": (
                        "The selected supplier was not found "
                        "or is inactive."
                    ),
                }
            ), 400

        cursor.execute(
            """
            SELECT product_id
            FROM products
            WHERE
                LOWER(product_name) = LOWER(%s)
                AND LOWER(category) = LOWER(%s)
                AND LOWER(unit) = LOWER(%s)
            LIMIT 1
            """,
            (
                name,
                category,
                unit,
            ),
        )

        duplicate_product = cursor.fetchone()

        if duplicate_product is not None:
            return jsonify(
                {
                    "success": False,
                    "message": (
                        "A product with the same name, "
                        "category and unit already exists."
                    ),
                }
            ), 409

        cursor.execute(
            """
            INSERT INTO products (
                product_name,
                category,
                brand,
                unit,
                purchase_price,
                selling_price,
                quantity,
                minimum_stock,
                supplier_id,
                status
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, 'Active'
            )
            """,
            (
                name,
                category,
                brand or None,
                unit,
                price,
                price,
                quantity,
                5,
                supplier_id,
            ),
        )

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": "Product added successfully.",
                "product_id": cursor.lastrowid,
            }
        ), 201

    except Exception as error:
        connection.rollback()

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# UPDATE PRODUCT
# ==========================================================


@app.route(
    "/api/products/<int:product_id>",
    methods=["PUT"],
)
def update_product(product_id):
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    category = str(data.get("category", "")).strip()
    brand = str(data.get("brand", "")).strip()
    unit = str(data.get("unit", "")).strip()

    try:
        quantity = float(data.get("quantity", 0))
        price = float(data.get("price", 0))
        supplier_id = int(data.get("supplierId"))
    except (TypeError, ValueError):
        return jsonify(
            {
                "success": False,
                "message": "Invalid product information.",
            }
        ), 400

    if not name or not category or not unit:
        return jsonify(
            {
                "success": False,
                "message": (
                    "Product name, category and unit "
                    "are required."
                ),
            }
        ), 400

    if quantity < 0 or price < 0:
        return jsonify(
            {
                "success": False,
                "message": (
                    "Quantity and price cannot be negative."
                ),
            }
        ), 400

    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT supplier_id
            FROM suppliers
            WHERE
                supplier_id = %s
                AND status = 'Active'
            """,
            (supplier_id,),
        )

        if cursor.fetchone() is None:
            return jsonify(
                {
                    "success": False,
                    "message": (
                        "The selected supplier was not found "
                        "or is inactive."
                    ),
                }
            ), 400

        cursor.execute(
            """
            SELECT product_id
            FROM products
            WHERE
                LOWER(product_name) = LOWER(%s)
                AND LOWER(category) = LOWER(%s)
                AND LOWER(unit) = LOWER(%s)
                AND product_id <> %s
            LIMIT 1
            """,
            (
                name,
                category,
                unit,
                product_id,
            ),
        )

        if cursor.fetchone() is not None:
            return jsonify(
                {
                    "success": False,
                    "message": (
                        "A product with the same name, "
                        "category and unit already exists."
                    ),
                }
            ), 409

        cursor.execute(
            """
            UPDATE products
            SET
                product_name = %s,
                category = %s,
                brand = %s,
                unit = %s,
                purchase_price = %s,
                selling_price = %s,
                quantity = %s,
                supplier_id = %s
            WHERE product_id = %s
            """,
            (
                name,
                category,
                brand or None,
                unit,
                price,
                price,
                quantity,
                supplier_id,
                product_id,
            ),
        )

        if cursor.rowcount == 0:
            cursor.execute(
                """
                SELECT product_id
                FROM products
                WHERE product_id = %s
                """,
                (product_id,),
            )

            if cursor.fetchone() is None:
                return jsonify(
                    {
                        "success": False,
                        "message": "Product not found.",
                    }
                ), 404

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": "Product updated successfully.",
            }
        )

    except Exception as error:
        connection.rollback()

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# DELETE PRODUCT
# ==========================================================


@app.route(
    "/api/products/<int:product_id>",
    methods=["DELETE"],
)
def delete_product(product_id):
    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM products
            WHERE product_id = %s
            """,
            (product_id,),
        )

        if cursor.rowcount == 0:
            return jsonify(
                {
                    "success": False,
                    "message": "Product not found.",
                }
            ), 404

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": "Product deleted successfully.",
            }
        )

    except Exception as error:
        connection.rollback()

        error_message = str(error)

        if (
            "foreign key constraint fails"
            in error_message.lower()
        ):
            return jsonify(
                {
                    "success": False,
                    "message": (
                        "This product has stock or sales history "
                        "and cannot be deleted."
                    ),
                }
            ), 409

        return jsonify(
            {
                "success": False,
                "message": error_message,
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()

# ==========================================================
# CUSTOMER API ROUTES
# ==========================================================


@app.route("/api/customers", methods=["GET"])
def get_customers():
    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                customer_id AS id,
                customer_name AS name,
                phone,
                email,
                address,
                city,
                state,
                customer_type AS type,
                status,
                created_at AS createdAt,
                updated_at AS updatedAt
            FROM customers
            ORDER BY customer_id DESC
            """
        )

        customers = cursor.fetchall()

        for customer in customers:
            if customer.get("createdAt"):
                customer["createdAt"] = (
                    customer["createdAt"].isoformat()
                )

            if customer.get("updatedAt"):
                customer["updatedAt"] = (
                    customer["updatedAt"].isoformat()
                )

        return jsonify(
            {
                "success": True,
                "customers": customers,
            }
        )

    except Exception as error:
        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


@app.route("/api/customers", methods=["POST"])
def add_customer():
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    customer_type = str(
        data.get("type", "")
    ).strip()
    status = str(
        data.get("status", "Active")
    ).strip()

    if not name:
        return jsonify(
            {
                "success": False,
                "message": "Customer name is required.",
            }
        ), 400

    if not phone.isdigit() or len(phone) != 10:
        return jsonify(
            {
                "success": False,
                "message": (
                    "Phone number must contain "
                    "exactly 10 digits."
                ),
            }
        ), 400

    if not customer_type:
        return jsonify(
            {
                "success": False,
                "message": "Customer type is required.",
            }
        ), 400

    if status not in ("Active", "Inactive"):
        return jsonify(
            {
                "success": False,
                "message": "Invalid customer status.",
            }
        ), 400

    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO customers (
                customer_name,
                phone,
                email,
                address,
                customer_type,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                name,
                phone,
                str(
                    data.get("email", "")
                ).strip() or None,
                str(
                    data.get("address", "")
                ).strip() or None,
                customer_type,
                status,
            ),
        )

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": "Customer added successfully.",
                "customer_id": cursor.lastrowid,
            }
        ), 201

    except Exception as error:
        connection.rollback()

        if "Duplicate entry" in str(error):
            return jsonify(
                {
                    "success": False,
                    "message": (
                        "A customer with this phone "
                        "number already exists."
                    ),
                }
            ), 409

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


@app.route(
    "/api/customers/<int:customer_id>",
    methods=["PUT"],
)
def update_customer(customer_id):
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    customer_type = str(
        data.get("type", "")
    ).strip()
    status = str(
        data.get("status", "Active")
    ).strip()

    if not name:
        return jsonify(
            {
                "success": False,
                "message": "Customer name is required.",
            }
        ), 400

    if not phone.isdigit() or len(phone) != 10:
        return jsonify(
            {
                "success": False,
                "message": (
                    "Phone number must contain "
                    "exactly 10 digits."
                ),
            }
        ), 400

    if not customer_type:
        return jsonify(
            {
                "success": False,
                "message": "Customer type is required.",
            }
        ), 400

    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            UPDATE customers
            SET
                customer_name = %s,
                phone = %s,
                email = %s,
                address = %s,
                customer_type = %s,
                status = %s
            WHERE customer_id = %s
            """,
            (
                name,
                phone,
                str(
                    data.get("email", "")
                ).strip() or None,
                str(
                    data.get("address", "")
                ).strip() or None,
                customer_type,
                status,
                customer_id,
            ),
        )

        if cursor.rowcount == 0:
            cursor.execute(
                """
                SELECT customer_id
                FROM customers
                WHERE customer_id = %s
                """,
                (customer_id,),
            )

            if cursor.fetchone() is None:
                return jsonify(
                    {
                        "success": False,
                        "message": "Customer not found.",
                    }
                ), 404

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": "Customer updated successfully.",
            }
        )

    except Exception as error:
        connection.rollback()

        if "Duplicate entry" in str(error):
            return jsonify(
                {
                    "success": False,
                    "message": (
                        "A customer with this phone "
                        "number already exists."
                    ),
                }
            ), 409

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


@app.route(
    "/api/customers/<int:customer_id>",
    methods=["DELETE"],
)
def delete_customer(customer_id):
    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM customers
            WHERE customer_id = %s
            """,
            (customer_id,),
        )

        if cursor.rowcount == 0:
            return jsonify(
                {
                    "success": False,
                    "message": "Customer not found.",
                }
            ), 404

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": "Customer deleted successfully.",
            }
        )

    except Exception as error:
        connection.rollback()

        error_message = str(error)

        if (
            "foreign key constraint fails"
            in error_message.lower()
        ):
            return jsonify(
                {
                    "success": False,
                    "message": (
                        "This customer has sales or invoice "
                        "history and cannot be deleted."
                    ),
                }
            ), 409

        return jsonify(
            {
                "success": False,
                "message": error_message,
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()

# ==========================================================
# STOCK IN API ROUTES
# ==========================================================


@app.route("/api/stock-in", methods=["GET"])
def get_stock_in_history():
    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                si.stock_in_id AS id,
                si.product_id AS productId,
                p.product_name AS productName,
                p.category,
                p.unit,
                p.purchase_price AS pricePerUnit,
                si.supplier_id AS supplierId,
                s.supplier_name AS supplier,
                si.quantity_added AS quantityAdded,
                si.previous_stock AS previousStock,
                si.new_stock AS newStock,
                si.invoice_number AS invoice,
                si.received_date AS date,
                si.notes,
                si.status,
                si.created_at AS createdAt
            FROM stock_in si
            INNER JOIN products p
                ON si.product_id = p.product_id
            LEFT JOIN suppliers s
                ON si.supplier_id = s.supplier_id
            ORDER BY si.stock_in_id DESC
            """
        )

        history = cursor.fetchall()

        for record in history:
            record["quantityAdded"] = float(
                record["quantityAdded"] or 0
            )

            record["previousStock"] = float(
                record["previousStock"] or 0
            )

            record["newStock"] = float(
                record["newStock"] or 0
            )

            record["pricePerUnit"] = float(
                record["pricePerUnit"] or 0
            )

            if record.get("date"):
                record["date"] = (
                    record["date"].isoformat()
                )

            if record.get("createdAt"):
                record["createdAt"] = (
                    record["createdAt"].isoformat()
                )

        return jsonify(
            {
                "success": True,
                "history": history,
            }
        )

    except Exception as error:
        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


@app.route("/api/stock-in", methods=["POST"])
def add_stock_in():
    data = request.get_json(silent=True) or {}

    try:
        product_id = int(data.get("productId"))
        supplier_id = int(data.get("supplierId"))
        quantity_added = float(
            data.get("quantityAdded", 0)
        )
    except (TypeError, ValueError):
        return jsonify(
            {
                "success": False,
                "message": (
                    "Product, supplier and quantity "
                    "must be valid."
                ),
            }
        ), 400

    received_date = str(
        data.get("date", "")
    ).strip()

    invoice_number = str(
        data.get("invoice", "")
    ).strip()

    notes = str(
        data.get("notes", "")
    ).strip()

    if quantity_added <= 0:
        return jsonify(
            {
                "success": False,
                "message": (
                    "Quantity must be greater than zero."
                ),
            }
        ), 400

    if round(quantity_added, 2) != quantity_added:
        return jsonify(
            {
                "success": False,
                "message": (
                    "Quantity can have a maximum "
                    "of two decimal places."
                ),
            }
        ), 400

    if not received_date:
        return jsonify(
            {
                "success": False,
                "message": "Received date is required.",
            }
        ), 400

    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        connection.start_transaction()

        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                product_id,
                product_name,
                quantity,
                unit
            FROM products
            WHERE
                product_id = %s
                AND status = 'Active'
            FOR UPDATE
            """,
            (product_id,),
        )

        product = cursor.fetchone()

        if product is None:
            connection.rollback()

            return jsonify(
                {
                    "success": False,
                    "message": (
                        "The selected product was not found "
                        "or is inactive."
                    ),
                }
            ), 404

        cursor.execute(
            """
            SELECT supplier_id
            FROM suppliers
            WHERE
                supplier_id = %s
                AND status = 'Active'
            """,
            (supplier_id,),
        )

        supplier = cursor.fetchone()

        if supplier is None:
            connection.rollback()

            return jsonify(
                {
                    "success": False,
                    "message": (
                        "The selected supplier was not found "
                        "or is inactive."
                    ),
                }
            ), 400

        previous_stock = float(
            product["quantity"] or 0
        )

        new_stock = round(
            previous_stock + quantity_added,
            2,
        )

        cursor.execute(
            """
            INSERT INTO stock_in (
                product_id,
                supplier_id,
                quantity_added,
                previous_stock,
                new_stock,
                invoice_number,
                received_date,
                notes,
                status
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, 'Completed'
            )
            """,
            (
                product_id,
                supplier_id,
                quantity_added,
                previous_stock,
                new_stock,
                invoice_number or None,
                received_date,
                notes or None,
            ),
        )

        stock_in_id = cursor.lastrowid

        cursor.execute(
            """
            UPDATE products
            SET
                quantity = %s,
                supplier_id = %s
            WHERE product_id = %s
            """,
            (
                new_stock,
                supplier_id,
                product_id,
            ),
        )

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": (
                    f"{quantity_added:g} "
                    f"{product['unit']} added successfully "
                    f"to {product['product_name']}."
                ),
                "stock_in_id": stock_in_id,
                "previous_stock": previous_stock,
                "new_stock": new_stock,
            }
        ), 201

    except Exception as error:
        connection.rollback()

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


@app.route("/api/stock-in", methods=["DELETE"])
def clear_stock_in_history():
    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM stock_in
            """
        )

        deleted_count = cursor.rowcount

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": (
                    "Stock-in history cleared successfully."
                ),
                "deleted_count": deleted_count,
            }
        )

    except Exception as error:
        connection.rollback()

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()

# ==========================================================
# STOCK OUT API ROUTES
# ==========================================================


def generate_invoice_number():
    """Generate a unique invoice number."""

    current_time = datetime.now()

    return current_time.strftime(
        "INV-%Y%m%d-%H%M%S-%f"
    )


@app.route("/api/stock-out", methods=["GET"])
def get_stock_out_history():
    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                so.stock_out_id AS id,
                so.product_id AS productId,
                p.product_name AS productName,
                p.category,
                p.unit,
                p.purchase_price AS purchasePrice,
                so.quantity_sold AS quantitySold,
                so.selling_price AS sellingPrice,
                so.total_amount AS totalAmount,
                so.previous_stock AS previousStock,
                so.remaining_stock AS newStock,
                so.customer_id AS customerId,
                COALESCE(
                    so.customer_name,
                    c.customer_name,
                    'Walk-in Customer'
                ) AS customerName,
                COALESCE(
                    so.customer_phone,
                    c.phone
                ) AS customerPhone,
                so.payment_method AS paymentMethod,
                so.invoice_number AS invoice,
                so.sale_date AS date,
                so.notes,
                so.status,
                so.created_at AS createdAt
            FROM stock_out so
            INNER JOIN products p
                ON so.product_id = p.product_id
            LEFT JOIN customers c
                ON so.customer_id = c.customer_id
            ORDER BY so.stock_out_id DESC
            """
        )

        sales = cursor.fetchall()

        for sale in sales:
            sale["quantitySold"] = float(
                sale["quantitySold"] or 0
            )

            sale["sellingPrice"] = float(
                sale["sellingPrice"] or 0
            )

            sale["totalAmount"] = float(
                sale["totalAmount"] or 0
            )

            sale["previousStock"] = float(
                sale["previousStock"] or 0
            )

            sale["newStock"] = float(
                sale["newStock"] or 0
            )

            sale["purchasePrice"] = float(
                sale["purchasePrice"] or 0
            )

            if sale.get("date"):
                sale["date"] = sale["date"].isoformat()

            if sale.get("createdAt"):
                sale["createdAt"] = (
                    sale["createdAt"].isoformat()
                )

        total_sales = sum(
            sale["totalAmount"]
            for sale in sales
        )

        return jsonify(
            {
                "success": True,
                "sales": sales,
                "total_sales": round(total_sales, 2),
            }
        )

    except Exception as error:
        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


@app.route("/api/stock-out", methods=["POST"])
def add_stock_out():
    data = request.get_json(silent=True) or {}

    try:
        product_id = int(data.get("productId"))

        quantity_sold = float(
            data.get("quantitySold", 0)
        )

        selling_price = float(
            data.get("sellingPrice", 0)
        )
    except (TypeError, ValueError):
        return jsonify(
            {
                "success": False,
                "message": (
                    "Product, quantity and selling "
                    "price must be valid."
                ),
            }
        ), 400

    customer_id_value = data.get("customerId")

    customer_id = None

    if customer_id_value not in (
        None,
        "",
        0,
        "0",
    ):
        try:
            customer_id = int(customer_id_value)
        except (TypeError, ValueError):
            return jsonify(
                {
                    "success": False,
                    "message": "Invalid customer selection.",
                }
            ), 400

    customer_name = str(
        data.get("customerName", "")
    ).strip()

    customer_phone = str(
        data.get("customerPhone", "")
    ).strip()

    payment_method = str(
        data.get("paymentMethod", "Cash")
    ).strip()

    sale_date = str(
        data.get("date", "")
    ).strip()

    notes = str(
        data.get("notes", "")
    ).strip()

    if quantity_sold <= 0:
        return jsonify(
            {
                "success": False,
                "message": (
                    "Quantity must be greater than zero."
                ),
            }
        ), 400

    if round(quantity_sold, 2) != quantity_sold:
        return jsonify(
            {
                "success": False,
                "message": (
                    "Quantity can have a maximum "
                    "of two decimal places."
                ),
            }
        ), 400

    if selling_price <= 0:
        return jsonify(
            {
                "success": False,
                "message": (
                    "Selling price must be "
                    "greater than zero."
                ),
            }
        ), 400

    if round(selling_price, 2) != selling_price:
        return jsonify(
            {
                "success": False,
                "message": (
                    "Selling price can have a maximum "
                    "of two decimal places."
                ),
            }
        ), 400

    if (
        customer_phone
        and (
            not customer_phone.isdigit()
            or len(customer_phone) != 10
        )
    ):
        return jsonify(
            {
                "success": False,
                "message": (
                    "Customer phone number must "
                    "contain exactly 10 digits."
                ),
            }
        ), 400

    if not sale_date:
        return jsonify(
            {
                "success": False,
                "message": "Sale date is required.",
            }
        ), 400

    valid_payment_methods = {
        "Cash",
        "UPI",
        "Card",
        "Credit",
        "Bank Transfer",
    }

    if payment_method not in valid_payment_methods:
        return jsonify(
            {
                "success": False,
                "message": "Invalid payment method.",
            }
        ), 400

    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        connection.start_transaction()

        cursor = connection.cursor(dictionary=True)

        # Lock the product row during the sale.
        cursor.execute(
            """
            SELECT
                product_id,
                product_name,
                category,
                unit,
                quantity,
                purchase_price
            FROM products
            WHERE
                product_id = %s
                AND status = 'Active'
            FOR UPDATE
            """,
            (product_id,),
        )

        product = cursor.fetchone()

        if product is None:
            connection.rollback()

            return jsonify(
                {
                    "success": False,
                    "message": (
                        "The selected product was not "
                        "found or is inactive."
                    ),
                }
            ), 404

        previous_stock = float(
            product["quantity"] or 0
        )

        if quantity_sold > previous_stock:
            connection.rollback()

            return jsonify(
                {
                    "success": False,
                    "message": (
                        f"Insufficient stock. Only "
                        f"{previous_stock:g} "
                        f"{product['unit']} is available."
                    ),
                }
            ), 409

        # Validate a selected saved customer.
        if customer_id is not None:
            cursor.execute(
                """
                SELECT
                    customer_id,
                    customer_name,
                    phone
                FROM customers
                WHERE
                    customer_id = %s
                    AND status = 'Active'
                """,
                (customer_id,),
            )

            selected_customer = cursor.fetchone()

            if selected_customer is None:
                connection.rollback()

                return jsonify(
                    {
                        "success": False,
                        "message": (
                            "The selected customer was not "
                            "found or is inactive."
                        ),
                    }
                ), 400

            customer_name = (
                selected_customer["customer_name"]
            )

            customer_phone = (
                selected_customer["phone"] or ""
            )

        if not customer_name:
            customer_name = "Walk-in Customer"

        remaining_stock = round(
            previous_stock - quantity_sold,
            2,
        )

        total_amount = round(
            quantity_sold * selling_price,
            2,
        )

        invoice_number = generate_invoice_number()

        # Save the stock-out transaction.
        cursor.execute(
            """
            INSERT INTO stock_out (
                product_id,
                customer_id,
                quantity_sold,
                selling_price,
                total_amount,
                previous_stock,
                remaining_stock,
                payment_method,
                sale_date,
                notes,
                invoice_number,
                customer_name,
                customer_phone,
                status
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, 'Completed'
            )
            """,
            (
                product_id,
                customer_id,
                quantity_sold,
                selling_price,
                total_amount,
                previous_stock,
                remaining_stock,
                payment_method,
                sale_date,
                notes or None,
                invoice_number,
                customer_name,
                customer_phone or None,
            ),
        )

        stock_out_id = cursor.lastrowid

        # Reduce the current product quantity.
        cursor.execute(
            """
            UPDATE products
            SET
                quantity = %s,
                selling_price = %s
            WHERE product_id = %s
            """,
            (
                remaining_stock,
                selling_price,
                product_id,
            ),
        )

        # Create the invoice header.
        cursor.execute(
            """
            INSERT INTO invoices (
                invoice_number,
                customer_id,
                customer_name,
                customer_phone,
                invoice_date,
                subtotal,
                discount_amount,
                tax_amount,
                grand_total,
                payment_method,
                payment_status,
                notes
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, 0.00, 0.00, %s,
                %s, 'Paid', %s
            )
            """,
            (
                invoice_number,
                customer_id,
                customer_name,
                customer_phone or None,
                sale_date,
                total_amount,
                total_amount,
                payment_method,
                notes or None,
            ),
        )

        invoice_id = cursor.lastrowid

        # Create the invoice product item.
        cursor.execute(
            """
            INSERT INTO invoice_items (
                invoice_id,
                product_id,
                quantity,
                unit,
                price_per_unit,
                item_total
            )
            VALUES (
                %s, %s, %s, %s, %s, %s
            )
            """,
            (
                invoice_id,
                product_id,
                quantity_sold,
                product["unit"],
                selling_price,
                total_amount,
            ),
        )

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": (
                    f"{quantity_sold:g} "
                    f"{product['unit']} of "
                    f"{product['product_name']} sold "
                    f"successfully."
                ),
                "stock_out_id": stock_out_id,
                "invoice_id": invoice_id,
                "invoice_number": invoice_number,
                "previous_stock": previous_stock,
                "remaining_stock": remaining_stock,
                "total_amount": total_amount,
            }
        ), 201

    except Exception as error:
        connection.rollback()

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


@app.route("/api/stock-out", methods=["DELETE"])
def clear_stock_out_history():
    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM stock_out
            """
        )

        deleted_count = cursor.rowcount

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": (
                    "Stock-out history cleared successfully. "
                    "Product quantities were not restored."
                ),
                "deleted_count": deleted_count,
            }
        )

    except Exception as error:
        connection.rollback()

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# INVOICE API ROUTES
# ==========================================================


@app.route(
    "/api/invoices/<invoice_number>",
    methods=["GET"],
)
def get_invoice(invoice_number):
    connection = get_database_connection()

    if connection is None:
        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                i.invoice_id AS invoiceId,
                i.invoice_number AS invoiceNumber,
                i.invoice_date AS invoiceDate,
                i.customer_id AS customerId,
                COALESCE(
                    i.customer_name,
                    c.customer_name,
                    'Walk-in Customer'
                ) AS customerName,
                COALESCE(
                    i.customer_phone,
                    c.phone
                ) AS customerPhone,
                i.subtotal,
                i.discount_amount AS discountAmount,
                i.tax_amount AS taxAmount,
                i.grand_total AS grandTotal,
                i.payment_method AS paymentMethod,
                i.payment_status AS paymentStatus,
                i.notes,
                i.created_at AS createdAt
            FROM invoices i
            LEFT JOIN customers c
                ON i.customer_id = c.customer_id
            WHERE i.invoice_number = %s
            """,
            (invoice_number,),
        )

        invoice = cursor.fetchone()

        if invoice is None:
            return jsonify(
                {
                    "success": False,
                    "message": "Invoice not found.",
                }
            ), 404

        cursor.execute(
            """
            SELECT
                ii.invoice_item_id AS itemId,
                ii.product_id AS productId,
                p.product_name AS productName,
                ii.quantity,
                ii.unit,
                ii.price_per_unit AS pricePerUnit,
                ii.item_total AS itemTotal
            FROM invoice_items ii
            INNER JOIN products p
                ON ii.product_id = p.product_id
            WHERE ii.invoice_id = %s
            ORDER BY ii.invoice_item_id
            """,
            (invoice["invoiceId"],),
        )

        items = cursor.fetchall()

        for field in (
            "subtotal",
            "discountAmount",
            "taxAmount",
            "grandTotal",
        ):
            invoice[field] = float(invoice[field] or 0)

        if invoice.get("invoiceDate"):
            invoice["invoiceDate"] = invoice["invoiceDate"].isoformat()

        if invoice.get("createdAt"):
            invoice["createdAt"] = invoice["createdAt"].isoformat()

        for item in items:
            item["quantity"] = float(item["quantity"] or 0)
            item["pricePerUnit"] = float(item["pricePerUnit"] or 0)
            item["itemTotal"] = float(item["itemTotal"] or 0)

        return jsonify(
            {
                "success": True,
                "invoice": invoice,
                "items": items,
            }
        )

    except Exception as error:
        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()

# ==========================================================
# SETTINGS API ROUTES
# ==========================================================


def get_or_create_settings(cursor, connection):
    """
    Return the single application settings row.

    If no settings row exists yet, create the default row.
    """

    cursor.execute(
        """
        SELECT
            setting_id,
            shop_name,
            owner_name,
            phone,
            email,
            gst_number,
            address,
            low_stock_limit,
            currency_symbol,
            date_format,
            invoice_prefix
        FROM app_settings
        ORDER BY setting_id
        LIMIT 1
        """
    )

    settings = cursor.fetchone()

    if settings is not None:
        return settings


    cursor.execute(
        """
        INSERT INTO app_settings (
            shop_name,
            low_stock_limit,
            currency_symbol,
            date_format,
            invoice_prefix
        )
        VALUES (
            'Madha Marines',
            5.00,
            '₹',
            'DD-MM-YYYY',
            'MM'
        )
        """
    )

    connection.commit()


    cursor.execute(
        """
        SELECT
            setting_id,
            shop_name,
            owner_name,
            phone,
            email,
            gst_number,
            address,
            low_stock_limit,
            currency_symbol,
            date_format,
            invoice_prefix
        FROM app_settings
        ORDER BY setting_id
        LIMIT 1
        """
    )

    return cursor.fetchone()


# ==========================================================
# GET SETTINGS
# ==========================================================


@app.route(
    "/api/settings",
    methods=["GET"],
)
def get_settings():

    connection = get_database_connection()

    if connection is None:

        return jsonify(
            {
                "success": False,
                "message": "Database connection failed.",
            }
        ), 500


    cursor = None

    try:

        cursor = connection.cursor(
            dictionary=True
        )


        settings = get_or_create_settings(
            cursor,
            connection,
        )


        return jsonify(
            {
                "success": True,

                "shop": {

                    "shopName":
                        settings["shop_name"]
                        or "Madha Marines",

                    "ownerName":
                        settings["owner_name"]
                        or "",

                    "phone":
                        settings["phone"]
                        or "",

                    "email":
                        settings["email"]
                        or "",

                    "gstNumber":
                        settings["gst_number"]
                        or "",

                    "address":
                        settings["address"]
                        or "",

                },

                "inventory": {

                    "lowStockLimit":
                        float(
                            settings[
                                "low_stock_limit"
                            ] or 5
                        ),

                    "currencySymbol":
                        settings[
                            "currency_symbol"
                        ]
                        or "₹",

                    "dateFormat":
                        settings[
                            "date_format"
                        ]
                        or "DD-MM-YYYY",

                    "invoicePrefix":
                        settings[
                            "invoice_prefix"
                        ]
                        or "MM",

                },
            }
        )


    except Exception as error:

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500


    finally:

        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# UPDATE SHOP SETTINGS
# ==========================================================


@app.route(
    "/api/settings/shop",
    methods=["PUT"],
)
def update_shop_settings():

    data = request.get_json(
        silent=True
    ) or {}


    shop_name = str(
        data.get(
            "shopName",
            "",
        )
    ).strip()


    owner_name = str(
        data.get(
            "ownerName",
            "",
        )
    ).strip()


    phone = str(
        data.get(
            "phone",
            "",
        )
    ).strip()


    email = str(
        data.get(
            "email",
            "",
        )
    ).strip()


    gst_number = str(
        data.get(
            "gstNumber",
            "",
        )
    ).strip().upper()


    address = str(
        data.get(
            "address",
            "",
        )
    ).strip()


    if not shop_name:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Shop name is required."
                ),
            }
        ), 400


    if phone and (
        not phone.isdigit()
        or len(phone) != 10
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Phone number must contain "
                    "exactly 10 digits."
                ),
            }
        ), 400


    if gst_number and (
        len(gst_number) != 15
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "GST number must contain "
                    "exactly 15 characters."
                ),
            }
        ), 400


    connection = get_database_connection()

    if connection is None:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Database connection failed."
                ),
            }
        ), 500


    cursor = None

    try:

        cursor = connection.cursor(
            dictionary=True
        )


        settings = get_or_create_settings(
            cursor,
            connection,
        )


        cursor.execute(
            """
            UPDATE app_settings
            SET
                shop_name = %s,
                owner_name = %s,
                phone = %s,
                email = %s,
                gst_number = %s,
                address = %s
            WHERE setting_id = %s
            """,
            (
                shop_name,
                owner_name or None,
                phone or None,
                email or None,
                gst_number or None,
                address or None,
                settings["setting_id"],
            ),
        )


        connection.commit()


        return jsonify(
            {
                "success": True,
                "message": (
                    "Shop details saved successfully."
                ),
            }
        )


    except Exception as error:

        connection.rollback()

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500


    finally:

        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# UPDATE INVENTORY SETTINGS
# ==========================================================


@app.route(
    "/api/settings/inventory",
    methods=["PUT"],
)
def update_inventory_settings():

    data = request.get_json(
        silent=True
    ) or {}


    try:

        low_stock_limit = float(
            data.get(
                "lowStockLimit",
                5,
            )
        )

    except (
        TypeError,
        ValueError,
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Low-stock limit must "
                    "be a valid number."
                ),
            }
        ), 400


    currency_symbol = str(
        data.get(
            "currencySymbol",
            "₹",
        )
    ).strip()


    date_format = str(
        data.get(
            "dateFormat",
            "DD-MM-YYYY",
        )
    ).strip()


    invoice_prefix = str(
        data.get(
            "invoicePrefix",
            "MM",
        )
    ).strip().upper()


    if low_stock_limit < 0:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Low-stock limit cannot "
                    "be negative."
                ),
            }
        ), 400


    valid_currencies = {
        "₹",
        "$",
        "€",
        "£",
    }


    if currency_symbol not in (
        valid_currencies
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid currency."
                ),
            }
        ), 400


    valid_date_formats = {
        "DD-MM-YYYY",
        "MM-DD-YYYY",
        "YYYY-MM-DD",
    }


    if date_format not in (
        valid_date_formats
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid date format."
                ),
            }
        ), 400


    if not invoice_prefix:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invoice prefix is required."
                ),
            }
        ), 400


    if len(invoice_prefix) > 10:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invoice prefix cannot "
                    "exceed 10 characters."
                ),
            }
        ), 400


    connection = get_database_connection()

    if connection is None:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Database connection failed."
                ),
            }
        ), 500


    cursor = None

    try:

        cursor = connection.cursor(
            dictionary=True
        )


        settings = get_or_create_settings(
            cursor,
            connection,
        )


        cursor.execute(
            """
            UPDATE app_settings
            SET
                low_stock_limit = %s,
                currency_symbol = %s,
                date_format = %s,
                invoice_prefix = %s
            WHERE setting_id = %s
            """,
            (
                low_stock_limit,
                currency_symbol,
                date_format,
                invoice_prefix,
                settings["setting_id"],
            ),
        )


        connection.commit()


        return jsonify(
            {
                "success": True,
                "message": (
                    "Inventory settings "
                    "saved successfully."
                ),
            }
        )


    except Exception as error:

        connection.rollback()

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500


    finally:

        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# CREATE DATABASE BACKUP
# ==========================================================


@app.route(
    "/api/backup",
    methods=["GET"],
)
def create_database_backup():

    connection = get_database_connection()

    if connection is None:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Database connection failed."
                ),
            }
        ), 500


    cursor = None

    try:

        cursor = connection.cursor(
            dictionary=True
        )


        backup_data = {}


        tables = [

            "suppliers",

            "products",

            "customers",

            "stock_in",

            "stock_out",

            "invoices",

            "invoice_items",

            "app_settings",

        ]


        for table_name in tables:

            cursor.execute(
                f"SELECT * FROM `{table_name}`"
            )

            rows = cursor.fetchall()


            for row in rows:

                for key, value in list(
                    row.items()
                ):

                    if isinstance(
                        value,
                        (
                            datetime,
                        )
                    ):

                        row[key] = (
                            value.isoformat()
                        )

                    elif hasattr(
                        value,
                        "isoformat",
                    ):

                        row[key] = (
                            value.isoformat()
                        )

                    elif hasattr(
                        value,
                        "as_tuple",
                    ):

                        row[key] = float(
                            value
                        )


            backup_data[
                table_name
            ] = rows


        return jsonify(
            {
                "success": True,
                "data": backup_data,
            }
        )


    except Exception as error:

        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500


    finally:

        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# RESTORE DATABASE BACKUP
# ==========================================================


@app.route(
    "/api/restore",
    methods=["POST"],
)
def restore_database_backup():

    backup = request.get_json(
        silent=True
    ) or {}


    if (
        backup.get("application")
        !=
        "Madha Marines Inventory System"
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Invalid Madha Marines "
                    "backup file."
                ),
            }
        ), 400


    data = backup.get("data")


    if not isinstance(
        data,
        dict,
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Backup data is missing "
                    "or invalid."
                ),
            }
        ), 400


    required_tables = {

        "suppliers",

        "products",

        "customers",

        "stock_in",

        "stock_out",

        "invoices",

        "invoice_items",

        "app_settings",

    }


    if not required_tables.issubset(
        set(data.keys())
    ):

        return jsonify(
            {
                "success": False,
                "message": (
                    "Backup file does not "
                    "contain all required data."
                ),
            }
        ), 400


    connection = get_database_connection()

    if connection is None:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Database connection failed."
                ),
            }
        ), 500


    cursor = None

    try:

        connection.start_transaction()

        cursor = connection.cursor()


        cursor.execute(
            "SET FOREIGN_KEY_CHECKS = 0"
        )


        delete_order = [

            "invoice_items",

            "invoices",

            "stock_out",

            "stock_in",

            "products",

            "customers",

            "suppliers",

            "app_settings",

        ]


        for table_name in delete_order:

            cursor.execute(
                f"DELETE FROM `{table_name}`"
            )


        insert_order = [

            "suppliers",

            "customers",

            "products",

            "stock_in",

            "stock_out",

            "invoices",

            "invoice_items",

            "app_settings",

        ]


        for table_name in insert_order:

            rows = data.get(
                table_name,
                [],
            )


            if not isinstance(
                rows,
                list,
            ):

                raise ValueError(
                    f"Invalid backup table: "
                    f"{table_name}"
                )


            for row in rows:

                if not isinstance(
                    row,
                    dict,
                ):

                    raise ValueError(
                        "Invalid backup row."
                    )


                columns = list(
                    row.keys()
                )


                if not columns:

                    continue


                column_sql = ", ".join(
                    f"`{column}`"
                    for column in columns
                )


                placeholders = ", ".join(
                    ["%s"] * len(columns)
                )


                values = [

                    row[column]
                    for column in columns

                ]


                cursor.execute(
                    (
                        f"INSERT INTO "
                        f"`{table_name}` "
                        f"({column_sql}) "
                        f"VALUES "
                        f"({placeholders})"
                    ),
                    tuple(values),
                )


        cursor.execute(
            "SET FOREIGN_KEY_CHECKS = 1"
        )


        connection.commit()


        return jsonify(
            {
                "success": True,
                "message": (
                    "Database backup restored "
                    "successfully."
                ),
            }
        )


    except Exception as error:

        connection.rollback()


        try:

            if cursor is not None:

                cursor.execute(
                    "SET FOREIGN_KEY_CHECKS = 1"
                )

        except Exception:

            pass


        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500


    finally:

        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ==========================================================
# RESET APPLICATION DATABASE DATA
# ==========================================================


@app.route(
    "/api/reset-data",
    methods=["DELETE"],
)
def reset_application_data():

    connection = get_database_connection()

    if connection is None:

        return jsonify(
            {
                "success": False,
                "message": (
                    "Database connection failed."
                ),
            }
        ), 500


    cursor = None

    try:

        connection.start_transaction()

        cursor = connection.cursor()


        cursor.execute(
            "SET FOREIGN_KEY_CHECKS = 0"
        )


        tables = [

            "invoice_items",

            "invoices",

            "stock_out",

            "stock_in",

            "products",

            "customers",

            "suppliers",

            "app_settings",

        ]


        for table_name in tables:

            cursor.execute(
                f"DELETE FROM `{table_name}`"
            )


        cursor.execute(
            """
            INSERT INTO app_settings (
                shop_name,
                low_stock_limit,
                currency_symbol,
                date_format,
                invoice_prefix
            )
            VALUES (
                'Madha Marines',
                5.00,
                '₹',
                'DD-MM-YYYY',
                'MM'
            )
            """
        )


        cursor.execute(
            "SET FOREIGN_KEY_CHECKS = 1"
        )


        connection.commit()


        return jsonify(
            {
                "success": True,
                "message": (
                    "All application data "
                    "has been reset successfully."
                ),
            }
        )


    except Exception as error:

        connection.rollback()


        try:

            if cursor is not None:

                cursor.execute(
                    "SET FOREIGN_KEY_CHECKS = 1"
                )

        except Exception:

            pass


        return jsonify(
            {
                "success": False,
                "message": str(error),
            }
        ), 500


    finally:

        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False,
        use_reloader=False,
    )