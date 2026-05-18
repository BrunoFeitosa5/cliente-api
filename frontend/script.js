async function fazerLogin() {

    const email = document.getElementById("loginEmail").value;
    const senha = document.getElementById("loginSenha").value;

    const res = await fetch("/login", {

        method: "POST",

        headers: {
            "Content-Type":"application/json"
        },

        body: JSON.stringify({
            email,
            senha
        })

    });

    const data = await res.json();

    if (res.ok){

        localStorage.setItem(
            "token",
            data.token
        );

        document.getElementById(
            "areaAdmin"
        ).style.display = "block";

        alert("Login realizado");

        carregarClientes();

    } else {

        alert(data.erro);

    }
}


async function carregarClientes(){

    const res = await fetch("/clientes");

    const data = await res.json();

    const clientes = data.clientes;

    const tabela =
    document.getElementById("tabela");

    const total =
    document.getElementById("totalClientes");

    tabela.innerHTML="";

    total.innerText=
    clientes.length;


    const token =
    localStorage.getItem("token");


    clientes.forEach(c=>{

        let botoes = "";

        if(token){

            botoes=`

            <button
            class="btn btn-danger btn-sm"
            onclick="deletarCliente(${c.id})">

            Excluir

            </button>

            `;

        }

        tabela.innerHTML +=`

        <tr>

        <td>${c.id}</td>

        <td>${c.nome}</td>

        <td>${c.email}</td>

        <td>${c.telefone}</td>

        <td>${c.empresa}</td>

        <td>${c.horario}</td>

        <td>

        ${botoes}

        </td>

        </tr>

        `;

    });

}



async function criarCliente(){

    const token =
    localStorage.getItem("token");


    const cliente={

        nome:
        document.getElementById("nome").value,

        email:
        document.getElementById("email").value,

        telefone:
        document.getElementById("telefone").value,

        empresa:
        document.getElementById("empresa").value,

        horario:
        document.getElementById("horario").value,

        senha:
        document.getElementById("senha").value

    };


    await fetch("/clientes",{

        method:"POST",

        headers:{

            "Content-Type":"application/json",

            "Authorization":
            `Bearer ${token}`

        },

        body:JSON.stringify(cliente)

    });

    carregarClientes();

}



async function deletarCliente(id){

    const token =
    localStorage.getItem("token");


    await fetch(`/clientes/${id}`,{

        method:"DELETE",

        headers:{

            "Authorization":
            `Bearer ${token}`

        }

    });

    carregarClientes();

}


if(localStorage.getItem("token")){

    document.getElementById(
        "areaAdmin"
    ).style.display="block";

}


carregarClientes();