from werkzeug.security import generate_password_hash

from database import get_database_connection


username = "admin"

password = "Admin@123"

full_name = "Administrator"


connection = get_database_connection()

if connection is None:
    print("Database connection failed.")
    exit()


cursor = None

try:

    cursor = connection.cursor()

    password_hash = generate_password_hash(
        password
    )

    cursor.execute(
        """
        INSERT INTO admins (
            username,
            password_hash,
            full_name,
            status
        )
        VALUES (%s, %s, %s, 'Active')
        """,
        (
            username,
            password_hash,
            full_name,
        ),
    )

    connection.commit()

    print("Admin account created successfully.")

except Exception as error:

    connection.rollback()

    print(
        "Error:",
        error,
    )

finally:

    if cursor is not None:
        cursor.close()

    if (
        connection is not None
        and connection.is_connected()
    ):
        connection.close()