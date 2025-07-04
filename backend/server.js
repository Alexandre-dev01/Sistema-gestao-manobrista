// backend/server.js (MODIFICADO PARA TESTES)

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const { auth } = require("./middleware/authMiddleware");

const authRoutes = require("./routes/authRoutes");
const eventosRoutes = require("./routes/eventosRoutes");
const veiculosRoutes = require("./routes/veiculosRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/veiculos", veiculosRoutes);

// --- ROTAS DE TESTE (mantidas por enquanto) ---
app.get("/", (req, res) =>
  res.send("API do Sistema de Manobrista está funcionando!")
);
// ... outras rotas de teste ...

// --- ALTERAÇÃO IMPORTANTE AQUI ---
// Apenas inicia o servidor se este arquivo for executado diretamente
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse a API em: http://localhost:${PORT}`);
  });
}

// Exporta o 'app' para que os testes possam usá-lo
module.exports = app;
