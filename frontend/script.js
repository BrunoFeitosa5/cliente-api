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
    document.getElementById("areaFaq").style.display = logado ? "block" : "none";
    document.getElementById("areaEscala").style.display = logado ? "block" : "none";
    document.getElementById("containerSair").style.display = logado ? "block" : "none";
    if (logado) carregarFaq();
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
   BASE DE CONHECIMENTO (FAQ)
   ========================= */
let faqDados = [];

async function carregarFaq() {
    const res = await fetch("/faq");
    const data = await res.json();
    faqDados = data.faq || [];
    renderizarFaq(faqDados);
}

function filtrarFaq() {
    const busca = document.getElementById("faqBusca").value.toLowerCase();
    const filtrado = faqDados.filter(f =>
        f.pergunta.toLowerCase().includes(busca) ||
        f.resposta.toLowerCase().includes(busca) ||
        f.categoria.toLowerCase().includes(busca)
    );
    renderizarFaq(filtrado);
}

function renderizarFaq(lista) {
    const container = document.getElementById("listaFaq");

    if (!lista.length) {
        container.innerHTML = `<p style="color:#555; font-size:14px;">Nenhuma entrada cadastrada.</p>`;
        return;
    }

    const categorias = [...new Set(lista.map(f => f.categoria))];

    container.innerHTML = categorias.map(cat => `
        <div class="mb-4">
            <div class="faq-categoria-label">${cat}</div>
            ${lista.filter(f => f.categoria === cat).map(f => `
            <div class="faq-card">
                <div class="faq-pergunta">❓ ${f.pergunta}</div>
                <div class="faq-resposta">${f.resposta}</div>
                ${f.imagem_url ? `<img src="${f.imagem_url}" class="faq-imagem" onerror="this.style.display='none'">` : ''}
                <div class="d-flex gap-2 mt-2">
                    <button class="btn btn-warning btn-sm" onclick="editarFaq(${f.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deletarFaq(${f.id})">Excluir</button>
                </div>
            </div>`).join('')}
        </div>
    `).join('');
}

function toggleFormFaq() {
    const form = document.getElementById("formFaq");
    form.style.display = form.style.display === "none" ? "block" : "none";
    cancelarFaq();
}

function cancelarFaq() {
    document.getElementById("faqId").value = "";
    document.getElementById("faqPergunta").value = "";
    document.getElementById("faqResposta").value = "";
    document.getElementById("faqCategoria").value = "";
    document.getElementById("faqImagem").value = "";
}

function editarFaq(id) {
    const f = faqDados.find(x => x.id === id);
    if (!f) return;

    document.getElementById("faqId").value = f.id;
    document.getElementById("faqPergunta").value = f.pergunta;
    document.getElementById("faqResposta").value = f.resposta;
    document.getElementById("faqCategoria").value = f.categoria;
    document.getElementById("faqImagem").value = f.imagem_url || "";
    document.getElementById("formFaq").style.display = "block";
    document.getElementById("formFaq").scrollIntoView({ behavior: "smooth" });
}

async function salvarFaq() {
    const token = localStorage.getItem("token");
    const id = document.getElementById("faqId").value;
    const body = {
        pergunta: document.getElementById("faqPergunta").value,
        resposta: document.getElementById("faqResposta").value,
        categoria: document.getElementById("faqCategoria").value || "Geral",
        imagem_url: document.getElementById("faqImagem").value
    };

    if (!body.pergunta || !body.resposta) {
        mostrarToast("Preencha a pergunta e a resposta.", "aviso");
        return;
    }

    const url = id ? `/admin/faq/${id}` : "/admin/faq";
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        mostrarToast("Erro ao salvar.", "erro");
        return;
    }

    cancelarFaq();
    document.getElementById("formFaq").style.display = "none";
    mostrarToast(id ? "Entrada atualizada!" : "Entrada criada!");
    carregarFaq();
}

async function deletarFaq(id) {
    if (!confirm("Excluir esta entrada da base de conhecimento?")) return;

    const token = localStorage.getItem("token");

    const res = await fetch(`/admin/faq/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
        mostrarToast("Erro ao excluir.", "erro");
        return;
    }

    mostrarToast("Entrada removida.", "aviso");
    carregarFaq();
}


/* =========================
   IMPORTAR ESCALA
   ========================= */
async function importarEscala() {
    const token = localStorage.getItem("token");
    const mes = parseInt(document.getElementById("escMes").value);
    const ano = parseInt(document.getElementById("escAno").value);
    const texto = document.getElementById("escTexto").value;

    if (!texto.trim()) {
        mostrarToast("Cole o conteúdo da planilha primeiro.", "aviso");
        return;
    }

    const res = await fetch("/admin/escala/importar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ texto, mes, ano })
    });

    const data = await res.json();

    if (!res.ok) {
        mostrarToast(data.erro || "Erro ao importar", "erro");
        return;
    }

    let msg = `${data.salvos} entrada(s) importada(s).`;
    if (data.nao_encontrados.length > 0) {
        msg += ` Não encontrados: ${data.nao_encontrados.join(", ")}.`;
    }

    document.getElementById("escResultado").innerHTML =
        `<small style="color:#00ff88;">${msg}</small>`;
    mostrarToast("Escala importada com sucesso!");
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
