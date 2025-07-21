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

router.post("/", auth, authorize("admin"), async (req, res) => {
  const {
    nome_evento,
    data_evento, // Formato esperado: "AAAA-MM-DD"
    data_fim,
    hora_inicio, // Formato esperado: "HH:MM"
    hora_fim,
    local_evento,
    descricao,
  } = req.body;

  // Validações de campos obrigatórios
  if (
    !nome_evento ||
    !data_evento ||
    !data_fim ||
    !hora_inicio ||
    !hora_fim ||
    !local_evento
  ) {
    return res.status(400).json({
      message: "Todos os campos (exceto descrição) são obrigatórios.",
    });
  }

  const eventStartDateTime = new Date(`${data_evento}T${hora_inicio}:00`);
  const eventEndDateTime = new Date(`${data_fim}T${hora_fim}:00`);

  // Validação 1: Fim deve ser depois do Início.
  if (eventEndDateTime <= eventStartDateTime) {
    return res.status(400).json({
      message:
        "A data e hora de fim devem ser posteriores à data e hora de início.",
    });
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataInicioEvento = new Date(data_evento);
  dataInicioEvento.setHours(0, 0, 0, 0);

  dataInicioEvento.setDate(dataInicioEvento.getDate() + 1);

  if (dataInicioEvento < hoje) {
    return res.status(400).json({
      message: "A data de início do evento não pode ser um dia passado.",
    });
  }

  // Validação 3: Não permitir eventos com mais de 12 meses de antecedência.
  const dataMaxima = new Date();
  dataMaxima.setFullYear(dataMaxima.getFullYear() + 1);

  if (eventStartDateTime > dataMaxima) {
    return res.status(400).json({
      message:
        "A data de início do evento não pode exceder 12 meses a partir de hoje.",
    });
  }
  const agora = new Date();
  // Se o evento for hoje, a hora de início não pode ser passada.
  if (
    dataInicioEvento.getTime() === hoje.getTime() &&
    eventStartDateTime < agora
  ) {
    return res.status(400).json({
      message:
        "Para eventos que começam hoje, a hora de início não pode ser passada.",
    });
  }

  // Validações de texto
  if (nome_evento.length < 3 || nome_evento.length > 100) {
    return res
      .status(400)
      .json({ message: "Nome do evento deve ter entre 3 e 100 caracteres." });
  }
  if (local_evento.length < 3 || local_evento.length > 100) {
    return res
      .status(400)
      .json({ message: "Local do evento deve ter entre 3 e 100 caracteres." });
  }

  try {
    // Verifica se já existe um evento com o mesmo nome na mesma data de início.
    const [existingEvent] = await pool.query(
      "SELECT id FROM eventos WHERE nome_evento = ? AND data_evento = ?",
      [nome_evento, data_evento]
    );

    // Se a busca retornar algum resultado (comprimento maior que 0), o evento já existe.
    if (existingEvent.length > 0) {
      return res.status(409).json({
        // 409 Conflict
        message:
          "Já existe um evento com este nome na data de início especificada.",
      });
    }
    const [result] = await pool.query(
      "INSERT INTO eventos (nome_evento, data_evento, data_fim, hora_inicio, hora_fim, local_evento, descricao) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        nome_evento,
        data_evento,
        data_fim,
        hora_inicio,
        hora_fim,
        local_evento,
        descricao || null,
      ]
    );
    res.status(201).json({
      message: "Evento criado com sucesso!",
      eventoId: result.insertId,
    });
  } catch (error) {
    console.error("[EVENTOS] Erro ao criar evento:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Já existe um evento com este nome nesta data." });
    }
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao criar o evento." });
  }
});
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
        `SELECT COUNT(*) AS totalVeiculos, SUM(CASE WHEN status = 'estacionado' THEN 1 ELSE 0 END) AS veiculosEstacionados, SUM(CASE WHEN status = 'saiu' THEN 1 ELSE 0 END) AS veiculosSaida FROM veiculos WHERE evento_id = ?`,
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
        `SELECT v.*, u_entrada.nome_usuario AS nome_usuario_entrada, u_saida.nome_usuario AS nome_usuario_saida FROM veiculos v JOIN usuarios u_entrada ON v.usuario_entrada_id = u_entrada.id LEFT JOIN usuarios u_saida ON v.usuario_saida_id = u_saida.id WHERE v.evento_id = ? ORDER BY v.hora_entrada ASC`,
        [id]
      );
      res.status(200).json({ evento: evento[0], veiculos });
    } catch (error) {
      console.error("Erro ao gerar relatório do evento:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
);

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
