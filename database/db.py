import sqlite3

DB_PATH = "database/clientes.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            telefone TEXT,
            empresa TEXT,
            horario TEXT,
            senha TEXT NOT NULL,
            status TEXT DEFAULT 'offline',
            ultimo_acesso TEXT
        )
    """)

    for col, definition in [("status", "TEXT DEFAULT 'offline'"), ("ultimo_acesso", "TEXT")]:
        try:
            cursor.execute(f"ALTER TABLE clientes ADD COLUMN {col} {definition}")
        except Exception:
            pass

    conn.commit()
    conn.close()