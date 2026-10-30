
const formulario1 = document.getElementById("meuForm");
const colecao = document.getElementById("colecao");

// ORIGINAL: recupera os dados salvos no navegador.
let galeria = JSON.parse(localStorage.getItem("galeria")) || [];

// ORIGINAL: mostra os cards já salvos ao abrir a página.
galeria.forEach(cidade => renderizarCards(cidade));

formulario1.addEventListener('submit', function(evento) {

    evento.preventDefault();

    // ORIGINAL: pega os valores digitados nos inputs.
    const novoNome = document.getElementById('tituloCidade').value;
    const novoTexto = document.getElementById('textoCidade').value;
    const novaImagem = document.getElementById('imagem').value;
    const novoNI = document.getElementById('nomeImagem').value;
    const novaDica = document.getElementById('textoDicas').value;

    // ALTERAÇÃO: utiliza a classe DicasV do arquivo script.js.
    const novo = new DicasV(novoNome, novoTexto, novaImagem, novoNI, novaDica);

    // ALTERAÇÃO: envia os dados para o servidor Express.
    fetch('/api/lista', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(novo)
    })
    .then((resposta) => {

        // ALTERAÇÃO: verifica se o servidor respondeu corretamente.
        if (!resposta.ok) {
            throw new Error('Erro ao cadastrar a cidade');
        }

        return resposta.json();
    })
    .then((dados) => {

        // ORIGINAL: adiciona os dados à galeria e salva no LocalStorage.
        galeria.push(novo);
        localStorage.setItem("galeria", JSON.stringify(galeria));

        // ORIGINAL: mostra o novo card na página do formulário.
        renderizarCards(novo);

        console.log(dados);

        alert('Cadastro realizado com sucesso!');

        // ORIGINAL: limpa os campos do formulário.
        formulario1.reset();
    })
    .catch((erro) => {

        // ALTERAÇÃO: informa caso ocorra algum erro no envio.
        console.log("Erro ao enviar:", erro);
        alert('Não foi possível enviar os dados para o servidor.');
    });

});

function renderizarCards(cidade) {

    // ALTERAÇÃO: aceita os atributos antigos e os da classe DicasV.
    const titulo = cidade.titulo || cidade.tituloCidade;
    const descricao = cidade.descricao || cidade.textoCidade;
    const imagem = cidade.imagens || cidade.imagem;
    const nomeImagem = cidade.nomeImagem;
    const dicas = cidade.dicas || cidade.textoDicas;

    // ORIGINAL: monta o card com as informações cadastradas.
    const card = `
    <div class="card">
        <h3>${titulo}</h3>
        <p>${descricao}</p>
        <img src="${imagem}" alt="${nomeImagem}">
        <p class="nomeImg">${nomeImagem}</p>
        <p class="dica">${dicas}</p>
    </div>`;

    // ORIGINAL: adiciona o card à coleção exibida na página.
    colecao.innerHTML += card;
}
