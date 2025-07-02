// backend/routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcrypt"); // Certifique-se de que é 'bcrypt' e não 'bcryptjs'
const jwt = require("jsonwebtoken"); // Para gerar tokens de autenticação
const pool = require("../config/db"); // Importa o pool de conexão com o DB
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
// const roleMiddleware = require("../middleware/roleMiddleware"); // Remova esta linha se não for usar em outras rotas aqui

// Rota de Registro de Usuário (PÚBLICA)
router.post("/register", async (req, res) => {
  const { nome_usuario, senha, cargo } = req.body;
  console.log(
    `[AUTH] Tentativa de registro para: ${nome_usuario}, Cargo: ${cargo}`
  );

  // Validação básica
  if (!nome_usuario || !senha || !cargo) {
    console.log(
      `[AUTH] Erro de registro: Campos obrigatórios faltando para ${nome_usuario}.`
    );
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios." });
  }

  // --- VALIDAÇÃO DE SENHA NO BACKEND ---
  if (senha.length < 6) {
    console.log(
      `[AUTH] Erro de registro: Senha muito curta para ${nome_usuario}.`
    );
    return res
      .status(400)
      .json({ message: "A senha deve ter no mínimo 6 caracteres." });
  }
  if (!/[A-Z]/.test(senha)) {
    console.log(
      `[AUTH] Erro de registro: A senha deve conter pelo menos 1 letra maiúscula para ${nome_usuario}.`
    );
    return res
      .status(400)
      .json({ message: "A senha deve conter pelo menos 1 letra maiúscula." });
  }
  if (!/[a-z]/.test(senha)) {
    console.log(
      `[AUTH] Erro de registro: A senha deve conter pelo menos 1 letra minúscula para ${nome_usuario}.`
    );
    return res
      .status(400)
      .json({ message: "A senha deve conter pelo menos 1 letra minúscula." });
  }
  if (!/[0-9]/.test(senha)) {
    console.log(
      `[AUTH] Erro de registro: A senha deve conter pelo menos 1 número para ${nome_usuario}.`
    );
    return res
      .status(400)
      .json({ message: "A senha deve conter pelo menos 1 número." });
  }
  if (!/[!@#$%^&*]/.test(senha)) {
    console.log(
      `[AUTH] Erro de registro: A senha deve conter pelo menos 1 caractere especial para ${nome_usuario}.`
    );
    return res.status(400).json({
      message:
        "A senha deve conter pelo menos 1 caractere especial (!@#$%^&*).",
    });
  }
  // --- FIM DA VALIDAÇÃO DE SENHA NO BACKEND ---

  try {
    // Verifica se o usuário já existe
    const [existingUser] = await pool.query(
      "SELECT id FROM usuarios WHERE nome_usuario = ?",
      [nome_usuario]
    );
    if (existingUser.length > 0) {
      console.log(
        `[AUTH] Erro de registro: Usuário ${nome_usuario} já existe.`
      );
      return res.status(409).json({ message: "Nome de usuário já existe." });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Insere o novo usuário no banco de dados
    const [result] = await pool.query(
      "INSERT INTO usuarios (nome_usuario, senha, cargo) VALUES (?, ?, ?)", // Coluna 'senha'
      [nome_usuario, hashedPassword, cargo]
    );

    console.log(
      `[AUTH] Usuário ${nome_usuario} (ID: ${result.insertId}) registrado com sucesso.`
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

// Rota de Login de Usuário
router.post("/login", async (req, res) => {
  const { nome_usuario, senha } = req.body;

  console.log(`[AUTH] Tentativa de login para: ${nome_usuario}`);

  // Validação básica
  if (!nome_usuario || !senha) {
    console.log(
      `[AUTH] Erro de login: Credenciais faltando para ${nome_usuario}.`
    );
    return res
      .status(400)
      .json({ message: "Nome de usuário e senha são obrigatórios." });
  }

  try {
    // Busca o usuário no banco de dados
    const [users] = await pool.query(
      "SELECT * FROM usuarios WHERE nome_usuario = ?",
      [nome_usuario]
    );
    const user = users[0];
    console.log("[AUTH] Usuário encontrado para login:", user);

    if (!user) {
      console.log(
        `[AUTH] Erro de login: Usuário ${nome_usuario} não encontrado.`
      );
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // Verifique o valor da senha antes de comparar
    console.log("Tipo de senha (req.body):", typeof senha, "Valor:", senha);
    console.log(
      "Tipo de user.senha (DB):",
      typeof user.senha,
      "Valor:",
      user.senha
    );

    // Verificação extra antes de chamar bcrypt.compare
    if (!senha || typeof senha !== "string") {
      console.error(
        "[AUTH] ERRO CRÍTICO: Senha fornecida inválida para bcrypt.compare. Tipo:",
        typeof senha,
        "Valor:",
        senha
      );
      return res.status(500).json({
        message: "Erro interno de autenticação: senha fornecida inválida.",
      });
    }
    if (!user.senha || typeof user.senha !== "string") {
      console.error(
        "[AUTH] ERRO CRÍTICO: Senha do banco de dados inválida para bcrypt.compare. Tipo:",
        typeof user.senha,
        "Valor:",
        user.senha
      );
      return res.status(500).json({
        message:
          "Erro interno de autenticação: senha do banco de dados inválida.",
      });
    }

    console.log("[AUTH] Chamando bcrypt.compare com:", {
      senha_fornecida: senha,
      senha_do_banco: user.senha,
    });

    const isMatch = await bcrypt.compare(senha, user.senha); // Linha da comparação

    if (!isMatch) {
      console.log(
        `[AUTH] Erro de login: Senha incorreta para ${nome_usuario}.`
      );
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // Gera um token JWT
    const token = jwt.sign(
      { id: user.id, cargo: user.cargo },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Token expira em 1 hora
    );

    console.log(
      `[AUTH] Login bem-sucedido para ${nome_usuario} (Cargo: ${user.cargo}).`
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

// Rota Protegida de Exemplo (para testar o middleware)
router.get("/protected", authMiddleware, (req, res) => {
  res
    .status(200)
    .json({ message: "Você acessou uma rota protegida!", user: req.user });
});

module.exports = router;
