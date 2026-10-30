const express = require('express');
const path = require('path');
const conexao = require('./conexao');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'site')));

function erroBanco(res, erro, mensagem = 'Não foi possível concluir a operação.') {
    console.error(erro);
    if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe um registro com esses dados únicos.' });
    }
    if (erro.code === 'ER_ROW_IS_REFERENCED_2' || erro.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(409).json({ erro: 'Este registro possui relacionamentos ou depende de um registro existente.' });
    }
    return res.status(500).json({ erro: mensagem });
}

function textoObrigatorio(valor) {
    return typeof valor === 'string' && valor.trim().length > 0;
}

function rotasSimples({ tabela, id, campos, rota, ordenar, listar = true }) {
    if (listar) app.get(`/api/${rota}`, async (req, res) => {
        try {
            const [dados] = await conexao.query(
                `SELECT * FROM ${tabela} ORDER BY ${ordenar || id} DESC`
            );
            res.json(dados);
        } catch (e) { erroBanco(res, e, `Erro ao consultar ${rota}.`); }
    });

    app.post(`/api/${rota}`, async (req, res) => {
        try {
            for (const campo of campos) {
                if (campo.obrigatorio && !textoObrigatorio(String(req.body[campo.nome] ?? ''))) {
                    return res.status(400).json({ erro: `Preencha o campo ${campo.rotulo}.` });
                }
            }
            const nomes = campos.map(c => c.nome);
            const valores = campos.map(c => c.tipo === 'boolean'
                ? (req.body[c.nome] ? 1 : 0)
                : (req.body[c.nome] ?? null));
            const placeholders = nomes.map(() => '?').join(', ');
            const [r] = await conexao.execute(
                `INSERT INTO ${tabela} (${nomes.join(', ')}) VALUES (${placeholders})`, valores
            );
            res.status(201).json({ mensagem: 'Cadastro realizado com sucesso!', id: r.insertId });
        } catch (e) { erroBanco(res, e, `Erro ao cadastrar ${rota}.`); }
    });

    app.put(`/api/${rota}/:id`, async (req, res) => {
        try {
            for (const campo of campos) {
                if (campo.obrigatorio && !textoObrigatorio(String(req.body[campo.nome] ?? ''))) {
                    return res.status(400).json({ erro: `Preencha o campo ${campo.rotulo}.` });
                }
            }
            const valores = campos.map(c => c.tipo === 'boolean'
                ? (req.body[c.nome] ? 1 : 0)
                : (req.body[c.nome] ?? null));
            const sets = campos.map(c => `${c.nome} = ?`).join(', ');
            const [r] = await conexao.execute(
                `UPDATE ${tabela} SET ${sets} WHERE ${id} = ?`, [...valores, req.params.id]
            );
            if (!r.affectedRows) return res.status(404).json({ erro: 'Registro não encontrado.' });
            res.json({ mensagem: 'Registro atualizado com sucesso!' });
        } catch (e) { erroBanco(res, e, `Erro ao atualizar ${rota}.`); }
    });

    app.delete(`/api/${rota}/:id`, async (req, res) => {
        try {
            const [r] = await conexao.execute(`DELETE FROM ${tabela} WHERE ${id} = ?`, [req.params.id]);
            if (!r.affectedRows) return res.status(404).json({ erro: 'Registro não encontrado.' });
            res.json({ mensagem: 'Registro excluído com sucesso!' });
        } catch (e) { erroBanco(res, e, 'Não foi possível excluir. Verifique se existem registros relacionados.'); }
    });
}

// PAÍSES
rotasSimples({
    tabela: 'pais', id: 'id_pais', rota: 'paises', ordenar: 'nome_pais',
    campos: [{ nome: 'nome_pais', rotulo: 'nome do país', obrigatorio: true }]
});

// CATEGORIAS
rotasSimples({
    tabela: 'categoria', id: 'id_categoria', rota: 'categorias', ordenar: 'nome_categoria',
    campos: [{ nome: 'nome_categoria', rotulo: 'nome da categoria', obrigatorio: true }]
});

// CIDADES: o cadastro também salva as categorias na tabela associativa.
app.get('/api/cidades', async (req, res) => {
    try {
        const [dados] = await conexao.query(`
            SELECT c.id_cidade, c.nome_cidade, c.texto_cidade, c.id_pais,
                   p.nome_pais,
                   GROUP_CONCAT(cc.id_categoria) AS categorias_ids,
                   GROUP_CONCAT(cat.nome_categoria SEPARATOR ', ') AS categorias_nomes
            FROM cidade c
            JOIN pais p ON p.id_pais = c.id_pais
            LEFT JOIN cidade_categoria cc ON cc.id_cidade = c.id_cidade
            LEFT JOIN categoria cat ON cat.id_categoria = cc.id_categoria
            GROUP BY c.id_cidade
            ORDER BY c.nome_cidade
        `);
        res.json(dados.map(c => ({
            ...c,
            categorias_ids: c.categorias_ids ? c.categorias_ids.split(',').map(Number) : []
        })));
    } catch (e) { erroBanco(res, e, 'Erro ao consultar cidades.'); }
});

app.post('/api/cidades', async (req, res) => {
    const { nome_cidade, texto_cidade, id_pais, categorias } = req.body;
    if (!textoObrigatorio(nome_cidade) || !textoObrigatorio(texto_cidade) || !id_pais) {
        return res.status(400).json({ erro: 'Preencha nome, descrição e país.' });
    }
    const conn = await conexao.getConnection();
    try {
        await conn.beginTransaction();
        const [r] = await conn.execute(
            'INSERT INTO cidade (nome_cidade, texto_cidade, id_pais) VALUES (?, ?, ?)',
            [nome_cidade.trim(), texto_cidade.trim(), id_pais]
        );
        for (const categoriaId of (Array.isArray(categorias) ? categorias : [])) {
            await conn.execute(
                'INSERT INTO cidade_categoria (id_cidade, id_categoria) VALUES (?, ?)',
                [r.insertId, categoriaId]
            );
        }
        await conn.commit();
        res.status(201).json({ mensagem: 'Cidade cadastrada com sucesso!', id: r.insertId });
    } catch (e) {
        await conn.rollback();
        erroBanco(res, e, 'Erro ao cadastrar cidade.');
    } finally { conn.release(); }
});

app.put('/api/cidades/:id', async (req, res) => {
    const { nome_cidade, texto_cidade, id_pais, categorias } = req.body;
    if (!textoObrigatorio(nome_cidade) || !textoObrigatorio(texto_cidade) || !id_pais) {
        return res.status(400).json({ erro: 'Preencha nome, descrição e país.' });
    }
    const conn = await conexao.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute(
            'UPDATE cidade SET nome_cidade = ?, texto_cidade = ?, id_pais = ? WHERE id_cidade = ?',
            [nome_cidade.trim(), texto_cidade.trim(), id_pais, req.params.id]
        );
        await conn.execute('DELETE FROM cidade_categoria WHERE id_cidade = ?', [req.params.id]);
        for (const categoriaId of (Array.isArray(categorias) ? categorias : [])) {
            await conn.execute(
                'INSERT INTO cidade_categoria (id_cidade, id_categoria) VALUES (?, ?)',
                [req.params.id, categoriaId]
            );
        }
        await conn.commit();
        res.json({ mensagem: 'Cidade atualizada com sucesso!' });
    } catch (e) {
        await conn.rollback();
        erroBanco(res, e, 'Erro ao atualizar cidade.');
    } finally { conn.release(); }
});

app.delete('/api/cidades/:id', async (req, res) => {
    try {
        const [r] = await conexao.execute('DELETE FROM cidade WHERE id_cidade = ?', [req.params.id]);
        if (!r.affectedRows) return res.status(404).json({ erro: 'Cidade não encontrada.' });
        res.json({ mensagem: 'Cidade excluída com sucesso!' });
    } catch (e) { erroBanco(res, e, 'Não foi possível excluir: existem pontos turísticos, dicas ou notificações ligados a esta cidade.'); }
});

// PONTOS TURÍSTICOS
rotasSimples({
    tabela: 'ponto_turistico', id: 'id_ponto_turistico', rota: 'pontos-turisticos', listar: false,
    campos: [
        { nome: 'nome_ponto_turistico', rotulo: 'nome', obrigatorio: true },
        { nome: 'url_imagem', rotulo: 'URL da imagem', obrigatorio: true },
        { nome: 'texto_ponto_turistico', rotulo: 'descrição', obrigatorio: true },
        { nome: 'id_cidade', rotulo: 'cidade', obrigatorio: true }
    ]
});
app.get('/api/pontos-turisticos', async (req, res) => {
    try {
        const [dados] = await conexao.query(`
            SELECT pt.*, c.nome_cidade
            FROM ponto_turistico pt JOIN cidade c ON c.id_cidade = pt.id_cidade
            ORDER BY pt.nome_ponto_turistico
        `);
        res.json(dados);
    } catch (e) { erroBanco(res, e, 'Erro ao consultar pontos turísticos.'); }
});

// DICAS
rotasSimples({
    tabela: 'dica', id: 'id_dica', rota: 'dicas', listar: false,
    campos: [
        { nome: 'texto_dica', rotulo: 'texto da dica', obrigatorio: true },
        { nome: 'id_cidade', rotulo: 'cidade', obrigatorio: true }
    ]
});
app.get('/api/dicas', async (req, res) => {
    try {
        const [dados] = await conexao.query(`
            SELECT d.*, c.nome_cidade
            FROM dica d JOIN cidade c ON c.id_cidade = d.id_cidade
            ORDER BY d.id_dica DESC
        `);
        res.json(dados);
    } catch (e) { erroBanco(res, e, 'Erro ao consultar dicas.'); }
});

// USUÁRIOS
rotasSimples({
    tabela: 'usuario', id: 'id_usuario', rota: 'usuarios',
    campos: [
        { nome: 'nome_usuario', rotulo: 'nome', obrigatorio: true },
        { nome: 'email_usuario', rotulo: 'e-mail', obrigatorio: true },
        { nome: 'receber_notificacoes', rotulo: 'preferência de notificações', tipo: 'boolean' }
    ]
});

// NOTIFICAÇÕES
app.get('/api/notificacoes', async (req, res) => {
    try {
        const [dados] = await conexao.query(`
            SELECT n.*, u.nome_usuario, c.nome_cidade
            FROM notificacao n
            JOIN usuario u ON u.id_usuario = n.id_usuario
            LEFT JOIN cidade c ON c.id_cidade = n.id_cidade
            ORDER BY n.data_notificacao DESC
        `);
        res.json(dados);
    } catch (e) { erroBanco(res, e, 'Erro ao consultar notificações.'); }
});

app.post('/api/notificacoes', async (req, res) => {
    try {
        const { texto_notificacao, id_usuario, id_cidade } = req.body;
        if (!textoObrigatorio(texto_notificacao) || !id_usuario) {
            return res.status(400).json({ erro: 'Preencha o texto e selecione o usuário.' });
        }
        const [r] = await conexao.execute(
            'INSERT INTO notificacao (texto_notificacao, id_usuario, id_cidade) VALUES (?, ?, ?)',
            [texto_notificacao.trim(), id_usuario, id_cidade || null]
        );
        res.status(201).json({ mensagem: 'Notificação cadastrada com sucesso!', id: r.insertId });
    } catch (e) { erroBanco(res, e, 'Erro ao cadastrar notificação.'); }
});

app.put('/api/notificacoes/:id', async (req, res) => {
    try {
        const { texto_notificacao, id_usuario, id_cidade } = req.body;
        if (!textoObrigatorio(texto_notificacao) || !id_usuario) {
            return res.status(400).json({ erro: 'Preencha o texto e selecione o usuário.' });
        }
        const [r] = await conexao.execute(
            `UPDATE notificacao SET texto_notificacao = ?, id_usuario = ?, id_cidade = ?
             WHERE id_notificacao = ?`,
            [texto_notificacao.trim(), id_usuario, id_cidade || null, req.params.id]
        );
        if (!r.affectedRows) return res.status(404).json({ erro: 'Notificação não encontrada.' });
        res.json({ mensagem: 'Notificação atualizada com sucesso!' });
    } catch (e) { erroBanco(res, e, 'Erro ao atualizar notificação.'); }
});

app.delete('/api/notificacoes/:id', async (req, res) => {
    try {
        const [r] = await conexao.execute(
            'DELETE FROM notificacao WHERE id_notificacao = ?', [req.params.id]
        );
        if (!r.affectedRows) return res.status(404).json({ erro: 'Notificação não encontrada.' });
        res.json({ mensagem: 'Notificação excluída com sucesso!' });
    } catch (e) { erroBanco(res, e, 'Erro ao excluir notificação.'); }
});

app.listen(3000, () => {
    console.log('Servidor funcionando em http://localhost:3000');
    conexao.getConnection()
        .then(conn => {
            console.log('Conexão com MySQL realizada com sucesso!');
            conn.release();
        })
        .catch(err => console.error('Erro ao conectar com MySQL:', err.message));
});
