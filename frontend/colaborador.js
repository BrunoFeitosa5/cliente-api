const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES_NOME = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

let escalaMes = new Date().getMonth() + 1;
let escalaAno = new Date().getFullYear();


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
   LOGIN / LOGOUT
   ========================= */
async function entrarColab() {
    const email = document.getElementById("colabEmail").value;
    const senha = document.getElementById("colabSenha").value;

    const res = await fetch("/colaborador/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
    });

    const data = await res.json();

    if (!res.ok) {
        mostrarToast(data.erro || "Erro ao entrar", "erro");
        return;
    }

    localStorage.setItem("colabToken", data.access_token);
    localStorage.setItem("colabNome", data.nome);
    localStorage.setItem("colabId", data.id);

    mostrarAreaLogado(data.nome);
}


async function sairColab() {
    if (!confirm("Deseja encerrar sua presença?")) return;

    const token = localStorage.getItem("colabToken");

    await fetch("/colaborador/logout", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });

    localStorage.removeItem("colabToken");
    localStorage.removeItem("colabNome");
    localStorage.removeItem("colabId");

    document.getElementById("loginColab").style.display = "block";
    document.getElementById("areaLogado").style.display = "none";

    mostrarToast("Presença encerrada.", "aviso");
}


/* =========================
   MOSTRAR ÁREA LOGADO
   ========================= */
function mostrarAreaLogado(nome) {
    document.getElementById("loginColab").style.display = "none";
    document.getElementById("areaLogado").style.display = "block";
    document.getElementById("nomeOnline").innerText = nome;
    mostrarAba("Escala");
}


/* =========================
   ABAS
   ========================= */
function mostrarAba(nome) {
    document.querySelectorAll(".aba-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".nav-link-aba").forEach(el => el.classList.remove("active"));

    document.getElementById("aba" + nome).style.display = "block";
    document.getElementById("tab" + nome).classList.add("active");

    if (nome === "Escala") carregarEscala();
    if (nome === "Colegas") carregarColegas();
    if (nome === "Perfil") carregarPerfil();
}


/* =========================
   ESCALA
   ========================= */
function mudarMes(delta) {
    escalaMes += delta;
    if (escalaMes > 12) { escalaMes = 1; escalaAno++; }
    if (escalaMes < 1) { escalaMes = 12; escalaAno--; }
    carregarEscala();
}


async function carregarEscala() {
    const token = localStorage.getItem("colabToken");
    const mesStr = `${escalaAno}-${String(escalaMes).padStart(2, '0')}`;

    document.getElementById("tituloEscala").textContent =
        `${MESES_NOME[escalaMes]} ${escalaAno}`;

    const res = await fetch(`/colaborador/escala?mes=${mesStr}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();
    renderizarEscala(data.escala || []);
}


function renderizarEscala(escala) {
    const container = document.getElementById("tabelaEscala");

    if (!escala.length) {
        container.innerHTML = `<p style="color:#555; text-align:center; font-size:14px;">Sem escala cadastrada para este mês.</p>`;
        return;
    }

    let html = `
    <div class="table-responsive">
    <table class="table table-dark table-hover mb-0" style="font-size:13px;">
        <thead>
            <tr>
                <th>Data</th>
                <th>Dia</th>
                <th>Turno</th>
                <th>Extras</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>`;

    escala.forEach(e => {
        const dt = new Date(e.data + 'T12:00:00');
        const dia = dt.getDate().toString().padStart(2, '0');
        const mes = (dt.getMonth() + 1).toString().padStart(2, '0');
        const diaSemana = DIAS[dt.getDay()];
        const folga = e.folga === 1;
        const extras = e.horas_extras > 0 ? `+${e.horas_extras}h` : '—';

        const rowClass = folga ? 'style="opacity:.5;"' : '';
        const statusBadge = folga
            ? `<span class="badge-folga">FOLGA</span>`
            : `<span class="badge-normal">Normal</span>`;
        const extrasBadge = e.horas_extras > 0
            ? `<span style="color:#ffb300; font-weight:600;">${extras}</span>`
            : `<span style="color:#444;">—</span>`;

        html += `
        <tr ${rowClass}>
            <td>${dia}/${mes}</td>
            <td>${diaSemana}</td>
            <td>${folga ? '—' : `${e.horario_entrada} — ${e.horario_saida}`}</td>
            <td>${extrasBadge}</td>
            <td>${statusBadge}</td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}


/* =========================
   COLEGAS ONLINE
   ========================= */
async function carregarColegas() {
    const token = localStorage.getItem("colabToken");

    const res = await fetch("/colaborador/colegas", {
        headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();
    renderizarColegas(data.colegas || []);
}


function renderizarColegas(colegas) {
    const container = document.getElementById("listaColegas");

    if (!colegas.length) {
        container.innerHTML = `<p style="color:#555; font-size:14px;">Nenhum colega cadastrado.</p>`;
        return;
    }

    container.innerHTML = colegas.map(c => {
        const online = c.status === 'online';
        const iniciais = c.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
        return `
        <div class="col-md-4 col-sm-6">
            <div class="card p-3 status-card">
                <div class="d-flex align-items-center gap-3">
                    <div class="avatar-circle ${online ? 'avatar-online' : 'avatar-offline'}">${iniciais}</div>
                    <div>
                        <div class="status-nome">${c.nome}</div>
                        <div class="status-empresa">${c.empresa || ''}</div>
                        <div class="${online ? 'label-online' : 'label-offline'} mt-1">
                            ${online ? '● Online' : '○ Offline'}
                        </div>
                        ${c.ultimo_acesso ? `<div class="status-acesso">Último acesso: ${c.ultimo_acesso}</div>` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}


/* =========================
   PERFIL
   ========================= */
async function carregarPerfil() {
    const token = localStorage.getItem("colabToken");

    const res = await fetch("/colaborador/perfil", {
        headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();

    document.getElementById("pfNome").value = data.nome || '';
    document.getElementById("pfEmail").value = data.email || '';
    document.getElementById("pfTelefone").value = data.telefone || '';
    document.getElementById("pfHorario").value = data.horario || '';
}


async function salvarPerfil() {
    const token = localStorage.getItem("colabToken");

    const res = await fetch("/colaborador/perfil", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            nome: document.getElementById("pfNome").value,
            telefone: document.getElementById("pfTelefone").value,
            horario: document.getElementById("pfHorario").value
        })
    });

    const data = await res.json();

    if (!res.ok) {
        mostrarToast(data.erro || "Erro ao salvar", "erro");
        return;
    }

    const novoNome = document.getElementById("pfNome").value;
    localStorage.setItem("colabNome", novoNome);
    document.getElementById("nomeOnline").innerText = novoNome;

    mostrarToast("Perfil atualizado!");
}


/* =========================
   SENHA
   ========================= */
async function trocarSenha() {
    const token = localStorage.getItem("colabToken");
    const atual = document.getElementById("snAtual").value;
    const nova = document.getElementById("snNova").value;
    const confirma = document.getElementById("snConfirma").value;

    if (!atual || !nova || !confirma) {
        mostrarToast("Preencha todos os campos.", "aviso");
        return;
    }

    if (nova !== confirma) {
        mostrarToast("Nova senha e confirmação não coincidem.", "erro");
        return;
    }

    const res = await fetch("/colaborador/senha", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ senha_atual: atual, nova_senha: nova })
    });

    const data = await res.json();

    if (!res.ok) {
        mostrarToast(data.erro || "Erro ao alterar senha", "erro");
        return;
    }

    document.getElementById("snAtual").value = '';
    document.getElementById("snNova").value = '';
    document.getElementById("snConfirma").value = '';

    mostrarToast("Senha alterada com sucesso!");
}


/* =========================
   CHAT IA
   ========================= */
async function enviarMensagemIA() {
    const input = document.getElementById("chatInput");
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    adicionarMensagem(msg, 'user');

    const token = localStorage.getItem("colabToken");

    try {
        const res = await fetch("/ia", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ prompt: msg })
        });

        const data = await res.json();

        if (!res.ok) {
            adicionarMensagem("Erro ao obter resposta.", 'ia');
            return;
        }

        adicionarMensagem(data.resposta, 'ia');
    } catch {
        adicionarMensagem("Erro de conexão.", 'ia');
    }
}


function adicionarMensagem(texto, tipo) {
    const area = document.getElementById("chatHistorico");
    const div = document.createElement("div");
    div.className = tipo === 'user' ? 'msg-user' : 'msg-ia';
    div.textContent = texto;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
}


/* =========================
   INIT
   ========================= */
window.onload = () => {
    const nome = localStorage.getItem("colabNome");
    if (nome) mostrarAreaLogado(nome);
};
