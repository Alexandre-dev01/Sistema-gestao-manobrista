// backend/server.js (VERSÃO FINAL E COMPLETA)

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const { auth } = require("./middleware/authMiddleware");

// Importação das rotas
const authRoutes = require("./routes/authRoutes");
const eventosRoutes = require("./routes/eventosRoutes");
const veiculosRoutes = require("./routes/veiculosRoutes");

const app = express();

// --- CONFIGURAÇÃO FINAL DO CORS PARA PRODUÇÃO ---
app.use(
  cors({
    origin: "https://jade-puppy-cbd850.netlify.app", // Permite requisições apenas do seu site Netlify
  })
);
// --- FIM DA CONFIGURAÇÃO ---

app.use(express.json());

// --- ROTAS DA API ---
app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/veiculos", veiculosRoutes);

// --- ROTA DE TESTE ---
app.get("/", (req, res) => {
  res.send("API do Sistema de Manobrista está funcionando!");
});

// --- LÓGICA PARA O DEPLOY NA RENDER ---
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

// Exporta o 'app' para que os testes possam usá-lo
module.exports = app;
