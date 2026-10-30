
// Localiza os elementos da página
const formulario = document.getElementById('formPais');
const listaPaises = document.getElementById('listaPaises');
const mensagem = document.getElementById('mensagem');


// Exibe mensagens na tela
function mostrarMensagem(texto, tipo) {

    mensagem.textContent = texto;

    mensagem.className = 'mensagem ' + tipo;

}


// ======================================
// CONSULTAR PAÍSES
// ======================================

async function carregarPaises() {

    try {

        const resposta = await fetch('/api/paises');

        const paises = await resposta.json();

        listaPaises.innerHTML = '';

        if (paises.length === 0) {

            listaPaises.innerHTML = `
                <tr>
                    <td colspan="3">
                        Nenhum país cadastrado.
                    </td>
                </tr>
            `;

            return;
        }

        paises.forEach(pais => {

            const linha = document.createElement('tr');

            const id = document.createElement('td');
            id.textContent = pais.id_pais;

            const nome = document.createElement('td');
            nome.textContent = pais.nome_pais;

            const acoes = document.createElement('td');
            acoes.className = 'acoes';

            const botaoEditar = document.createElement('button');
            botaoEditar.textContent = 'Editar';
            botaoEditar.className = 'btn btn-editar';

            botaoEditar.addEventListener('click', () => {
                editarPais(pais.id_pais, pais.nome_pais);
            });

            const botaoExcluir = document.createElement('button');
            botaoExcluir.textContent = 'Excluir';
            botaoExcluir.className = 'btn btn-excluir';

            botaoExcluir.addEventListener('click', () => {
                excluirPais(pais.id_pais);
            });

            acoes.appendChild(botaoEditar);
            acoes.appendChild(botaoExcluir);

            linha.appendChild(id);
            linha.appendChild(nome);
            linha.appendChild(acoes);

            listaPaises.appendChild(linha);

        });

    } catch (erro) {

        mostrarMensagem(
            'Não foi possível carregar os países.',
            'erro'
        );

    }

}


// ======================================
// CADASTRAR PAÍS
// ======================================

formulario.addEventListener('submit', async function(evento) {

    evento.preventDefault();

    const nome = document.getElementById('nome_pais').value;

    try {

        const resposta = await fetch('/api/paises', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                nome_pais: nome
            })

        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro);
        }

        mostrarMensagem(
            resultado.mensagem,
            'sucesso'
        );

        formulario.reset();

        carregarPaises();

    } catch (erro) {

        mostrarMensagem(erro.message, 'erro');

    }

});


// ======================================
// EDITAR PAÍS
// ======================================

async function editarPais(id, nomeAtual) {

    const novoNome = prompt(
        'Digite o novo nome do país:',
        nomeAtual
    );

    if (novoNome === null) {
        return;
    }

    if (!novoNome.trim()) {
        mostrarMensagem('O nome não pode ficar vazio.', 'erro');
        return;
    }

    try {

        const resposta = await fetch('/api/paises/' + id, {

            method: 'PUT',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                nome_pais: novoNome
            })

        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro);
        }

        mostrarMensagem(
            resultado.mensagem,
            'sucesso'
        );

        carregarPaises();

    } catch (erro) {

        mostrarMensagem(erro.message, 'erro');

    }

}


// ======================================
// EXCLUIR PAÍS
// ======================================

async function excluirPais(id) {

    const confirmar = confirm(
        'Tem certeza que deseja excluir este país?'
    );

    if (!confirmar) {
        return;
    }

    try {

        const resposta = await fetch('/api/paises/' + id, {
            method: 'DELETE'
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro);
        }

        mostrarMensagem(
            resultado.mensagem,
            'sucesso'
        );

        carregarPaises();

    } catch (erro) {

        mostrarMensagem(erro.message, 'erro');

    }

}


// Carrega a lista quando a página abre
carregarPaises();
