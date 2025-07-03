const express = require("express");
const pool = require("../config/db");
const router = express.Router();
const { auth, authorize } = require("../middleware/authMiddleware");

// Rota para Registrar a Entrada de um Veículo
// --- CORREÇÃO AQUI: Adicionado 'manobrista' ---
router.post(
  "/entrada",
  auth,
  authorize("admin", "orientador", "manobrista"), // Manobrista agora pode registrar entrada
  async (req, res) => {
    const { evento_id, numero_ticket, modelo, cor, placa, localizacao } =
      req.body;
    const usuario_entrada_id = req.user.id;

    if (
      !evento_id ||
      !numero_ticket ||
      !modelo ||
      !cor ||
      !placa ||
      !localizacao
    ) {
      return res
        .status(400)
        .json({ message: "Todos os campos são obrigatórios." });
    }

    try {
      const [existingVehicle] = await pool.query(
        "SELECT id FROM veiculos WHERE evento_id = ? AND numero_ticket = ?",
        [evento_id, numero_ticket]
      );
      if (existingVehicle.length > 0) {
        return res
          .status(409)
          .json({ message: "Número de ticket já utilizado para este evento." });
      }

      const hora_entrada = new Date();
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
      res.status(201).json({
        message: "Veículo registrado com sucesso!",
        veiculoId: result.insertId,
      });
    } catch (error) {
      console.error("Erro ao registrar entrada de veículo:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
);

// Rota para Registrar a Saída de um Veículo
// Permissão: admin, orientador e manobrista (já estava correto)
router.put(
  "/saida/:id",
  auth,
  authorize("admin", "orientador", "manobrista"),
  async (req, res) => {
    const { id } = req.params;
    const usuario_saida_id = req.user.id;

    try {
      const [veiculos] = await pool.query(
        "SELECT status FROM veiculos WHERE id = ?",
        [id]
      );
      if (veiculos.length === 0) {
        return res.status(404).json({ message: "Veículo não encontrado." });
      }
      if (veiculos[0].status === "saiu") {
        return res
          .status(400)
          .json({ message: "Este veículo já teve sua saída registrada." });
      }

      const hora_saida = new Date();
      await pool.query(
        "UPDATE veiculos SET status = 'saiu', hora_saida = ?, usuario_saida_id = ? WHERE id = ?",
        [hora_saida, usuario_saida_id, id]
      );
      res
        .status(200)
        .json({ message: "Saída de veículo registrada com sucesso!" });
    } catch (error) {
      console.error("Erro ao registrar saída de veículo:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
);

// Rota para Listar Veículos de um Evento Específico
// Permissão: admin, orientador e manobrista (já estava correto)
router.get(
  "/evento/:idEvento",
  auth,
  authorize("admin", "orientador", "manobrista"),
  async (req, res) => {
    const { idEvento } = req.params;
    const { status, search } = req.query;

    let query = `
    SELECT v.*, u_entrada.nome_usuario AS nome_usuario_entrada, u_saida.nome_usuario AS nome_usuario_saida 
    FROM veiculos v 
    JOIN usuarios u_entrada ON v.usuario_entrada_id = u_entrada.id 
    LEFT JOIN usuarios u_saida ON v.usuario_saida_id = u_saida.id 
    WHERE v.evento_id = ?`;
    let params = [idEvento];

    if (status) {
      query += " AND v.status = ?";
      params.push(status);
    }
    if (search) {
      query += " AND (v.placa LIKE ? OR v.numero_ticket LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY CAST(v.numero_ticket AS UNSIGNED) ASC";

    try {
      const [veiculos] = await pool.query(query, params);
      res.status(200).json(veiculos);
    } catch (error) {
      console.error("Erro ao listar veículos:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
);

module.exports = router;
