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

// --- NOVA ROTA CORRIGIDA: Obter Estatísticas do Evento ATIVO ---
// Acessível por admin e orientador. Perfeita para o dashboard.
router.get(
  "/ativo/stats",
  auth,
  authorize("admin", "orientador"),
  async (req, res) => {
    try {
      // Primeiro, encontra o evento ativo
      const [activeEvent] = await pool.query(
        "SELECT id FROM eventos WHERE is_active = TRUE LIMIT 1"
      );

      if (activeEvent.length === 0) {
        // Se não há evento ativo, retorna estatísticas zeradas.
        return res.status(200).json({
          totalVeiculos: 0,
          veiculosEstacionados: 0,
          veiculosSaida: 0,
        });
      }
      const eventoId = activeEvent[0].id;

      // Agora, busca as estatísticas para esse evento
      const [stats] = await pool.query(
        `SELECT 
          COUNT(*) AS totalVeiculos,
          SUM(CASE WHEN status = 'estacionado' THEN 1 ELSE 0 END) AS veiculosEstacionados,
          SUM(CASE WHEN status = 'saiu' THEN 1 ELSE 0 END) AS veiculosSaida
        FROM veiculos 
        WHERE evento_id = ?`,
        [eventoId]
      );

      // A query sempre retorna uma linha, mesmo que os valores sejam 0 ou NULL.
      // Tratamos o caso de NULL (se não houver veículos) para retornar 0.
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
  const { nome_evento, data_evento, local_evento, descricao } = req.body;
  if (!nome_evento || !data_evento || !local_evento) {
    return res
      .status(400)
      .json({ message: "Nome, data e local do evento são obrigatórios." });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO eventos (nome_evento, data_evento, local_evento, descricao) VALUES (?, ?, ?, ?)",
      [nome_evento, data_evento, local_evento, descricao]
    );
    res.status(201).json({
      message: "Evento criado com sucesso!",
      eventoId: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao criar evento:", error);
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
      res
        .status(200)
        .json({ message: "Evento definido como ativo com sucesso!" });
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
    await pool.query("DELETE FROM veiculos WHERE evento_id = ?", [id]);
    const [result] = await pool.query("DELETE FROM eventos WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Evento não encontrado." });
    }
    res
      .status(200)
      .json({ message: "Evento e veículos associados foram excluídos." });
  } catch (error) {
    console.error(`Erro ao excluir evento ID ${id}:`, error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Rota para Gerar Relatório Completo de um Evento (mantida para referência)
router.get(
  "/:id/relatorio",
  auth,
  authorize("admin", "orientador"),
  async (req, res) => {
    // ... (código da rota de relatório permanece o mesmo)
  }
);

module.exports = router;
