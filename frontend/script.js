let modoAdmin = false;


/* =========================
   TOAST
   ========================= */
function mostrarToast(msg, tipo = "sucesso") {
    const toastEl = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMsg");

    toastEl.classList.remove("bg-success", "bg-danger", "bg-warning");

    if (tipo === "erro") toastEl.classList.add("bg-danger");
    else if (tipo === "aviso") toastEl.classList.add("bg-warning");
    else toastEl.classList.add("bg-success");

    toastMsg.textContent = msg;

    bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000 }).show();
}


/* =========================
   ESTADO DA UI
   ========================= */
function atualizarUI(logado) {
    document.getElementById("loginBox").style.display = logado ? "none" : "block";
    document.getElementById("areaAdmin").style.display = logado ? "block" : "none";
    document.getElementById("containerSair").style.display = logado ? "block" : "none";
}


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
        mostrarToast(data.erro || "Erro ao fazer login", "erro");
        return;
    }

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("isAdmin", "true");
    modoAdmin = true;

    atualizarUI(true);
    carregarClientes();
}


/* =========================
   LOGOUT
   ========================= */
function logout() {
    if (!confirm("Deseja encerrar a sessão?")) return;

    modoAdmin = false;
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");

    atualizarUI(false);
    mostrarToast("Sessão encerrada.", "aviso");
    carregarClientes();
}


/* =========================
   CARREGAR CLIENTES
   ========================= */
async function carregarClientes() {
    const res = await fetch("/clientes");
    const data = await res.json();

    const tabela = document.getElementById("tabela");

    tabela.innerHTML = "";

    document.getElementById("totalClientes").innerText = data.clientes.length;
    document.getElementById("ultimaAtualizacao").innerText = new Date().toLocaleTimeString("pt-BR");

    data.clientes.forEach(c => {
        let botoes = "";

        if (modoAdmin) {
            botoes = `
                <div class="admin-actions">
                    <button class="btn btn-warning btn-sm" onclick="editarCliente(${c.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deletarCliente(${c.id})">Excluir</button>
                </div>
            `;
        }

        tabela.innerHTML += `
        <tr>
            <td>${c.id}</td>
            <td contenteditable="${modoAdmin}" id="nome-${c.id}">${c.nome}</td>
            <td contenteditable="${modoAdmin}" id="email-${c.id}">${c.email}</td>
            <td contenteditable="${modoAdmin}" id="telefone-${c.id}">${c.telefone}</td>
            <td contenteditable="${modoAdmin}" id="empresa-${c.id}">${c.empresa}</td>
            <td contenteditable="${modoAdmin}" id="horario-${c.id}">${c.horario}</td>
            <td>${botoes}</td>
        </tr>
        `;
    });
}


/* =========================
   CRIAR CLIENTE
   ========================= */
async function criarCliente() {
    const token = localStorage.getItem("token");

    const campos = ["nome", "email", "telefone", "empresa", "horario", "senha"];

    const cliente = {};
    campos.forEach(id => {
        cliente[id] = document.getElementById(id).value;
    });

    const res = await fetch("/clientes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(cliente)
    });

    if (!res.ok) {
        const data = await res.json();
        mostrarToast(data.erro || "Erro ao adicionar colaborador", "erro");
        return;
    }

    campos.forEach(id => {
        document.getElementById(id).value = "";
    });

    mostrarToast("Colaborador adicionado com sucesso!");
    carregarClientes();
}


/* =========================
   EDITAR CLIENTE
   ========================= */
async function editarCliente(id) {
    const token = localStorage.getItem("token");

    const cliente = {
        nome: document.getElementById(`nome-${id}`).innerText.trim(),
        email: document.getElementById(`email-${id}`).innerText.trim(),
        telefone: document.getElementById(`telefone-${id}`).innerText.trim(),
        empresa: document.getElementById(`empresa-${id}`).innerText.trim(),
        horario: document.getElementById(`horario-${id}`).innerText.trim()
    };

    const res = await fetch(`/clientes/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(cliente)
    });

    if (!res.ok) {
        mostrarToast("Erro ao atualizar colaborador", "erro");
        return;
    }

    mostrarToast("Colaborador atualizado com sucesso!");
    carregarClientes();
}


/* =========================
   DELETAR CLIENTE
   ========================= */
async function deletarCliente(id) {
    if (!confirm("Tem certeza que deseja excluir este colaborador?")) return;

    const token = localStorage.getItem("token");

    const res = await fetch(`/clientes/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
        mostrarToast("Erro ao excluir colaborador", "erro");
        return;
    }

    mostrarToast("Colaborador excluído.", "aviso");
    carregarClientes();
}


/* =========================
   INIT
   ========================= */
window.onload = () => {
    if (localStorage.getItem("isAdmin") === "true") {
        modoAdmin = true;
        atualizarUI(true);
    }
    carregarClientes();
};
