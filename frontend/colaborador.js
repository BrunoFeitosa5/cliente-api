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


function mostrarOnline(nome) {
    document.getElementById("loginColab").style.display = "none";
    document.getElementById("areaOnline").style.display = "block";
    document.getElementById("nomeOnline").innerText = "Olá, " + nome + "!";
}


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

    mostrarOnline(data.nome);
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

    document.getElementById("loginColab").style.display = "block";
    document.getElementById("areaOnline").style.display = "none";

    mostrarToast("Presença encerrada.", "aviso");
}


window.onload = () => {
    const nome = localStorage.getItem("colabNome");
    if (nome) mostrarOnline(nome);
};
