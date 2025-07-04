// backend/config/db.js
require("dotenv").config(); // Garante que as variáveis de ambiente sejam carregadas

const mysql = require("mysql2/promise"); // Importa a versão com suporte a Promises

// Cria um pool de conexões para gerenciar as conexões com o banco de dados
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT, // <-- ADICIONE ESTA LINHA
  waitForConnections: true, // Se todas as conexões estiverem em uso, espera por uma
  connectionLimit: 10, // Número máximo de conexões no pool
  queueLimit: 0, // Número máximo de requisições que podem ser enfileiradas
});

// Testa a conexão ao iniciar o módulo
pool
  .getConnection()
  .then((connection) => {
    console.log("Conectado ao banco de dados MySQL!");
    connection.release(); // Libera a conexão de volta para o pool
  })
  .catch((err) => {
    console.error("Erro ao conectar ao banco de dados:", err.message);
    // É uma boa prática sair do processo se a conexão com o DB for crítica
    process.exit(1);
  });

module.exports = pool; // Exporta o pool de conexões para ser usado em outras partes do app
