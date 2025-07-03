// backend/routes/authRoutes.js (VERSÃO FINAL E COMPLETA)

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const router = express.Router();
const { auth, authorize } = require("../middleware/authMiddleware");

// Rota de Registro de Usuário - AGORA PROTEGIDA
// Apenas um admin logado pode registrar novos usuários.
router.post("/register", auth, authorize("admin"), async (req, res) => {
  const { nome_usuario, senha, cargo } = req.body;
  console.log(
    `[AUTH] Admin (ID: ${req.user.id}) tentando registrar: ${nome_usuario}, Cargo: ${cargo}`
  );

  // Validação de campos
  if (!nome_usuario || !senha || !cargo) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios." });
  }

  // Validação de senha
  if (
    senha.length < 6 ||
    !/[A-Z]/.test(senha) ||
    !/[a-z]/.test(senha) ||
    !/[0-9]/.test(senha) ||
    !/[!@#$%^&*]/.test(senha)
  ) {
    return res
      .status(400)
      .json({ message: "A senha não atende aos requisitos de segurança." });
  }

  try {
    const [existingUser] = await pool.query(
      "SELECT id FROM usuarios WHERE nome_usuario = ?",
      [nome_usuario]
    );
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "Nome de usuário já existe." });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const [result] = await pool.query(
      "INSERT INTO usuarios (nome_usuario, senha, cargo) VALUES (?, ?, ?)",
      [nome_usuario, hashedPassword, cargo]
    );

    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("[AUTH] Erro interno ao registrar usuário:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao registrar usuário." });
  }
});

// Rota de Login de Usuário (Pública)
router.post("/login", async (req, res) => {
  const { nome_usuario, senha } = req.body;

  if (!nome_usuario || !senha) {
    return res
      .status(400)
      .json({ message: "Nome de usuário e senha são obrigatórios." });
  }

  try {
    const [users] = await pool.query(
      "SELECT * FROM usuarios WHERE nome_usuario = ?",
      [nome_usuario]
    );
    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const isMatch = await bcrypt.compare(senha, user.senha);

    if (!isMatch) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const token = jwt.sign(
      { id: user.id, cargo: user.cargo },
      process.env.JWT_SECRET,
      { expiresIn: "8h" } // Aumentei a duração do token
    );

    res.status(200).json({
      message: "Login bem-sucedido!",
      token,
      user: {
        id: user.id,
        nome_usuario: user.nome_usuario,
        cargo: user.cargo,
      },
    });
  } catch (error) {
    console.error("[AUTH] Erro ao fazer login:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao fazer login." });
  }
});

module.exports = router;
