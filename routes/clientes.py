from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from datetime import datetime, date as date_cls
import re

from database.db import get_connection
from models.cliente import validar_cliente
import bcrypt

import os
from anthropic import Anthropic
from groq import Groq

clientes_bp = Blueprint("clientes", __name__)

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def parse_escala(texto, ano, mes):
    linhas = texto.strip().split('\n')
    resultado = []
    semana_dias = {}

    for linha in linhas:
        if '\t' in linha:
            colunas = linha.split('\t')
        else:
            colunas = re.split(r' {3,}', linha)
        colunas = [c.strip() for c in colunas]

        if not any(colunas):
            continue

        joined = ' '.join(colunas).lower()
        if any(d in joined for d in ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']):
            continue

        if not colunas[0] and any(
            i < len(colunas) and colunas[i].isdigit() for i in range(1, 8)
        ):
            semana_dias = {}
            for i in range(1, min(8, len(colunas))):
                if colunas[i].isdigit():
                    try:
                        semana_dias[i] = date_cls(ano, mes, int(colunas[i])).isoformat()
                    except ValueError:
                        pass
            continue

        time_match = re.match(r'^(\d{1,2}:\d{2})\s*\|\s*(\d{1,2}:\d{2})$', colunas[0])
        if time_match and semana_dias:
            entrada = time_match.group(1).zfill(5)
            saida = time_match.group(2).zfill(5)

            for col_idx, data_iso in semana_dias.items():
                if col_idx >= len(colunas):
                    continue
                cell = colunas[col_idx]
                if not cell:
                    continue
                if re.match(r'^\d{1,2}:\d{2}\s*\|\s*\d{1,2}:\d{2}$', cell):
                    continue

                folga = '(folga)' in cell.lower()
                horas_extras = 0
                m = re.search(r'\(\+(\d+)\)', cell)
                if m:
                    horas_extras = int(m.group(1))

                nome = re.sub(r'\s*\(.*?\)', '', cell).strip()
                if nome:
                    resultado.append({
                        'nome': nome,
                        'data': data_iso,
                        'horario_entrada': entrada,
                        'horario_saida': saida,
                        'horas_extras': horas_extras,
                        'folga': folga
                    })

    return resultado


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

    if not cliente.get("is_admin"):
        return jsonify({"erro": "Acesso restrito. Use a Área do Colaborador."}), 403

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

    senha_hash = cliente["senha"]
    if isinstance(senha_hash, str):
        senha_hash = senha_hash.encode("utf-8")

    if not bcrypt.checkpw(senha.encode("utf-8"), senha_hash):
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
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            max_tokens=400,
            temperature=0.5,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Você é um assistente de pesquisa da equipe Apoio Renov Smart. "
                        "Responda apenas perguntas informativas, de pesquisa ou dúvidas do dia a dia. "
                        "Seja direto e conciso. Não execute tarefas complexas, não escreva código, "
                        "não crie documentos longos. Responda sempre em português brasileiro."
                    )
                },
                {"role": "user", "content": prompt}
            ]
        )
        return jsonify({"resposta": response.choices[0].message.content})

    except Exception as e:
        print("ERRO IA:", e)
        return jsonify({"erro": str(e)}), 500


# =============================================================
# ESCALA — IMPORTAR (admin)
# =============================================================
@clientes_bp.route("/admin/escala/importar", methods=["POST"])
@jwt_required()
def importar_escala():
    data = request.get_json()
    texto = data.get("texto", "")
    mes = int(data.get("mes"))
    ano = int(data.get("ano"))

    entradas = parse_escala(texto, ano, mes)

    conn = get_connection()

    inicio = f"{ano}-{mes:02d}-01"
    fim = f"{ano}-{mes:02d}-31"
    conn.execute("DELETE FROM escalas WHERE data >= ? AND data <= ?", (inicio, fim))

    nao_encontrados = []
    salvos = 0

    for e in entradas:
        colab = conn.execute(
            "SELECT id FROM clientes WHERE LOWER(nome) LIKE ?",
            (f"%{e['nome'].lower()}%",)
        ).fetchone()

        if not colab:
            if e['nome'] not in nao_encontrados:
                nao_encontrados.append(e['nome'])
            continue

        conn.execute("""
            INSERT INTO escalas (colaborador_id, data, horario_entrada, horario_saida, horas_extras, folga)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (colab["id"], e["data"], e["horario_entrada"], e["horario_saida"], e["horas_extras"], 1 if e["folga"] else 0))
        salvos += 1

    conn.commit()
    conn.close()

    return jsonify({"salvos": salvos, "nao_encontrados": nao_encontrados})


# =============================================================
# ESCALA — BUSCAR DO COLABORADOR LOGADO
# =============================================================
@clientes_bp.route("/colaborador/escala", methods=["GET"])
@jwt_required()
def minha_escala():
    user_id = get_jwt_identity()
    mes = request.args.get("mes")

    conn = get_connection()

    if mes:
        ano, m = mes.split("-")
        inicio = f"{ano}-{m.zfill(2)}-01"
        fim = f"{ano}-{m.zfill(2)}-31"
        rows = conn.execute("""
            SELECT * FROM escalas
            WHERE colaborador_id = ? AND data >= ? AND data <= ?
            ORDER BY data
        """, (user_id, inicio, fim)).fetchall()
    else:
        rows = conn.execute("""
            SELECT * FROM escalas WHERE colaborador_id = ? ORDER BY data
        """, (user_id,)).fetchall()

    conn.close()
    return jsonify({"escala": [dict(r) for r in rows]})


# =============================================================
# PERFIL — BUSCAR
# =============================================================
@clientes_bp.route("/colaborador/perfil", methods=["GET"])
@jwt_required()
def meu_perfil():
    user_id = get_jwt_identity()

    conn = get_connection()
    colab = conn.execute("SELECT * FROM clientes WHERE id=?", (user_id,)).fetchone()
    conn.close()

    if not colab:
        return jsonify({"erro": "Usuário não encontrado"}), 404

    colab = dict(colab)
    colab.pop("senha", None)
    return jsonify(colab)


# =============================================================
# PERFIL — ATUALIZAR
# =============================================================
@clientes_bp.route("/colaborador/perfil", methods=["PUT"])
@jwt_required()
def atualizar_perfil():
    user_id = get_jwt_identity()
    data = request.get_json()

    conn = get_connection()
    conn.execute(
        "UPDATE clientes SET nome=?, telefone=?, horario=? WHERE id=?",
        (data.get("nome"), data.get("telefone"), data.get("horario"), user_id)
    )
    conn.commit()
    conn.close()

    return jsonify({"mensagem": "Perfil atualizado"})


# =============================================================
# SENHA — TROCAR
# =============================================================
@clientes_bp.route("/colaborador/senha", methods=["PUT"])
@jwt_required()
def trocar_senha():
    user_id = get_jwt_identity()
    data = request.get_json()

    senha_atual = data.get("senha_atual", "")
    nova_senha = data.get("nova_senha", "")

    conn = get_connection()
    colab = conn.execute("SELECT * FROM clientes WHERE id=?", (user_id,)).fetchone()

    if not colab:
        conn.close()
        return jsonify({"erro": "Usuário não encontrado"}), 404

    colab = dict(colab)
    senha_hash = colab["senha"]
    if isinstance(senha_hash, str):
        senha_hash = senha_hash.encode("utf-8")

    if not bcrypt.checkpw(senha_atual.encode("utf-8"), senha_hash):
        conn.close()
        return jsonify({"erro": "Senha atual incorreta"}), 401

    nova_hash = bcrypt.hashpw(nova_senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    conn.execute("UPDATE clientes SET senha=? WHERE id=?", (nova_hash, user_id))
    conn.commit()
    conn.close()

    return jsonify({"mensagem": "Senha alterada com sucesso"})


# =============================================================
# COLEGAS — LISTAR
# =============================================================
@clientes_bp.route("/colaborador/colegas", methods=["GET"])
@jwt_required()
def colegas():
    user_id = get_jwt_identity()

    conn = get_connection()
    rows = conn.execute("""
        SELECT id, nome, empresa, status, ultimo_acesso
        FROM clientes WHERE id != ?
        ORDER BY CASE WHEN status='online' THEN 0 ELSE 1 END, nome
    """, (user_id,)).fetchall()
    conn.close()

    return jsonify({"colegas": [dict(r) for r in rows]})