require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Importação das rotas
const authRoutes = require("./routes/authRoutes");
const eventosRoutes = require("./routes/eventosRoutes");
const veiculosRoutes = require("./routes/veiculosRoutes");
const analiseRoutes = require("./routes/analiseRoutes");

const app = express();

// --- CONFIGURAÇÃO DO CORS ATUALIZADA PARA VERCEL ---
const allowedOrigins = [
  "https://sistema-gestao-manobrista.vercel.app/",
  "http://127.0.0.1:5500", // Para desenvolvimento local (Live Server )
  "http://localhost:5500", // Para desenvolvimento local (Live Server )
  "http://localhost:3000", // Para desenvolvimento local (se o frontend rodar em outra porta )
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Não permitido pela política de CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

// --- ROTAS DA API ---
app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/veiculos", veiculosRoutes);
app.use("/api/analise", analiseRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
