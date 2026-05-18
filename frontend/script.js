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

        document.getElementById("areaAdmin").style.display = "block";

        carregarClientes();

    } else {
        alert(data.erro);
    }
}

/* LOGOUT GLOBAL (ADMIN E USUÁRIO) */
function logout() {

    localStorage.removeItem("token");

    document.getElementById("areaAdmin").style.display = "none";

    document.getElementById("loginEmail").value = "";
    document.getElementById("loginSenha").value = "";

    // usuário normal vai pro Google
    window.location.href = "https://www.google.com";
}

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

if (localStorage.getItem("token")) {
    document.getElementById("areaAdmin").style.display = "block";
}

carregarClientes();