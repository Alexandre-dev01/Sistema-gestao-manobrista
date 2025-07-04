const express = require("express");
const pool = require("../config/db");
const router = express.Router();
const { auth, authorize } = require("../middleware/authMiddleware");

// Rota para Registrar a Entrada de um Veículo
router.post(
  "/entrada",
  auth,
  authorize("admin", "orientador", "manobrista"),
  async (req, res) => {
    const {
      evento_id,
      numero_ticket,
      modelo,
      cor,
      placa,
      localizacao,
      observacoes,
    } = req.body;
    const usuario_entrada_id = req.user.id;

    // --- INÍCIO DA DEPURACAO (MANTIDO PARA VERIFICAR A LIMPEZA) ---
    console.log("------------------------------------");
    console.log("Dados recebidos no backend para veículo:");
    console.log("evento_id:", evento_id);
    console.log("numero_ticket:", numero_ticket);
    console.log("modelo:", modelo);
    console.log("cor:", cor);
    console.log("placa recebida (original):", placa);
    console.log("tipo da placa (original):", typeof placa);
    console.log(
      "tamanho da placa (original):",
      placa ? placa.length : "null/undefined"
    );

    const cleanedPlaca = String(placa)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

    console.log("placa limpa para validação:", cleanedPlaca);
    console.log("tamanho da placa limpa:", cleanedPlaca.length);
    // --- FIM DA CORREÇÃO ---

    // --- INÍCIO DAS VALIDAÇÕES DE REGRA DE NEGÓCIO ---

    // 1. Validação de Campos Obrigatórios
    if (
      !evento_id ||
      !numero_ticket.trim() || // Garante que não é apenas espaços em branco
      !modelo.trim() ||
      !cor.trim() ||
      !cleanedPlaca.trim() || // Usa a placa limpa para validação de obrigatoriedade
      !localizacao.trim()
    ) {
      return res.status(400).json({
        message: "Todos os campos são obrigatórios e não podem ser vazios.",
      });
    }

    // NOVO: Validação de Número do Ticket - Tamanho (mín. 1, máx. 10)
    if (numero_ticket.length < 1 || numero_ticket.length > 10) {
      return res.status(400).json({
        message: "Número do Ticket deve ter entre 1 e 10 caracteres.",
      });
    }
    // NOVO: Validação de Número do Ticket - Formato (alfanumérico, pode incluir hífens)
    if (!/^[a-zA-Z0-9-]+$/.test(numero_ticket)) {
      return res.status(400).json({
        message:
          "Número do Ticket contém caracteres inválidos. Use apenas letras, números ou hífens.",
      });
    }

    // 2. Validação de Modelo
    if (modelo.length < 2 || modelo.length > 50) {
      return res
        .status(400)
        .json({ message: "Modelo deve ter entre 2 e 50 caracteres." });
    }
    if (!/^[a-zA-Z0-9\s-]+$/.test(modelo)) {
      return res
        .status(400)
        .json({ message: "Modelo contém caracteres inválidos." });
    }

    // 3. Validação de Cor
    if (cor.length < 2 || cor.length > 20) {
      return res
        .status(400)
        .json({ message: "Cor deve ter entre 2 e 20 caracteres." });
    }
    if (!/^[a-zA-Z\s]+$/.test(cor)) {
      return res
        .status(400)
        .json({ message: "Cor contém caracteres inválidos." });
    }

    // 4. Validação de Placa (AGORA USANDO cleanedPlaca)
    if (cleanedPlaca.length !== 7) {
      return res
        .status(400)
        .json({ message: "Placa deve ter exatamente 7 caracteres." });
    }
    if (!/^[a-zA-Z0-9]+$/.test(cleanedPlaca)) {
      // Garante que é alfanumérico após a limpeza
      return res
        .status(400)
        .json({ message: "Placa contém caracteres inválidos." });
    }

    // 5. Validação de Localização
    if (localizacao.length < 1 || localizacao.length > 50) {
      return res
        .status(400)
        .json({ message: "Localização deve ter entre 1 e 50 caracteres." });
    }
    if (!/^[a-zA-Z0-9\s\/-]+$/.test(localizacao)) {
      return res
        .status(400)
        .json({ message: "Localização contém caracteres inválidos." });
    }
    if (observacoes && observacoes.length > 255) {
      return res
        .status(400)
        .json({ message: "Observações não podem exceder 255 caracteres." });
    }

    // --- FIM DAS VALIDAÇÕES DE REGRA DE NEGÓCIO ---

    try {
      // Validação de Ticket Único por Evento
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
        "INSERT INTO veiculos (evento_id, numero_ticket, modelo, cor, placa, localizacao, hora_entrada, usuario_entrada_id, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          evento_id,
          numero_ticket,
          modelo,
          cor,
          cleanedPlaca,
          localizacao,
          hora_entrada,
          usuario_entrada_id,
          observacoes || null, // Se observacoes for uma string vazia, insere NULL no banco
        ]
      );
      res.status(201).json({
        message: "Veículo registrado com sucesso!",
        veiculoId: result.insertId,
      });
    } catch (error) {
      console.error("[VEICULOS] Erro ao registrar entrada de veículo:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
);

// Rota para Registrar a Saída de um Veículo
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
