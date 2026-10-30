
const express = require('express');
const path = require('path'); // ALTERAÇÃO: ajuda a localizar a pasta site.
const app = express();

// Middleware obrigatório para ler os dados JSON enviados pelo formulário.
app.use(express.json());

// ALTERAÇÃO: disponibiliza os arquivos da pasta site.
app.use(express.static(path.join(__dirname, 'site')));

// VETOR ORIGINAL: os sete pontos turísticos foram mantidos.
const lista = [
    'Times Square',
    'Estátua da Liberdade',
    'Grand Central Terminal',
    'Rockefeller Center',
    'Empire State Building',
    'Brooklyn Bridge',
    'Central Park'
];

// Rota POST: recebe e guarda uma nova obra.
app.post('/api/lista', (req, res) => {
    const novaObra = req.body;

    lista.push(novaObra);

    res.json({ status: 'sucesso' });
});

// Rota GET: devolve a lista completa.
app.get('/api/lista', (req, res) => {
    res.json(lista);
});

// Inicia o servidor na porta 3000.
app.listen(3000, () => {
    console.log('escutando a porta 3000');
});


