# =============================================================
# models/cliente.py — Modelo de dados do Cliente
# =============================================================
# Um "Model" define a estrutura e as regras de um dado.
# Aqui dizemos: "Um cliente TEM nome, email, telefone e empresa"
# e também validamos se os dados recebidos estão corretos.
# =============================================================

from datetime import datetime


class Cliente:
    """
    Representa um Cliente no sistema.
    
    Atributos:
        id       → número único (gerado automaticamente)
        nome     → nome completo (obrigatório)
        email    → email de contato (obrigatório)
        telefone → telefone com DDD (opcional)
        empresa  → empresa onde trabalha (opcional)
        criado_em → data/hora do cadastro (automático)
    """

    def __init__(self, id, nome, email, telefone=None, empresa=None, cargo=None,):
        self.id = id
        self.nome = nome
        self.email = email
        self.telefone = telefone
        self.empresa = empresa
        self.cargo = cargo
        # Registra quando o cliente foi criado (timestamp automático)
        self.criado_em = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    def para_dict(self):
        """
        Converte o objeto Cliente em um dicionário Python.
        Necessário para o Flask transformar em JSON na resposta.
        
        Exemplo de retorno:
        {
            "id": 1,
            "nome": "Ana Silva",
            "email": "ana@empresa.com",
            ...
        }
        """
        return {
            "id": self.id,
            "nome": self.nome,
            "email": self.email,
            "telefone": self.telefone,
            "empresa": self.empresa,
            "cargo": self.cargo,
            "criado_em": self.criado_em,
        }


# =============================================================
# models/cliente.py — Validação do Cliente
# =============================================================

def validar_cliente(data):
    obrigatorios = ["nome", "email", "senha", "horario"]

    for campo in obrigatorios:
        if campo not in data or not data[campo]:
            return False, f"Campo {campo} é obrigatório"

    return True, "OK"