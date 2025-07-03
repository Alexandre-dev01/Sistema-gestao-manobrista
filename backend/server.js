// backend/server.js (VERSÃO FINAL E COMPLETA)

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

// --- IMPORTAÇÃO CORRIGIDA ---
// Importa apenas a função 'auth' para ser usada na rota de teste.
// A função 'authorize' é usada dentro dos próprios arquivos de rotas.
const { auth } = require("./middleware/authMiddleware");

// Importação das rotas
const authRoutes = require("./routes/authRoutes");
const eventosRoutes = require("./routes/eventosRoutes");
const veiculosRoutes = require("./routes/veiculosRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares essenciais
app.use(cors());
app.use(express.json());

// --- ROTAS DA API ---
// O prefixo da rota é definido aqui, e o arquivo de rotas lida com o resto.
// As proteções de middleware já estão dentro de cada arquivo de rota.
app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/veiculos", veiculosRoutes);

// --- ROTAS DE TESTE ---

// Rota de Teste Simples da API
app.get("/", (req, res) => {
  res.send("API do Sistema de Manobrista está funcionando!");
});

// Rota para Testar a Conexão com o Banco de Dados
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS solution");
    res.json({
      message: "Conexão com o banco de dados foi bem-sucedida!",
      solution: rows[0].solution,
    });
  } catch (error) {
    console.error("Erro ao testar a conexão com o banco de dados:", error);
    res.status(500).json({ message: "Erro ao conectar com o banco de dados." });
  }
});

// Rota Protegida de Teste (para verificar se o middleware 'auth' funciona)
// Usa a função 'auth' importada corretamente.
app.get("/api/protected", auth, (req, res) => {
  res.json({
    message: "Você acessou uma rota protegida com sucesso!",
    user: req.user, // Mostra o conteúdo do token decodificado (id, cargo)
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse a API em: http://localhost:${PORT}`);
});
