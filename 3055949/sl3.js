const formulario1 = document.getElementById("meuForm"); //Cria uma constante que armazena a referência ao elemento HTML com o id meuForm
const colecao = document.getElementById("colecao"); //Cria uma constante que pega a div onde os cards serão adicionados

formulario1.addEventListener('submit', function(evento){ //essa parte fica escutando o formulário e quando ele é enviado, executa uma função.

    evento.preventDefault(); // é um evento que impede que a pagina recarregue

    const novoNome = document.getElementById('tituloCidade').value; //Cria uma constante que pega o valor digitado no campo com id tituloCidade
    const novoTexto = document.getElementById('textoCidade').value;
    const novaImagem = document.getElementById('imagem').value;
    const novoNI = document.getElementById('nomeImagem').value;
    const novaDica = document.getElementById('textoDicas').value;

    const novo = { // cria um objeto chamado novo
        tituloCidade: novoNome,  //propriedade que recebe o valor das constantes que foram definidas acima
        textoCidade: novoTexto,
        imagem: novaImagem,
        nomeImagem: novoNI,
        textoDicas: novaDica,
    };

    const card = `
        <div class="card">
            <img src="${novo.imagem}">
            <h3>${novo.textoCidade}</h3>
        </div> `;

    colecao.innerHTML += card; //adiciona o card dentro da div colecao

    formulario1.reset(); //limpa os campos do formulário
});



