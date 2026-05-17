const API = "http://127.0.0.1:5000";

// =====================
// LISTAR
// =====================
async function listar() {
    try {
        let res = await fetch(`${API}/clientes`);
        let data = await res.json();

        let tabela = document.getElementById("tabela");
        tabela.innerHTML = "";

        (data.clientes || []).forEach(c => {
            tabela.innerHTML += `
                <tr>
                    <td>${c.id}</td>

                    <td><input value="${c.nome}" id="nome-${c.id}" class="form-control"></td>
                    <td><input value="${c.email}" id="email-${c.id}" class="form-control"></td>
                    <td><input value="${c.telefone}" id="telefone-${c.id}" class="form-control"></td>
                    <td><input value="${c.empresa}" id="empresa-${c.id}" class="form-control"></td>
                    <td><input value="${c.horario}" id="horario-${c.id}" class="form-control"></td>

                    <td>
                        <div class="action-btns">
                            <button class="btn btn-primary btn-sm" onclick="atualizar(${c.id})">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="deletar(${c.id})">Excluir</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        // atualizar contador do dashboard
        document.getElementById("totalClientes").innerText =
            (data.clientes || []).length;

    } catch (error) {
        console.log("Erro ao listar clientes:", error);
        alert("Erro ao carregar dados da API");
    }
}

// =====================
// CRIAR
// =====================
async function criarCliente() {

    try {
        let data = {
            nome: document.getElementById("nome").value,
            email: document.getElementById("email").value,
            telefone: document.getElementById("telefone").value,
            empresa: document.getElementById("empresa").value,
            horario: document.getElementById("horario").value,
            senha: document.getElementById("senha").value
        };

        await fetch(`${API}/clientes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        listar();
        alert("Cliente adicionado com sucesso!");

    } catch (error) {
        console.log(error);
        alert("Erro ao criar cliente");
    }
}

// =====================
// ATUALIZAR
// =====================
async function atualizar(id) {

    try {
        let data = {
            nome: document.getElementById(`nome-${id}`).value,
            email: document.getElementById(`email-${id}`).value,
            telefone: document.getElementById(`telefone-${id}`).value,
            empresa: document.getElementById(`empresa-${id}`).value,
            horario: document.getElementById(`horario-${id}`).value
        };

        await fetch(`${API}/clientes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        listar();
        alert("Atualizado com sucesso!");

    } catch (error) {
        console.log(error);
        alert("Erro ao atualizar cliente");
    }
}

// =====================
// DELETAR
// =====================
async function deletar(id) {

    try {
        await fetch(`${API}/clientes/${id}`, {
            method: "DELETE"
        });

        listar();
        alert("Cliente removido!");

    } catch (error) {
        console.log(error);
        alert("Erro ao deletar cliente");
    }
}

// iniciar
listar();