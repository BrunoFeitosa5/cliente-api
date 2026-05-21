from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from datetime import datetime

from database.db import get_connection
from models.cliente import validar_cliente
import bcrypt

import os
from anthropic import Anthropic

clientes_bp = Blueprint("clientes", __name__)

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


# =============================================================
# LOGIN
# =============================================================
@clientes_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    senha = data.get("senha")

    conn = get_connection()

    cliente = conn.execute(
        "SELECT * FROM clientes WHERE email=?",
        (email,)
    ).fetchone()

    conn.close()

    if not cliente:
        return jsonify({"erro": "Usuário não encontrado"}), 404

    cliente = dict(cliente)

    senha_hash = cliente["senha"].encode("utf-8")

    if not bcrypt.checkpw(
        senha.encode("utf-8"),
        senha_hash
    ):
        return jsonify({"erro": "Senha inválida"}), 401

    access_token = create_access_token(
        identity=str(cliente["id"])
    )

    return jsonify({
        "access_token": access_token
    }), 200


# =============================================================
# LISTAR CLIENTES
# =============================================================
@clientes_bp.route("/clientes", methods=["GET"])
def listar_clientes():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM clientes")

    clientes = cursor.fetchall()
    conn.close()

    resultado = []

    for c in clientes:
        cliente = dict(c)
        cliente.pop("senha", None)
        resultado.append(cliente)

    return jsonify({"clientes": resultado})


# =============================================================
# BUSCAR POR ID
# =============================================================
@clientes_bp.route("/clientes/<int:id>", methods=["GET"])
def buscar_cliente(id):

    conn = get_connection()

    cliente = conn.execute(
        "SELECT * FROM clientes WHERE id=?",
        (id,)
    ).fetchone()

    conn.close()

    if not cliente:
        return jsonify({"erro": "Cliente não encontrado"}), 404

    cliente = dict(cliente)
    cliente.pop("senha", None)

    return jsonify(cliente)


# =============================================================
# CRIAR CLIENTE
# =============================================================
@clientes_bp.route("/clientes", methods=["POST"])
@jwt_required()
def criar_cliente():

    data = request.json

    valido, msg = validar_cliente(data)

    if not valido:
        return jsonify({"erro": msg}), 400

    senha_hash = bcrypt.hashpw(
        data["senha"].encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO clientes
        (nome,email,telefone,empresa,horario,senha)
        VALUES (?,?,?,?,?,?)
    """, (
        data.get("nome"),
        data.get("email"),
        data.get("telefone"),
        data.get("empresa"),
        data.get("horario"),
        senha_hash
    ))

    conn.commit()
    conn.close()

    return jsonify({"mensagem": "Cliente criado"}), 201


# =============================================================
# EDITAR
# =============================================================
@clientes_bp.route("/clientes/<int:id>", methods=["PUT"])
@jwt_required()
def atualizar_cliente(id):

    data = request.json

    conn = get_connection()
    cursor = conn.cursor()

    cliente = cursor.execute(
        "SELECT * FROM clientes WHERE id=?",
        (id,)
    ).fetchone()

    if not cliente:
        conn.close()
        return jsonify({"erro": "Cliente não encontrado"}), 404

    cliente = dict(cliente)

    nome = data.get("nome", cliente["nome"])
    email = data.get("email", cliente["email"])
    telefone = data.get("telefone", cliente["telefone"])
    empresa = data.get("empresa", cliente["empresa"])
    horario = data.get("horario", cliente["horario"])

    cursor.execute("""
        UPDATE clientes
        SET nome=?, email=?, telefone=?, empresa=?, horario=?
        WHERE id=?
    """, (
        nome,
        email,
        telefone,
        empresa,
        horario,
        id
    ))

    conn.commit()
    conn.close()

    return jsonify({"mensagem": "Cliente atualizado"})


# =============================================================
# EXCLUIR
# =============================================================
@clientes_bp.route("/clientes/<int:id>", methods=["DELETE"])
@jwt_required()
def deletar_cliente(id):

    conn = get_connection()
    cursor = conn.cursor()

    cliente = cursor.execute(
        "SELECT * FROM clientes WHERE id=?",
        (id,)
    ).fetchone()

    if not cliente:
        conn.close()
        return jsonify({"erro": "Cliente não encontrado"}), 404

    cursor.execute(
        "DELETE FROM clientes WHERE id=?",
        (id,)
    )

    conn.commit()
    conn.close()

    return jsonify({"mensagem": "Cliente removido"})


# =============================================================
# COLABORADOR — LOGIN (marca como online)
# =============================================================
@clientes_bp.route("/colaborador/login", methods=["POST"])
def colaborador_login():

    data = request.get_json()
    email = data.get("email")
    senha = data.get("senha")

    conn = get_connection()
    cliente = conn.execute(
        "SELECT * FROM clientes WHERE email=?", (email,)
    ).fetchone()

    if not cliente:
        conn.close()
        return jsonify({"erro": "Usuário não encontrado"}), 404

    cliente = dict(cliente)

    if not bcrypt.checkpw(senha.encode("utf-8"), cliente["senha"].encode("utf-8")):
        conn.close()
        return jsonify({"erro": "Senha inválida"}), 401

    agora = datetime.now().strftime("%d/%m/%Y %H:%M")

    conn.execute(
        "UPDATE clientes SET status='online', ultimo_acesso=? WHERE id=?",
        (agora, cliente["id"])
    )
    conn.commit()
    conn.close()

    access_token = create_access_token(identity=str(cliente["id"]))

    return jsonify({
        "access_token": access_token,
        "nome": cliente["nome"],
        "id": cliente["id"]
    }), 200


# =============================================================
# COLABORADOR — LOGOUT (marca como offline)
# =============================================================
@clientes_bp.route("/colaborador/logout", methods=["POST"])
@jwt_required()
def colaborador_logout():

    user_id = get_jwt_identity()

    conn = get_connection()
    conn.execute("UPDATE clientes SET status='offline' WHERE id=?", (user_id,))
    conn.commit()
    conn.close()

    return jsonify({"mensagem": "Offline"}), 200


# =============================================================
# RELATÓRIOS
# =============================================================
@clientes_bp.route("/api/relatorios", methods=["GET"])
def relatorios():

    conn = get_connection()

    total = conn.execute("SELECT COUNT(*) as t FROM clientes").fetchone()["t"]
    online = conn.execute("SELECT COUNT(*) as t FROM clientes WHERE status='online'").fetchone()["t"]

    recentes = conn.execute("""
        SELECT id, nome, empresa, horario, status, ultimo_acesso
        FROM clientes
        ORDER BY CASE WHEN status='online' THEN 0 ELSE 1 END, nome
    """).fetchall()

    conn.close()

    return jsonify({
        "total": total,
        "online": online,
        "offline": total - online,
        "colaboradores": [dict(r) for r in recentes]
    })


# =============================================================
# IA (CLAUDE)
# =============================================================
@clientes_bp.route("/ia", methods=["POST"])
def ia():

    data = request.get_json()
    prompt = data.get("prompt")

    if not prompt:
        return jsonify({"erro": "Prompt vazio"}), 400

    try:
        response = client.messages.create(
    model="claude-3-haiku-20240307",
    max_tokens=500,
    messages=[
        {"role": "user", "content": prompt}
    ]
)
        return jsonify({
            "resposta": response.content[0].text
        })

    except Exception as e:
        print("ERRO IA:", e)

        return jsonify({
            "erro": str(e)
        }), 500