const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { auth, authorize } = require("../middleware/authMiddleware");

// Rota para Listar Todos os Eventos - Sem alterações necessárias para validação de entrada
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

// Rota: Obter o evento atualmente ativo - Sem alterações necessárias para validação de entrada
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

// Rota: Obter Estatísticas do Evento ATIVO - Sem alterações necessárias para validação de entrada
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
  const { nome_evento, data_evento, local_evento, descricao } = req.body;

  // 1. Validação de campos obrigatórios
  if (!nome_evento || !data_evento || !local_evento) {
    return res
      .status(400)
      .json({ message: "Nome, data e local do evento são obrigatórios." });
  }

  // NOVO: Validação de Nome do Evento - Tamanho (mín. 3, máx. 100)
  if (nome_evento.length < 3 || nome_evento.length > 100) {
    return res
      .status(400)
      .json({ message: "Nome do evento deve ter entre 3 e 100 caracteres." });
  }
  // NOVO: Validação de Nome do Evento - Formato (alfanumérico, espaços, hífens)
  if (!/^[a-zA-Z0-9\s-]+$/.test(nome_evento)) {
    return res
      .status(400)
      .json({ message: "Nome do evento contém caracteres inválidos." });
  }

  // NOVO: Validação de Local do Evento - Tamanho (mín. 3, máx. 100)
  if (local_evento.length < 3 || local_evento.length > 100) {
    return res
      .status(400)
      .json({ message: "Local do evento deve ter entre 3 e 100 caracteres." });
  }
  // Validação de Local do Evento - Formato (alfanumérico, espaços, vírgulas, pontos, hífens, e caracteres acentuados)
  // Esta regex substitui a anterior para ser mais abrangente.
  if (!/^[a-zA-Z0-9\s,.\-áàâãéèêíóôõúüçÁÀÂÃÉÈÍÓÔÕÚÜÇ]+$/.test(local_evento)) {
    return res
      .status(400)
      .json({ message: "Local do evento contém caracteres inválidos." });
  }

  // NOVO: Validação de Descrição - Tamanho máximo (máx. 255), se fornecida
  if (descricao && descricao.length > 255) {
    return res.status(400).json({
      message: "Descrição do evento não pode exceder 255 caracteres.",
    });
  }

  // Lógica de data ajustada para comparar strings YYYY-MM-DD
  const today = new Date();
  // Formata a data atual para YYYY-MM-DD no fuso horário local
  const todayString =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  // A data_evento já vem do frontend no formato YYYY-MM-DD
  // Compara as strings diretamente
  if (data_evento < todayString) {
    return res
      .status(400)
      .json({ message: "A data do evento não pode ser uma data passada." });
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
    // Adicione um log mais detalhado para depuração
    console.error("[EVENTOS] Erro ao criar evento:", error);
    // Verifique se o erro é de validação de dados ou outro tipo
    if (error.code === "ER_DATA_TOO_LONG") {
      // Exemplo de erro MySQL para string muito longa
      return res.status(400).json({
        message: "Um dos campos é muito longo para o banco de dados.",
      });
    }
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Rota: Definir um evento como ativo - Sem alterações necessárias para validação de entrada
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

// Rota para Excluir um Evento - Sem alterações necessárias para validação de entrada
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    // NOVO: Verificar se o evento a ser excluído é o evento ativo
    const [activeEvent] = await pool.query(
      "SELECT id FROM eventos WHERE is_active = TRUE LIMIT 1"
    );
    if (activeEvent.length > 0 && activeEvent[0].id == id) {
      return res.status(400).json({
        message: "Não é possível excluir o evento ativo. Desative-o primeiro.",
      });
    }

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
router.get(
  "/:id/relatorio",
  auth,
  authorize("admin", "orientador"),
  async (req, res) => {
    const { id } = req.params;

    try {
      // Buscar detalhes do evento
      const [eventos] = await pool.query("SELECT * FROM eventos WHERE id = ?", [
        id,
      ]);
      const evento = eventos[0];

      if (!evento) {
        return res.status(404).json({ message: "Evento não encontrado." });
      }

      // Buscar veículos associados ao evento, incluindo nomes dos usuários
      const [veiculos] = await pool.query(
        `
        SELECT 
          v.*, 
          u_entrada.nome_usuario AS nome_usuario_entrada, 
          u_saida.nome_usuario AS nome_usuario_saida 
        FROM veiculos v
        JOIN usuarios u_entrada ON v.usuario_entrada_id = u_entrada.id
        LEFT JOIN usuarios u_saida ON v.usuario_saida_id = u_saida.id
        WHERE v.evento_id = ?
        ORDER BY v.hora_entrada ASC
        `,
        [id]
      );

      res.status(200).json({ evento, veiculos });
    } catch (error) {
      console.error(`Erro ao gerar relatório para evento ID ${id}:`, error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
);
module.exports = router;
