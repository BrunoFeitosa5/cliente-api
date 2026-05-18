async function carregarClientes() {

    const resposta = await fetch("/clientes");
    const dados = await resposta.json();

    const clientes = dados.clientes;

    const tabela = document.getElementById("tabela");
    const total = document.getElementById("totalClientes");

    tabela.innerHTML = "";
    total.innerText = clientes.length;

    clientes.forEach(cliente => {

        tabela.innerHTML += `
        <tr>

            <td>${cliente.id}</td>

            <td contenteditable="true"
                onblur="salvarCampo(${cliente.id}, 'nome', this.innerText)">
                ${cliente.nome}
            </td>

            <td contenteditable="true"
                onblur="salvarCampo(${cliente.id}, 'email', this.innerText)">
                ${cliente.email}
            </td>

            <td contenteditable="true"
                onblur="salvarCampo(${cliente.id}, 'telefone', this.innerText)">
                ${cliente.telefone}
            </td>

            <td contenteditable="true"
                onblur="salvarCampo(${cliente.id}, 'empresa', this.innerText)">
                ${cliente.empresa}
            </td>

            <td contenteditable="true"
                onblur="salvarCampo(${cliente.id}, 'horario', this.innerText)">
                ${cliente.horario}
            </td>

            <td>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="deletarCliente(${cliente.id})">

                    Excluir

                </button>

            </td>

        </tr>
        `;
    });
}



async function salvarCampo(id, campo, valor){

    const resposta = await fetch(`/clientes/${id}`);
    const cliente = await resposta.json();

    cliente[campo] = valor;

    await fetch(`/clientes/${id}`,{

        method:"PUT",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(cliente)

    });

}



async function criarCliente(){

    const cliente = {

        nome: document.getElementById("nome").value,

        email: document.getElementById("email").value,

        telefone: document.getElementById("telefone").value,

        empresa: document.getElementById("empresa").value,

        horario: document.getElementById("horario").value,

        senha: document.getElementById("senha").value

    };


    await fetch("/clientes",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(cliente)

    });


    limparCampos();

    carregarClientes();

}



async function deletarCliente(id){

    await fetch(`/clientes/${id}`,{

        method:"DELETE"

    });

    carregarClientes();

}



function limparCampos(){

    document.getElementById("nome").value="";
    document.getElementById("email").value="";
    document.getElementById("telefone").value="";
    document.getElementById("empresa").value="";
    document.getElementById("horario").value="";
    document.getElementById("senha").value="";

}


carregarClientes();