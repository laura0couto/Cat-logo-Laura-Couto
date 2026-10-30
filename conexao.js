const mysql = require('mysql2/promise');

// Preencha os dados da sua instalação local do MySQL.
// Se o usuário root não tiver senha, mantenha password: ''.
const conexao = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'ifsp',
    database: 'catalogo_cidades',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = conexao;
