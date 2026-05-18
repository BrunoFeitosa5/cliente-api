async function fazerLogin() {

    const email = document.getElementById("loginEmail").value;
    const senha = document.getElementById("loginSenha").value;

    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
    });

    const data = await res.json();

    if (res.ok) {

        localStorage.setItem("token", data.access_token);
        localStorage.setItem("tipoUsuario", "admin");

        document.getElementById("areaAdmin").style.display = "block";

        carregarClientes();

        alert("Login realizado com sucesso");

    } else {
        alert(data.erro);
    }
}

function sair() {

    const tipo = localStorage.getItem("tipoUsuario");

    // limpa tudo
    localStorage.removeItem("token");
    localStorage.removeItem("tipoUsuario");

    // limpa inputs login
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginSenha").value = "";

    // esconde área admin
    document.getElementById("areaAdmin").style.display = "none";

    // recarrega lista SEM permissões
    carregarClientes();

    // comportamento diferente por tipo
    if (tipo === "admin") {

        alert("Você saiu do modo administrador");

    } else {

        window.location.href = "https://www.google.com/search?q=";
    }
}

async function carregarClientes() {

    const res = await fetch("/clientes");
    const data = await res.json();

    const clientes = data.clientes;

    const tabela = document.getElementById("tabela");
    const total = document.getElementById("totalClientes");

    tabela.innerHTML = "";
    total.innerText = clientes.length;

    const token = localStorage.getItem("token");

    clientes.forEach(c => {

        let botoes = "";

        if (token) {
            botoes = `
                <button class="btn btn-warning btn-sm" onclick="editarCliente(${c.id})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deletarCliente(${c.id})">Excluir</button>
            `;
        }

        tabela.innerHTML += `
            <tr>
                <td>${c.id}</td>
                <td>${c.nome}</td>
                <td>${c.email}</td>
                <td>${c.telefone}</td>
                <td>${c.empresa}</td>
                <td>${c.horario}</td>
                <td>${botoes}</td>
            </tr>
        `;
    });
}

async function criarCliente() {

    const token = localStorage.getItem("token");

    const cliente = {
        nome: document.getElementById("nome").value,
        email: document.getElementById("email").value,
        telefone: document.getElementById("telefone").value,
        empresa: document.getElementById("empresa").value,
        horario: document.getElementById("horario").value,
        senha: document.getElementById("senha").value
    };

    await fetch("/clientes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(cliente)
    });

    carregarClientes();
}

async function editarCliente(id) {

    const token = localStorage.getItem("token");

    const cliente = {
        nome: document.getElementById(`nome-${id}`).innerText,
        email: document.getElementById(`email-${id}`).innerText,
        telefone: document.getElementById(`telefone-${id}`).innerText,
        empresa: document.getElementById(`empresa-${id}`).innerText,
        horario: document.getElementById(`horario-${id}`).innerText
    };

    await fetch(`/clientes/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(cliente)
    });

    carregarClientes();
}

async function deletarCliente(id) {

    const token = localStorage.getItem("token");

    await fetch(`/clientes/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    carregarClientes();
}

// inicialização
carregarClientes();