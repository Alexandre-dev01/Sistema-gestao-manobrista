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

  // Validação de campos obrigatórios
  if (!nome_usuario || !senha || !cargo) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios." });
  }

  // NOVO: Validação de Nome de Usuário - Tamanho (mín. 3, máx. 30)
  if (nome_usuario.length < 3 || nome_usuario.length > 30) {
    return res
      .status(400)
      .json({ message: "Nome de usuário deve ter entre 3 e 30 caracteres." });
  }

  // NOVO: Validação de Nome de Usuário - Formato (apenas letras minúsculas, números, underscore e ponto)
  // Regex: ^[a-z0-9_.]+$
  // ^: Início da string
  // [a-z0-9_.]+: Um ou mais caracteres que sejam letras minúsculas, números, underscore ou ponto
  // $: Fim da string
  if (!/^[a-zA-Z0-9_.]+$/.test(nome_usuario)) {
    return res.status(400).json({
      message:
        "Nome de usuário contém caracteres inválidos. Use apenas letras (maiúsculas ou minúsculas), números, _ ou .",
    });
  }

  // NOVO: Validação de Cargo - Apenas valores permitidos
  const allowedRoles = ["manobrista", "orientador", "admin"];
  if (!allowedRoles.includes(cargo)) {
    return res.status(400).json({
      message:
        "Cargo inválido. Cargos permitidos: manobrista, orientador, admin.",
    });
  }

  // Validação de senha (mín. 6, máx. 60 caracteres, maiúscula, minúscula, número, especial)
  if (
    senha.length < 6 ||
    senha.length > 60 || // NOVO: Adicionado limite máximo de 60 caracteres
    !/[A-Z]/.test(senha) ||
    !/[a-z]/.test(senha) ||
    !/[0-9]/.test(senha) ||
    !/[!@#$%^&*]/.test(senha) // Caracteres especiais permitidos
  ) {
    return res.status(400).json({
      message:
        "A senha não atende aos requisitos de segurança (mín. 6, máx. 60 caracteres, maiúscula, minúscula, número, especial).",
    });
  }

  try {
    // Validação de unicidade de nome_usuario (já existente)
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

// Rota de Login de Usuário (Pública) - Sem alterações necessárias para validação de entrada
router.post("/login", async (req, res) => {
  const { nome_usuario, senha } = req.body;

  // --- LOGS DE DEPURAÇÃO ---
  console.log("\n--- INICIANDO TESTE DE LOGIN ---");
  console.log("Recebido nome_usuario:", nome_usuario);
  console.log("Recebida senha:", senha);
  // --- FIM DOS LOGS ---

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
      // --- LOG DE DEPURAÇÃO ---
      console.log("Resultado da busca no DB: Usuário NÃO encontrado.");
      // --- FIM DO LOG ---
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // --- LOG DE DEPURAÇÃO ---
    console.log(
      "Resultado da busca no DB: Usuário encontrado:",
      user.nome_usuario,
      "ID:",
      user.id
    );
    // --- FIM DO LOG ---

    const isMatch = await bcrypt.compare(senha, user.senha);

    // --- LOG DE DEPURAÇÃO ---
    console.log("Resultado da comparação de senha (isMatch):", isMatch);
    console.log("--- FIM DO TESTE DE LOGIN ---\n");
    // --- FIM DO LOG ---

    if (!isMatch) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const token = jwt.sign(
      { id: user.id, cargo: user.cargo },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
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
