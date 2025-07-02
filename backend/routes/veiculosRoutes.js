// backend/routes/veiculosRoutes.js
const express = require("express");
const pool = require("../config/db"); // Importa o pool de conexão com o DB
const authMiddleware = require("../middleware/authMiddleware"); // Importa o middleware de autenticação

const router = express.Router();

// Rota para Registrar a Entrada de um Veículo (Protegida)
router.post("/entrada", authMiddleware, async (req, res) => {
  const { evento_id, numero_ticket, modelo, cor, placa, localizacao } =
    req.body;
  const usuario_entrada_id = req.user.id; // ID do usuário logado que está registrando

  console.log(
    `[BACKEND - Entrada] Recebida requisição para evento ID: ${evento_id}, Ticket: ${numero_ticket}`
  ); // Log 1

  if (
    !evento_id ||
    !numero_ticket ||
    !modelo ||
    !cor ||
    !placa ||
    !localizacao
  ) {
    console.log(
      `[BACKEND - Entrada] Erro 400: Campos obrigatórios faltando para Ticket: ${numero_ticket}.`
    ); // Log 2
    return res
      .status(400)
      .json({ message: "Todos os campos obrigatórios devem ser preenchidos." });
  }

  try {
    // Verifica se o evento existe
    const [eventos] = await pool.query("SELECT id FROM eventos WHERE id = ?", [
      evento_id,
    ]);
    if (eventos.length === 0) {
      console.log(
        `[BACKEND - Entrada] Erro 404: Evento ID: ${evento_id} não encontrado.`
      ); // Log 3
      return res.status(404).json({ message: "Evento não encontrado." });
    }

    // Verifica se o ticket já existe para este evento
    const [existingVehicle] = await pool.query(
      "SELECT id FROM veiculos WHERE evento_id = ? AND numero_ticket = ?", // CORRIGIDO: evento_id
      [evento_id, numero_ticket]
    );
    if (existingVehicle.length > 0) {
      console.log(
        `[BACKEND - Entrada] Erro 409: Ticket ${numero_ticket} já utilizado para evento ID: ${evento_id}.`
      ); // Log 4
      return res
        .status(409)
        .json({ message: "Número de ticket já utilizado para este evento." });
    }

    const hora_entrada = new Date(); // Data e hora atual

    const [result] = await pool.query(
      "INSERT INTO veiculos (evento_id, numero_ticket, modelo, cor, placa, localizacao, hora_entrada, usuario_entrada_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        evento_id,
        numero_ticket,
        modelo,
        cor,
        placa,
        localizacao,
        hora_entrada,
        usuario_entrada_id,
      ]
    );
    console.log(
      `[BACKEND - Entrada] Veículo Ticket ${numero_ticket} registrado com sucesso. ID: ${result.insertId}`
    ); // Log 5
    res.status(201).json({
      message: "Veículo registrado com sucesso!",
      veiculoId: result.insertId,
    });
  } catch (error) {
    console.error(
      "[BACKEND - Entrada] Erro interno ao registrar entrada de veículo:",
      error
    ); // Log 6
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao registrar veículo." });
  }
});

// Rota para Registrar a Saída de um Veículo (Protegida)
router.put("/saida/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const usuario_saida_id = req.user.id; // ID do usuário logado que está registrando a saída

  console.log(
    `[BACKEND - Saída] Recebida requisição para saída do veículo ID: ${id} pelo usuário ID: ${usuario_saida_id}`
  ); // Log 1

  try {
    // Verifica se o veículo existe e se ainda está estacionado
    const [veiculos] = await pool.query(
      "SELECT id, status FROM veiculos WHERE id = ?",
      [id]
    );
    if (veiculos.length === 0) {
      console.log(
        `[BACKEND - Saída] Erro 404: Veículo ID: ${id} não encontrado.`
      ); // Log 2
      return res.status(404).json({ message: "Veículo não encontrado." });
    }
    if (veiculos[0].status === "saiu") {
      console.log(
        `[BACKEND - Saída] Erro 400: Veículo ID: ${id} já registrado como saído.`
      ); // Log 3
      return res
        .status(400)
        .json({ message: "Veículo já registrado como saído." });
    }

    const hora_saida = new Date(); // Data e hora atual

    const [result] = await pool.query(
      "UPDATE veiculos SET status = ?, hora_saida = ?, usuario_saida_id = ? WHERE id = ?",
      ["saiu", hora_saida, usuario_saida_id, id]
    );

    if (result.affectedRows === 0) {
      console.log(
        `[BACKEND - Saída] Erro 404: Veículo ID: ${id} não encontrado ou não atualizado (affectedRows = 0).`
      ); // Log 4
      return res
        .status(404)
        .json({ message: "Veículo não encontrado ou não atualizado." });
    }

    console.log(
      `[BACKEND - Saída] Saída do veículo ID: ${id} registrada com sucesso.`
    ); // Log 5
    res
      .status(200)
      .json({ message: "Saída de veículo registrada com sucesso!" });
  } catch (error) {
    console.error(
      "[BACKEND - Saída] Erro interno ao registrar saída de veículo:",
      error
    ); // Log 6
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao registrar saída." });
  }
});

// Rota para Listar Veículos de um Evento Específico (Protegida)
router.get("/evento/:idEvento", authMiddleware, async (req, res) => {
  const { idEvento } = req.params;
  const { status, search } = req.query; // Filtros opcionais: status (estacionado, saiu), search (placa, ticket)

  console.log(
    `[BACKEND - Listar] Recebida requisição para listar veículos do evento ID: ${idEvento}. Status: ${
      status || "Todos"
    }, Busca: ${search || "Nenhuma"}`
  ); // Log 1

  let query =
    "SELECT v.*, u_entrada.nome_usuario AS nome_usuario_entrada, u_saida.nome_usuario AS nome_usuario_saida FROM veiculos v JOIN usuarios u_entrada ON v.usuario_entrada_id = u_entrada.id LEFT JOIN usuarios u_saida ON v.usuario_saida_id = u_saida.id WHERE v.evento_id = ?"; // CORRIGIDO: evento_id
  let params = [idEvento];

  if (status && ["estacionado", "aguardando_saida", "saiu"].includes(status)) {
    query += " AND v.status = ?";
    params.push(status);
  }
  if (search) {
    query += " AND (v.placa LIKE ? OR v.numero_ticket LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  // Adiciona a ordenação por numero_ticket (convertido para número para ordenar corretamente)
  query += " ORDER BY CAST(v.numero_ticket AS UNSIGNED) ASC";

  try {
    const [veiculos] = await pool.query(query, params);
    console.log(
      `[BACKEND - Listar] ${veiculos.length} veículos encontrados para o evento ID: ${idEvento}.`
    ); // Log 2
    res.status(200).json(veiculos);
  } catch (error) {
    console.error("[BACKEND - Listar] Erro interno ao listar veículos:", error); // Log 3
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao listar veículos." });
  }
});

module.exports = router;
