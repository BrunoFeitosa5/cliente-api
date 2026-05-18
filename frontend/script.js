
async function fazerLogin() {

    const email =
    document.getElementById("loginEmail").value;

    const senha =
    document.getElementById("loginSenha").value;

    const res = await fetch("/login", {

        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            email,
            senha
        })

    });

    const data = await res.json();

    if (res.ok) {

        localStorage.setItem("token", data.access_token);

        // define tipo usuário
        if (email === "admin@renov.com") {
            localStorage.setItem("tipoUsuario", "admin");
        } else {
            localStorage.setItem("tipoUsuario", "usuario");
        }

        atualizarUI();

        carregarClientes();

        alert("Login realizado");

    } else {
        alert(data.erro);
    }
}



function sair() {

    const tipo = localStorage.getItem("tipoUsuario");

    localStorage.removeItem("token");
    localStorage.removeItem("tipoUsuario");

    atualizarUI();

    if (tipo === "admin") {
        location.reload();
    } else {
        window.location.href = "https://www.google.com/search";
    }
}



function atualizarUI() {

    const token = localStorage.getItem("token");
    const tipo = localStorage.getItem("tipoUsuario");

    const areaSair = document.getElementById("areaSair");
    const areaAdmin = document.getElementById("areaAdmin");

    if (!areaSair || !areaAdmin) return;

    // botão sair SEMPRE que logado
    if (token) {
        areaSair.style.display = "block";
    } else {
        areaSair.style.display = "none";
    }

    // admin vê painel
    if (tipo === "admin") {
        areaAdmin.style.display = "block";
    } else {
        areaAdmin.style.display = "none";
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
    const tipo = localStorage.getItem("tipoUsuario");

    clientes.forEach(c => {

        let botoes = "";

        if (token && tipo === "admin") {

            botoes = `
                <button class="btn btn-warning btn-sm"
                onclick="editarCliente(${c.id})">Editar</button>

                <button class="btn btn-danger btn-sm"
                onclick="deletarCliente(${c.id})">Excluir</button>
            `;
        }

        tabela.innerHTML += `
        <tr>

        <td>${c.id}</td>

        <td contenteditable="${tipo === "admin"}" id="nome-${c.id}">
        ${c.nome}
        </td>

        <td contenteditable="${tipo === "admin"}" id="email-${c.id}">
        ${c.email}
        </td>

        <td contenteditable="${tipo === "admin"}" id="telefone-${c.id}">
        ${c.telefone}
        </td>

        <td contenteditable="${tipo === "admin"}" id="empresa-${c.id}">
        ${c.empresa}
        </td>

        <td contenteditable="${tipo === "admin"}" id="horario-${c.id}">
        ${c.horario}
        </td>

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

    alert("Atualizado");

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



// 🔥 INICIALIZAÇÃO CORRETA (ESSENCIAL)
window.onload = function () {
    atualizarUI();
    carregarClientes();
};