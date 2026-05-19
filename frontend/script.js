let modoAdmin = false;

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

    modoAdmin = true;

    document.getElementById("areaAdmin").style.display = "block";

    carregarClientes();
}


/* =========================
   LOGOUT 100% CORRETO
   ========================= */
function logout() {

    // 🔥 CASO 1: ainda está em modo admin
    if (modoAdmin) {

        modoAdmin = false;

        document.getElementById("areaAdmin").style.display = "none";

        carregarClientes();

        alert("Saiu do modo admin");

        return;
    }

    // 🔥 CASO 2: já está fora do admin → sair do sistema
    localStorage.removeItem("token");

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

    data.clientes.forEach(c => {
        tabela.innerHTML += `
        <tr>
            <td>${c.id}</td>
            <td>${c.nome}</td>
            <td>${c.email}</td>
            <td>${c.telefone}</td>
            <td>${c.empresa}</td>
            <td>${c.horario}</td>
            <td></td>
        </tr>`;
    });
}


/* =========================
   INIT CORRETO
   ========================= */
window.onload = () => {

    if (localStorage.getItem("token")) {
        modoAdmin = true;
        document.getElementById("areaAdmin").style.display = "block";
    }

    carregarClientes();
};