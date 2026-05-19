let modoAdmin = false;

/* =========================
   LOGIN
   ========================= */
async function fazerLogin() {

    const email = document.getElementById("loginEmail").value;
    const senha = document.getElementById("loginSenha").value;

    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.erro);
        return;
    }

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("isAdmin", "true");

    modoAdmin = true;

    document.getElementById("areaAdmin").style.display = "block";

    carregarClientes();
}


/* =========================
   LOGOUT (2 ETAPAS)
   ========================= */
function logout() {

    if (modoAdmin) {

        modoAdmin = false;
        localStorage.setItem("isAdmin", "false");

        document.getElementById("areaAdmin").style.display = "none";

        carregarClientes();

        return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");

    window.location.href = "https://www.google.com";
}


/* =========================
   CARREGAR CLIENTES
   ========================= */
async function carregarClientes() {

    const res = await fetch("/clientes");
    const data = await res.json();

    const tabela = document.getElementById("tabela");
    const total = document.getElementById("totalClientes");

    tabela.innerHTML = "";
    total.innerText = data.clientes.length;

    const isAdmin = localStorage.getItem("isAdmin") === "true";

    data.clientes.forEach(c => {

        let botoes = "";

        if (isAdmin) {
            botoes = `
                <div class="admin-actions">

                    <button class="btn btn-warning btn-sm" onclick="editarCliente(${c.id})">
                        ✏ Editar
                    </button>

                    <button class="btn btn-danger btn-sm" onclick="deletarCliente(${c.id})">
                        🗑 Excluir
                    </button>

                </div>
            `;
        }

        tabela.innerHTML += `
        <tr>
            <td>${c.id}</td>

            <td contenteditable="${isAdmin}" id="nome-${c.id}">
                ${c.nome}
            </td>

            <td contenteditable="${isAdmin}" id="email-${c.id}">
                ${c.email}
            </td>

            <td contenteditable="${isAdmin}" id="telefone-${c.id}">
                ${c.telefone}
            </td>

            <td contenteditable="${isAdmin}" id="empresa-${c.id}">
                ${c.empresa}
            </td>

            <td contenteditable="${isAdmin}" id="horario-${c.id}">
                ${c.horario}
            </td>

            <td>
                ${botoes}
            </td>
        </tr>
        `;
    });
}


/* =========================
   CRIAR CLIENTE
   ========================= */
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


/* =========================
   EDITAR CLIENTE
   ========================= */
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

    alert("Atualizado com sucesso");

    carregarClientes();
}


/* =========================
   DELETAR CLIENTE
   ========================= */
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


/* =========================
   INIT
   ========================= */
window.onload = () => {

    if (localStorage.getItem("isAdmin") === "true") {
        modoAdmin = true;
        document.getElementById("areaAdmin").style.display = "block";
    }

    carregarClientes();
};