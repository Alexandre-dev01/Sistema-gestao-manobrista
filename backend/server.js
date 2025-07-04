// backend/server.js (VERSÃO FINAL COM CORS PARA AMBOS AMBIENTES)

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

// --- CORREÇÃO IMPORTANTE AQUI (CONFIGURAÇÃO DO CORS) ---
// Lista de endereços (origens) que têm permissão para acessar esta API
const allowedOrigins = [
  "https://jade-puppy-cbd850.netlify.app", // Seu site em produção
  "http://127.0.0.1:5500", // Endereço comum do Live Server do VS Code
  "http://localhost:5500", // Outro endereço comum para o Live Server
];

// Configura o CORS para aceitar requisições apenas das origens na lista
const corsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem 'origin' (como Postman) ou se a origem estiver na lista de permissões.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Não permitido pela política de CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"], // Métodos HTTP permitidos
  allowedHeaders: ["Content-Type", "Authorization"], // Cabeçalhos permitidos
};

// Aplica o middleware do CORS com as opções configuradas
app.use(cors(corsOptions));
// --- FIM DA CORREÇÃO ---

app.use(express.json());

// --- ROTAS DA API ---
app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/veiculos", veiculosRoutes);

// --- LÓGICA PARA O DEPLOY NA RENDER ---
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
