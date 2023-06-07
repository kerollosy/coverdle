from psycopg2 import pool
import os


def create_connection(DB_host, DB_name, DB_user, DB_password, DB_port=5432):
    return pool.SimpleConnectionPool(
        minconn=1,
        maxconn=10,
        host=DB_host,
        dbname=DB_name,
        user=DB_user,
        password=DB_password,
        port=DB_port,
        sslmode="require",
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5
    )


def get_connection(conn_pool):
    return conn_pool.getconn()


def release_connection(conn_pool, conn):
    conn_pool.putconn(conn)


connection_pool = create_connection(os.environ.get("POSTGRES_HOST"), os.environ.get("POSTGRES_DATABASE"),
                                    os.environ.get("POSTGRES_USER"), os.environ.get("POSTGRES_PASSWORD"))


conn = get_connection(connection_pool)
# Initialize the puzzles table
with conn.cursor() as cursor:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS puzzles (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL UNIQUE,
            answer TEXT NOT NULL,
            cover_url TEXT NOT NULL,
            album_url TEXT NOT NULL
        )
        """
    )
    conn.commit()


# Initialize the emails table
with conn.cursor() as cursor:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS emails (
            id SERIAL PRIMARY KEY,
            subject TEXT NOT NULL,
            content TEXT NOT NULL,
            email TEXT NOT NULL,
            date TIMESTAMP NOT NULL,
            is_read BOOLEAN NOT NULL
        )
        """
    )
    conn.commit()

release_connection(connection_pool, conn)
