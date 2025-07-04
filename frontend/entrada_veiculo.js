document.addEventListener("DOMContentLoaded", () => {
  // --- BLOCO DE VERIFICAÇÃO SIMPLIFICADO ---
  const { token, user, activeEventId, activeEventDetails } =
    verificarAutenticacao();
  if (!user) return; // Para a execução
  // --- FIM DO BLOCO ---

  const entradaVeiculoForm = document.getElementById("entradaVeiculoForm");
  if (!entradaVeiculoForm) return;

  // Validação de evento ativo
  if (!activeEventId || !activeEventDetails) {
    Swal.fire({
      icon: "warning",
      title: "Nenhum Evento Ativo",
      text: "Por favor, selecione um evento antes de registrar um veículo.",
      confirmButtonText: "Selecionar Evento",
    }).then(() => {
      window.location.href = "dashboard.html";
    });
    return;
  }

  // --- ALTERAÇÃO 1: Selecionar o novo campo ---
  const numeroTicketInput = document.getElementById("numeroTicket");
  const modeloCarroInput = document.getElementById("modeloCarro");
  const corCarroInput = document.getElementById("corCarro");
  const placaCarroInput = document.getElementById("placaCarro");
  const localizacaoCarroInput = document.getElementById("localizacaoCarro");
  const observacoesCarroInput = document.getElementById("observacoesCarro"); // NOVO CAMPO
  // --- FIM DA ALTERAÇÃO 1 ---

  document.getElementById("activeEventName").textContent =
    activeEventDetails.nome_evento;
  document.getElementById("activeEventLocation").textContent =
    activeEventDetails.local_evento;
  document.getElementById("activeEventDate").textContent = new Date(
    activeEventDetails.data_evento
  ).toLocaleDateString("pt-BR");

  const placaMask = IMask(placaCarroInput, {
    mask: "AAA-0*00",
    definitions: { A: /[A-Z]/, 0: /[0-9]/, "*": /[A-Z0-9]/ },
    prepare: (str) => str.toUpperCase(),
  });

  numeroTicketInput.focus();
  placaCarroInput.addEventListener("keyup", () => {
    if (placaMask.unmaskedValue.length === 7) {
      localizacaoCarroInput.focus();
    }
  });

  entradaVeiculoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    // --- ALTERAÇÃO 2: Incluir o valor do novo campo no objeto a ser enviado ---
    const veiculo = {
      evento_id: activeEventId,
      numero_ticket: numeroTicketInput.value,
      modelo: modeloCarroInput.value,
      cor: corCarroInput.value,
      placa: placaMask.unmaskedValue,
      localizacao: localizacaoCarroInput.value,
      observacoes: observacoesCarroInput.value, // NOVO CAMPO
    };
    // --- FIM DA ALTERAÇÃO 2 ---

    try {
      const response = await fetch(`${API_BASE_URL}/api/veiculos/entrada`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(veiculo),
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Veículo Registrado!",
          text: data.message,
          timer: 2000,
          showConfirmButton: false,
        });
        entradaVeiculoForm.reset();
        placaMask.updateValue("");
        numeroTicketInput.focus();
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro ao Registrar",
          text: data.message || "Não foi possível registrar o veículo.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro de Conexão",
        text: "Não foi possível conectar ao servidor.",
      });
    } finally {
      submitButton.disabled = false;
    }
  });

  corCarroInput.addEventListener("input", (event) => {
    const originalValue = event.target.value;
    const cleanedValue = originalValue.replace(/[^a-zA-Z\s]/g, "");
    if (originalValue !== cleanedValue) {
      event.target.value = cleanedValue;
    }
  });
});
