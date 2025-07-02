// backend/routes/eventosRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware"); // Importe o roleMiddleware

// Rota para Criar um Novo Evento (Protegida para Orientadores)
router.post("/", authMiddleware, async (req, res) => {
  const { nome_evento, data_evento, local_evento, descricao } = req.body;

  // Verifica se o usuário é um orientador
  if (req.user.cargo !== "orientador") {
    return res.status(403).json({
      message: "Acesso negado. Apenas orientadores podem criar eventos.",
    });
  }

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
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao criar evento." });
  }
});

// Rota para Listar Todos os Eventos (Protegida)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [eventos] = await pool.query(
      "SELECT * FROM eventos ORDER BY data_evento DESC, criado_em DESC"
    );
    res.status(200).json(eventos);
  } catch (error) {
    console.error("Erro ao listar eventos:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao listar eventos." });
  }
});

// Rota para Obter Detalhes de um Evento Específico (Protegida)
router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [eventos] = await pool.query("SELECT * FROM eventos WHERE id = ?", [
      id,
    ]);
    if (eventos.length === 0) {
      return res.status(404).json({ message: "Evento não encontrado." });
    }
    res.status(200).json(eventos[0]);
  } catch (error) {
    console.error("Erro ao obter evento:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao obter evento." });
  }
});
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("orientador"),
  async (req, res) => {
    const { id } = req.params; // Pega o ID do evento da URL
    const userId = req.user.id; // ID do usuário logado (do token)

    console.log(
      `[BACKEND] Recebida requisição DELETE para evento ID: ${id} pelo usuário ID: ${userId}`
    ); // Log A

    try {
      console.log(
        `[BACKEND] Tentando excluir veículos associados ao evento ID: ${id}...`
      ); // Log B
      const [deleteVehiclesResult] = await pool.query(
        "DELETE FROM veiculos WHERE evento_id = ?",
        [id]
      );
      console.log(
        `[BACKEND] ${deleteVehiclesResult.affectedRows} veículos excluídos para o evento ID: ${id}.`
      ); // Log C

      // Agora, exclua o evento
      console.log(`[BACKEND] Tentando excluir evento ID: ${id}...`); // Log D
      const [result] = await pool.query("DELETE FROM eventos WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        console.log(
          `[BACKEND] Evento ID: ${id} não encontrado para exclusão (affectedRows = 0).`
        ); // Log E
        return res.status(404).json({ message: "Evento não encontrado." });
      }

      console.log(
        `[BACKEND] Evento ID: ${id} excluído com sucesso. Affected Rows: ${result.affectedRows}`
      ); // Log F
      res.status(200).json({ message: "Evento excluído com sucesso!" });
    } catch (error) {
      console.error(
        `[BACKEND] ERRO CRÍTICO ao excluir evento ID: ${id}:`,
        error
      ); // Log G
      // Se o erro for de chave estrangeira (mesmo após tentar apagar veículos), isso indicará
      // que há outra tabela referenciando o evento ou que a exclusão de veículos falhou.
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        res.status(409).json({
          message:
            "Não foi possível excluir o evento. Existem registros relacionados em outras tabelas.",
        });
      } else {
        res
          .status(500)
          .json({ message: "Erro interno do servidor ao excluir evento." });
      }
    }
  }
);

module.exports = router;
