import os

import mysql.connector
from dotenv import load_dotenv
from mysql.connector import Error


# Load local variables from .env when running on your computer.
load_dotenv()


def get_database_connection():

    try:

        connection = mysql.connector.connect(

            # Railway variables are checked first.
            # Your local DB_* variables are used as fallback.

            host=os.getenv(
                "MYSQLHOST",
                os.getenv("DB_HOST", "127.0.0.1")
            ),

            port=int(
                os.getenv(
                    "MYSQLPORT",
                    os.getenv("DB_PORT", "3306")
                )
            ),

            user=os.getenv(
                "MYSQLUSER",
                os.getenv("DB_USER")
            ),

            password=os.getenv(
                "MYSQLPASSWORD",
                os.getenv("DB_PASSWORD")
            ),

            database=os.getenv(
                "MYSQLDATABASE",
                os.getenv("DB_NAME")
            ),

            connection_timeout=10
        )

        return connection

    except Error as error:

        print(
            f"Database connection failed: {error}"
        )

        return None