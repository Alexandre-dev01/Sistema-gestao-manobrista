require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db"); // Apenas para garantir que a conexão inicie

// Importação das rotas
const authRoutes = require("./routes/authRoutes");
const eventosRoutes = require("./routes/eventosRoutes");
const veiculosRoutes = require("./routes/veiculosRoutes");
const analiseRoutes = require("./routes/analiseRoutes");

const app = express();

// --- CONFIGURAÇÃO DE CORS
// Lista de endereços (origens) que têm permissão para acessar esta API.
const allowedOrigins = [
  "https://jade-puppy-cbd850.netlify.app", // A URL do seu frontend no Netlify
  "http://127.0.0.1:5500", // Para testes locais com Live Server
  "http://localhost:5500", // Alternativa para testes locais
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permite requisições da mesma origem (undefined), da lista de permissões, ou de ferramentas como Postman.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Acesso não permitido pela política de CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"], // Métodos HTTP que seu frontend pode usar
  allowedHeaders: ["Content-Type", "Authorization"], // Cabeçalhos que o frontend pode enviar
};

// **1. APLICA O CORS PRIMEIRO:**
app.use(cors(corsOptions));

// **2. PREPARA PARA RECEBER JSON:**
app.use(express.json());

// **3. DEFINE AS ROTAS DA API:**
app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/veiculos", veiculosRoutes);
app.use("/api/analise", analiseRoutes);

// **4. ROTA DE TESTE BÁSICA:**
app.get("/", (req, res) => {
  res.send("API do Sistema de Manobristas está no ar!");
});

// **5. INICIA O SERVIDOR:**
// O Railway fornecerá a porta através da variável de ambiente PORT.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
