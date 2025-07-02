// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const eventosRoutes = require("./routes/eventosRoutes"); // Importa as rotas de eventos
const veiculosRoutes = require("./routes/veiculosRoutes"); // Importa as rotas de veículos
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventosRoutes); // Todas as rotas de eventos começarão com /api/eventos
app.use("/api/veiculos", veiculosRoutes); // Todas as rotas de veículos começarão com /api/veiculos

// Rota de Teste Simples
app.get("/", (req, res) => {
  res.send("API do Sistema de Manobrista está funcionando!");
});

// Rota para Testar a Conexão com o Banco de Dados
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS solution");
    res.json({
      message: "Conexão com DB bem-sucedida!",
      solution: rows[0].solution,
    });
  } catch (error) {
    console.error("Erro ao testar DB:", error);
    res.status(500).json({ message: "Erro ao conectar com o banco de dados." });
  }
});

// Rota Protegida de Teste (mantida para referência)
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Você acessou uma rota protegida!",
    userId: req.user.id,
    userCargo: req.user.cargo,
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});
