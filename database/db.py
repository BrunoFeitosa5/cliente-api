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

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS faq (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pergunta TEXT NOT NULL,
            resposta TEXT NOT NULL,
            categoria TEXT DEFAULT 'Geral',
            imagem_url TEXT,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS escalas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            colaborador_id INTEGER NOT NULL,
            data TEXT NOT NULL,
            horario_entrada TEXT NOT NULL,
            horario_saida TEXT NOT NULL,
            horas_extras INTEGER DEFAULT 0,
            folga INTEGER DEFAULT 0,
            FOREIGN KEY (colaborador_id) REFERENCES clientes(id)
        )
    """)

    for col, definition in [
        ("status", "TEXT DEFAULT 'offline'"),
        ("ultimo_acesso", "TEXT"),
        ("is_admin", "INTEGER DEFAULT 0")
    ]:
        try:
            cursor.execute(f"ALTER TABLE clientes ADD COLUMN {col} {definition}")
        except Exception:
            pass

    conn.commit()
    conn.close()