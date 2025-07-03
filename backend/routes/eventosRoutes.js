// backend/routes/eventosRoutes.js (VERSÃO FINAL E COMPLETA)

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { auth, authorize } = require("../middleware/authMiddleware");

// Rota para Listar Todos os Eventos
// Permissão: admin e orientador
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

// Rota para Criar um Novo Evento
// Permissão: Apenas admin
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

// Rota para Excluir um Evento
// Permissão: Apenas admin
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

// Rota para Gerar Relatório Completo de um Evento
// Permissão: admin e orientador
router.get(
  "/:id/relatorio",
  auth,
  authorize("admin", "orientador"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const [eventos] = await pool.query("SELECT * FROM eventos WHERE id = ?", [
        id,
      ]);
      if (eventos.length === 0) {
        return res.status(404).json({ message: "Evento não encontrado." });
      }
      const evento = eventos[0];

      const [veiculos] = await pool.query(
        "SELECT * FROM veiculos WHERE evento_id = ? ORDER BY numero_ticket ASC",
        [id]
      );

      const estatisticas = { totalVeiculos: veiculos.length };

      res.status(200).json({ evento, veiculos, estatisticas });
    } catch (error) {
      console.error("Erro ao gerar dados do relatório:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
);

module.exports = router;
