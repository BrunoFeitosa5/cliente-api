from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required
)

from database.db import get_connection
from models.cliente import validar_cliente
import bcrypt

clientes_bp = Blueprint("clientes", __name__)


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
        return jsonify({
            "erro": "Usuário não encontrado"
        }), 404

    cliente = dict(cliente)

    # Converter senha do banco para bytes
    senha_hash = cliente["senha"].encode("utf-8")

    if not bcrypt.checkpw(
        senha.encode("utf-8"),
        senha_hash
    ):
        return jsonify({
            "erro": "Senha inválida"
        }), 401

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

    cursor.execute(
        "SELECT * FROM clientes"
    )

    clientes = cursor.fetchall()

    conn.close()

    resultado=[]

    for c in clientes:

        cliente=dict(c)

        cliente.pop(
            "senha",
            None
        )

        resultado.append(
            cliente
        )


    return jsonify({
        "clientes":resultado
    })


# =============================================================
# BUSCAR POR ID
# =============================================================
@clientes_bp.route("/clientes/<int:id>", methods=["GET"])
def buscar_cliente(id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM clientes WHERE id=?",
        (id,)
    )

    cliente = cursor.fetchone()

    conn.close()

    if not cliente:

        return jsonify({
            "erro":"Cliente não encontrado"
        }),404


    cliente=dict(cliente)

    cliente.pop(
        "senha",
        None
    )

    return jsonify(cliente)


# =============================================================
# CRIAR CLIENTE
# SOMENTE ADMIN
# =============================================================
@clientes_bp.route("/clientes", methods=["POST"])
@jwt_required()
def criar_cliente():

    data=request.json

    valido,msg=validar_cliente(
        data
    )

    if not valido:

        return jsonify({
            "erro":msg
        }),400


    senha_hash=bcrypt.hashpw(

        data["senha"].encode(
            "utf-8"
        ),

        bcrypt.gensalt()

    ).decode(
        "utf-8"
    )


    conn=get_connection()

    cursor=conn.cursor()


    cursor.execute("""

    INSERT INTO clientes
    (nome,email,telefone,empresa,horario,senha)

    VALUES (?,?,?,?,?,?)

    """,(

        data.get("nome"),
        data.get("email"),
        data.get("telefone"),
        data.get("empresa"),
        data.get("horario"),
        senha_hash

    ))


    conn.commit()

    conn.close()


    return jsonify({
        "mensagem":"Cliente criado"
    }),201


# =============================================================
# EDITAR
# SOMENTE ADMIN
# =============================================================
@clientes_bp.route("/clientes/<int:id>", methods=["PUT"])
@jwt_required()
def atualizar_cliente(id):

    data=request.json

    conn=get_connection()

    cursor=conn.cursor()

    cursor.execute(
        "SELECT * FROM clientes WHERE id=?",
        (id,)
    )

    cliente=cursor.fetchone()

    if not cliente:

        conn.close()

        return jsonify({
            "erro":"Cliente não encontrado"
        }),404


    cliente=dict(cliente)


    nome=data.get(
        "nome",
        cliente["nome"]
    )

    email=data.get(
        "email",
        cliente["email"]
    )

    telefone=data.get(
        "telefone",
        cliente["telefone"]
    )

    empresa=data.get(
        "empresa",
        cliente["empresa"]
    )

    horario=data.get(
        "horario",
        cliente["horario"]
    )


    cursor.execute("""

    UPDATE clientes

    SET

    nome=?,
    email=?,
    telefone=?,
    empresa=?,
    horario=?

    WHERE id=?

    """,(

        nome,
        email,
        telefone,
        empresa,
        horario,
        id

    ))


    conn.commit()

    conn.close()


    return jsonify({
        "mensagem":"Cliente atualizado"
    })


# =============================================================
# EXCLUIR
# SOMENTE ADMIN
# =============================================================
@clientes_bp.route("/clientes/<int:id>", methods=["DELETE"])
@jwt_required()
def deletar_cliente(id):

    conn=get_connection()

    cursor=conn.cursor()

    cursor.execute(
        "SELECT * FROM clientes WHERE id=?",
        (id,)
    )

    cliente=cursor.fetchone()


    if not cliente:

        conn.close()

        return jsonify({
            "erro":"Cliente não encontrado"
        }),404


    cursor.execute(
        "DELETE FROM clientes WHERE id=?",
        (id,)
    )


    conn.commit()

    conn.close()


    return jsonify({
        "mensagem":"Cliente removido"
    })