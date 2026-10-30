const config = {
    paises: {
        endpoint: '/api/paises', id: 'id_pais', title: 'Países', singular: 'país',
        fields: [{name:'nome_pais',label:'Nome do país',type:'text',required:true}],
        columns: [{key:'id_pais',label:'ID'},{key:'nome_pais',label:'País'}]
    },
    categorias: {
        endpoint: '/api/categorias', id: 'id_categoria', title: 'Categorias', singular: 'categoria',
        fields: [{name:'nome_categoria',label:'Nome da categoria',type:'text',required:true}],
        columns: [{key:'id_categoria',label:'ID'},{key:'nome_categoria',label:'Categoria'}]
    },
    cidades: {
        endpoint: '/api/cidades', id: 'id_cidade', title: 'Cidades', singular: 'cidade',
        fields: [
            {name:'nome_cidade',label:'Nome da cidade',type:'text',required:true},
            {name:'texto_cidade',label:'Descrição da cidade',type:'textarea',required:true},
            {name:'id_pais',label:'País',type:'select',source:'/api/paises',sourceId:'id_pais',sourceLabel:'nome_pais',required:true},
            {name:'categorias',label:'Categorias',type:'multi',source:'/api/categorias',sourceId:'id_categoria',sourceLabel:'nome_categoria'}
        ],
        columns: [{key:'id_cidade',label:'ID'},{key:'nome_cidade',label:'Cidade'},{key:'nome_pais',label:'País'},{key:'categorias_nomes',label:'Categorias'}]
    },
    pontos_turisticos: {
        endpoint: '/api/pontos-turisticos', id: 'id_ponto_turistico', title: 'Pontos turísticos', singular: 'ponto turístico',
        fields: [
            {name:'nome_ponto_turistico',label:'Nome do ponto turístico',type:'text',required:true},
            {name:'url_imagem',label:'URL da imagem',type:'url',required:true},
            {name:'texto_ponto_turistico',label:'Descrição',type:'textarea',required:true},
            {name:'id_cidade',label:'Cidade',type:'select',source:'/api/cidades',sourceId:'id_cidade',sourceLabel:'nome_cidade',required:true}
        ],
        columns: [{key:'id_ponto_turistico',label:'ID'},{key:'nome_ponto_turistico',label:'Ponto turístico'},{key:'nome_cidade',label:'Cidade'},{key:'url_imagem',label:'Imagem'}]
    },
    dicas: {
        endpoint: '/api/dicas', id: 'id_dica', title: 'Dicas', singular: 'dica',
        fields: [
            {name:'texto_dica',label:'Texto da dica',type:'textarea',required:true},
            {name:'id_cidade',label:'Cidade',type:'select',source:'/api/cidades',sourceId:'id_cidade',sourceLabel:'nome_cidade',required:true}
        ],
        columns: [{key:'id_dica',label:'ID'},{key:'texto_dica',label:'Dica'},{key:'nome_cidade',label:'Cidade'}]
    },
    usuarios: {
        endpoint: '/api/usuarios', id: 'id_usuario', title: 'Usuários', singular: 'usuário',
        fields: [
            {name:'nome_usuario',label:'Nome',type:'text',required:true},
            {name:'email_usuario',label:'E-mail',type:'email',required:true},
            {name:'receber_notificacoes',label:'Deseja receber notificações?',type:'checkbox'}
        ],
        columns: [{key:'id_usuario',label:'ID'},{key:'nome_usuario',label:'Nome'},{key:'email_usuario',label:'E-mail'},{key:'receber_notificacoes',label:'Recebe notificações'}]
    },
    notificacoes: {
        endpoint: '/api/notificacoes', id: 'id_notificacao', title: 'Notificações', singular: 'notificação',
        fields: [
            {name:'texto_notificacao',label:'Texto da notificação',type:'textarea',required:true},
            {name:'id_usuario',label:'Usuário destinatário',type:'select',source:'/api/usuarios',sourceId:'id_usuario',sourceLabel:'nome_usuario',required:true},
            {name:'id_cidade',label:'Cidade (opcional)',type:'select',source:'/api/cidades',sourceId:'id_cidade',sourceLabel:'nome_cidade',required:false}
        ],
        columns: [{key:'id_notificacao',label:'ID'},{key:'texto_notificacao',label:'Notificação'},{key:'nome_usuario',label:'Usuário'},{key:'nome_cidade',label:'Cidade'}]
    }
};

const chave = document.body.dataset.cadastro;
const cfg = config[chave];
const form = document.getElementById('formCadastro');
const camposDiv = document.getElementById('campos');
const tabela = document.getElementById('listaRegistros');
const mensagem = document.getElementById('mensagem');
const titulo = document.getElementById('tituloCadastro');
let registroEditando = null;
let opcoes = {};

function mostrarMensagem(texto, tipo='sucesso') {
    mensagem.textContent = texto;
    mensagem.className = 'mensagem ' + tipo;
}
function escapar(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
async function carregarOpcoes() {
    for (const campo of cfg.fields.filter(f => f.source)) {
        const r = await fetch(campo.source);
        if (!r.ok) throw new Error('Não foi possível carregar opções de ' + campo.label + '.');
        opcoes[campo.name] = await r.json();
    }
}
function criarFormulario() {
    titulo.textContent = 'Cadastro de ' + cfg.title;
    camposDiv.innerHTML = '';
    cfg.fields.forEach(c => {
        const wrapper = document.createElement('div');
        wrapper.className = 'campo';
        const label = document.createElement('label');
        label.htmlFor = c.name;
        label.textContent = c.label;
        wrapper.appendChild(label);
        let el;
        if (c.type === 'textarea') {
            el = document.createElement('textarea');
        } else if (c.type === 'select' || c.type === 'multi') {
            el = document.createElement('select');
            if (c.type === 'multi') el.multiple = true;
            if (c.type === 'select' && !c.required) {
                const vazio = document.createElement('option');
                vazio.value = '';
                vazio.textContent = 'Nenhuma';
                el.appendChild(vazio);
            }
            (opcoes[c.name] || []).forEach(item => {
                const option = document.createElement('option');
                option.value = item[c.sourceId];
                option.textContent = item[c.sourceLabel];
                el.appendChild(option);
            });
        } else if (c.type === 'checkbox') {
            el = document.createElement('input');
            el.type = 'checkbox';
        } else {
            el = document.createElement('input');
            el.type = c.type;
        }
        el.id = c.name;
        el.name = c.name;
        if (c.required) el.required = true;
        if (c.type === 'checkbox') el.checked = true;
        wrapper.appendChild(el);
        if (c.type === 'multi') {
            const ajuda = document.createElement('small');
            ajuda.className = 'ajuda';
            ajuda.textContent = 'Segure Ctrl (ou Command no Mac) para selecionar mais de uma categoria.';
            wrapper.appendChild(ajuda);
        }
        camposDiv.appendChild(wrapper);
    });
}
function obterDadosFormulario() {
    const dados = {};
    cfg.fields.forEach(c => {
        const el = document.getElementById(c.name);
        if (c.type === 'checkbox') dados[c.name] = el.checked;
        else if (c.type === 'multi') dados[c.name] = Array.from(el.selectedOptions).map(o => Number(o.value));
        else dados[c.name] = el.value;
    });
    return dados;
}
function preencherFormulario(item) {
    cfg.fields.forEach(c => {
        const el = document.getElementById(c.name);
        if (c.type === 'checkbox') el.checked = Boolean(item[c.name]);
        else if (c.type === 'multi') {
            const ids = (item.categorias_ids || []).map(Number);
            Array.from(el.options).forEach(o => o.selected = ids.includes(Number(o.value)));
        } else el.value = item[c.name] ?? '';
    });
}
async function carregarRegistros() {
    const r = await fetch(cfg.endpoint);
    const dados = await r.json();
    if (!r.ok) throw new Error(dados.erro || 'Erro ao carregar registros.');
    tabela.innerHTML = '';
    if (!dados.length) {
        tabela.innerHTML = `<tr><td colspan="${cfg.columns.length + 1}">Nenhum registro cadastrado.</td></tr>`;
        return;
    }
    dados.forEach(item => {
        const tr = document.createElement('tr');
        cfg.columns.forEach(col => {
            const td = document.createElement('td');
            let valor = item[col.key];
            if (col.key === 'receber_notificacoes') valor = valor ? 'Sim' : 'Não';
            td.textContent = valor ?? '—';
            tr.appendChild(td);
        });
        const acoes = document.createElement('td');
        acoes.className = 'acoes';
        const editar = document.createElement('button');
        editar.className = 'btn btn-editar';
        editar.textContent = 'Editar';
        editar.addEventListener('click', () => {
            registroEditando = item[cfg.id];
            preencherFormulario(item);
            document.getElementById('btnSalvar').textContent = 'Salvar alterações';
            window.scrollTo({top:0,behavior:'smooth'});
        });
        const excluir = document.createElement('button');
        excluir.className = 'btn btn-excluir';
        excluir.textContent = 'Excluir';
        excluir.addEventListener('click', () => excluirRegistro(item[cfg.id]));
        acoes.append(editar, excluir);
        tr.appendChild(acoes);
        tabela.appendChild(tr);
    });
}
form.addEventListener('submit', async e => {
    e.preventDefault();
    try {
        const metodo = registroEditando ? 'PUT' : 'POST';
        const url = registroEditando ? `${cfg.endpoint}/${registroEditando}` : cfg.endpoint;
        const r = await fetch(url, {
            method: metodo,
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(obterDadosFormulario())
        });
        const resultado = await r.json();
        if (!r.ok) throw new Error(resultado.erro || 'Erro ao salvar.');
        mostrarMensagem(resultado.mensagem);
        form.reset();
        registroEditando = null;
        document.getElementById('btnSalvar').textContent = 'Cadastrar';
        await carregarRegistros();
    } catch (err) { mostrarMensagem(err.message, 'erro'); }
});
document.getElementById('btnLimpar').addEventListener('click', () => {
    registroEditando = null;
    document.getElementById('btnSalvar').textContent = 'Cadastrar';
});
async function excluirRegistro(id) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    try {
        const r = await fetch(`${cfg.endpoint}/${id}`, {method:'DELETE'});
        const resultado = await r.json();
        if (!r.ok) throw new Error(resultado.erro || 'Erro ao excluir.');
        mostrarMensagem(resultado.mensagem);
        await carregarRegistros();
    } catch (err) { mostrarMensagem(err.message, 'erro'); }
}
(async function iniciar() {
    try {
        await carregarOpcoes();
        criarFormulario();
        await carregarRegistros();
    } catch (err) { mostrarMensagem(err.message, 'erro'); }
})();

// Ajusta os títulos da tabela conforme a entidade selecionada.
(function ajustarCabecalho() {
    const ths = {
        paises: ['ID', 'Nome do país', 'Ações'],
        categorias: ['ID', 'Categoria', 'Ações'],
        cidades: ['ID', 'Cidade', 'País', 'Categorias', 'Ações'],
        pontos_turisticos: ['ID', 'Ponto turístico', 'Cidade', 'Imagem', 'Ações'],
        dicas: ['ID', 'Dica', 'Cidade', 'Ações'],
        usuarios: ['ID', 'Nome', 'E-mail', 'Recebe notificações', 'Ações'],
        notificacoes: ['ID', 'Notificação', 'Usuário', 'Cidade', 'Ações']
    };
    const tr = document.querySelector('thead tr');
    if (tr && ths[chave]) {
        tr.innerHTML = '';
        ths[chave].forEach(t => {
            const th = document.createElement('th');
            th.textContent = t;
            tr.appendChild(th);
        });
    }
})();
