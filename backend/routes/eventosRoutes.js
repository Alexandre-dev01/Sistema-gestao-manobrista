const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { auth, authorize } = require("../middleware/authMiddleware");

// Rota para Listar Todos os Eventos
router.get("/", auth, authorize("admin", "orientador"), async (req, res) => {
  try {
    const [eventos] = await pool.query(
      "SELECT * FROM eventos ORDER BY data_evento DESC, criado_em DESC"
    );
    res.status(200).json(eventos);
  } catch (error) {
    console.error("Erro ao listar eventos:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Rota: Obter o evento atualmente ativo
router.get("/ativo", auth, async (req, res) => {
  try {
    const [eventos] = await pool.query(
      "SELECT * FROM eventos WHERE is_active = TRUE LIMIT 1"
    );
    if (eventos.length === 0) {
      return res.status(200).json(null);
    }
    res.status(200).json(eventos[0]);
  } catch (error) {
    console.error("Erro ao obter evento ativo:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Rota: Obter Estatísticas do Evento ATIVO
router.get(
  "/ativo/stats",
  auth,
  authorize("admin", "orientador"),
  async (req, res) => {
    try {
      const [activeEvent] = await pool.query(
        "SELECT id FROM eventos WHERE is_active = TRUE LIMIT 1"
      );

      if (activeEvent.length === 0) {
        return res.status(200).json({
          totalVeiculos: 0,
          veiculosEstacionados: 0,
          veiculosSaida: 0,
        });
      }
      const eventoId = activeEvent[0].id;

      const [stats] = await pool.query(
        `SELECT 
          COUNT(*) AS totalVeiculos,
          SUM(CASE WHEN status = 'estacionado' THEN 1 ELSE 0 END) AS veiculosEstacionados,
          SUM(CASE WHEN status = 'saiu' THEN 1 ELSE 0 END) AS veiculosSaida
        FROM veiculos 
        WHERE evento_id = ?`,
        [eventoId]
      );

      const result = {
        totalVeiculos: stats[0].totalVeiculos || 0,
        veiculosEstacionados: stats[0].veiculosEstacionados || 0,
        veiculosSaida: stats[0].veiculosSaida || 0,
      };

      res.status(200).json(result);
    } catch (error) {
      console.error("Erro ao obter estatísticas do evento ativo:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
);

// Rota para Criar um Novo Evento
router.post("/", auth, authorize("admin"), async (req, res) => {
  const {
    nome_evento,
    data_evento,
    data_fim,
    hora_inicio,
    hora_fim,
    local_evento,
    descricao,
  } = req.body;

  if (!nome_evento || !data_evento || !local_evento) {
    return res.status(400).json({
      message: "Nome, data de início e local do evento são obrigatórios.",
    });
  }

  // Validação do Nome do Evento
  if (nome_evento.length < 3 || nome_evento.length > 100) {
    return res
      .status(400)
      .json({ message: "Nome do evento deve ter entre 3 e 100 caracteres." });
  }

  // ALTERADO: Expressão regular para aceitar letras com acentuação, números, espaços e hífens.
  if (!/^[\p{L}\p{N}\s-]+$/u.test(nome_evento)) {
    return res.status(400).json({
      message:
        "Nome do evento contém caracteres inválidos. Use apenas letras, números, espaços e hífens.",
    });
  }

  if (/^\d+$/.test(nome_evento)) {
    return res
      .status(400)
      .json({ message: "Nome do evento não pode ser apenas numérico." });
  }

  // Validação do Local do Evento
  if (local_evento.length < 3 || local_evento.length > 100) {
    return res
      .status(400)
      .json({ message: "Local do evento deve ter entre 3 e 100 caracteres." });
  }

  // ALTERADO: Expressão regular para aceitar letras com acentuação, números, espaços e outros caracteres comuns em endereços.
  if (!/^[\p{L}\p{N}\s,.-]+$/u.test(local_evento)) {
    return res
      .status(400)
      .json({ message: "Local do evento contém caracteres inválidos." });
  }

  // Validação da Descrição
  if (descricao && descricao.length > 255) {
    return res.status(400).json({
      message: "Descrição do evento não pode exceder 255 caracteres.",
    });
  }

  // --- VALIDAÇÃO DE DATAS E HORAS ---
  const now = new Date();
  now.setSeconds(0, 0);

  const eventStartDate = new Date(data_evento);
  eventStartDate.setHours(0, 0, 0, 0);

  let finalDataFim = data_fim || data_evento;
  const eventEndDate = new Date(finalDataFim);
  eventEndDate.setHours(0, 0, 0, 0);

  const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/;
  if (
    (hora_inicio && !timeRegex.test(hora_inicio)) ||
    (hora_fim && !timeRegex.test(hora_fim))
  ) {
    return res
      .status(400)
      .json({ message: "Formato de hora inválido. Use HH:MM." });
  }

  const eventStartDateTime = new Date(`${data_evento}T${hora_inicio}:00`);
  const eventEndDateTime = new Date(`${finalDataFim}T${hora_fim}:00`);

  if (eventEndDate < eventStartDate) {
    return res.status(400).json({
      message: "A data de fim não pode ser anterior à data de início.",
    });
  }

  if (eventEndDate.getTime() === eventStartDate.getTime()) {
    if (eventEndDateTime <= eventStartDateTime) {
      return res.status(400).json({
        message:
          "Para eventos no mesmo dia, a hora de fim deve ser posterior à hora de início.",
      });
    }
  }

  const todayDateOnly = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  if (eventStartDate < todayDateOnly) {
    return res.status(400).json({
      message: "A data de início do evento não pode ser uma data passada.",
    });
  }

  if (eventStartDate.getTime() === todayDateOnly.getTime()) {
    if (eventStartDateTime < now) {
      return res.status(400).json({
        message:
          "Para eventos que começam hoje, a hora de início não pode ser passada.",
      });
    }
  }

  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
  maxFutureDate.setHours(23, 59, 59, 999);

  if (eventStartDateTime > maxFutureDate) {
    return res.status(400).json({
      message:
        "A data de início do evento não pode exceder 12 meses a partir da data atual.",
    });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO eventos (nome_evento, data_evento, data_fim, hora_inicio, hora_fim, local_evento, descricao) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        nome_evento,
        data_evento,
        finalDataFim,
        hora_inicio,
        hora_fim,
        local_evento,
        descricao,
      ]
    );
    res.status(201).json({
      message: "Evento criado com sucesso!",
      eventoId: result.insertId,
    });
  } catch (error) {
    console.error("[EVENTOS] Erro ao criar evento:", error);
    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        message: "Um dos campos é muito longo para o banco de dados.",
      });
    }
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Rota: Definir um evento como ativo
router.put(
  "/:id/ativar",
  auth,
  authorize("admin", "orientador"),
  async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        "UPDATE eventos SET is_active = FALSE WHERE is_active = TRUE"
      );
      const [result] = await connection.query(
        "UPDATE eventos SET is_active = TRUE WHERE id = ?",
        [id]
      );
      await connection.commit();

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Evento não encontrado." });
      }
      const [activatedEvent] = await connection.query(
        "SELECT * FROM eventos WHERE id = ?",
        [id]
      );
      res.status(200).json({
        message: "Evento definido como ativo com sucesso!",
        event: activatedEvent[0],
      });
    } catch (error) {
      await connection.rollback();
      console.error("Erro ao ativar evento:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    } finally {
      connection.release();
    }
  }
);

// Rota para Excluir um Evento
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const [eventos] = await pool.query(
      "SELECT is_active FROM eventos WHERE id = ?",
      [id]
    );
    if (eventos.length === 0) {
      return res.status(404).json({ message: "Evento não encontrado." });
    }
    if (eventos[0].is_active) {
      return res.status(400).json({
        message:
          "Não é possível excluir um evento que está ativo. Desative-o primeiro.",
      });
    }

    await pool.query("DELETE FROM veiculos WHERE evento_id = ?", [id]);
    const [result] = await pool.query("DELETE FROM eventos WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Evento não encontrado." });
    }
    res.status(200).json({ message: "Evento excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Rota para Gerar Relatório Completo de um Evento
router.get(
  "/:id/relatorio",
  auth,
  authorize("admin", "orientador"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const [evento] = await pool.query("SELECT * FROM eventos WHERE id = ?", [
        id,
      ]);
      if (evento.length === 0) {
        return res.status(404).json({ message: "Evento não encontrado." });
      }

      const [veiculos] = await pool.query(
        `SELECT 
          v.*, 
          u_entrada.nome_usuario AS nome_usuario_entrada, 
          u_saida.nome_usuario AS nome_usuario_saida 
        FROM veiculos v 
        JOIN usuarios u_entrada ON v.usuario_entrada_id = u_entrada.id 
        LEFT JOIN usuarios u_saida ON v.usuario_saida_id = u_saida.id 
        WHERE v.evento_id = ?
        ORDER BY v.hora_entrada ASC`,
        [id]
      );

      res.status(200).json({ evento: evento[0], veiculos });
    } catch (error) {
      console.error("Erro ao gerar relatório do evento:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
);

// Rota para Desativar o Evento Ativo
router.put(
  "/desativar",
  auth,
  authorize("admin", "orientador"),
  async (req, res) => {
    try {
      const [result] = await pool.query(
        "UPDATE eventos SET is_active = FALSE WHERE is_active = TRUE"
      );

      if (result.affectedRows === 0) {
        return res
          .status(200)
          .json({ message: "Nenhum evento ativo para desativar." });
      }

      res.status(200).json({ message: "Evento desativado com sucesso!" });
    } catch (error) {
      console.error("Erro ao desativar evento:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
);

module.exports = router;
