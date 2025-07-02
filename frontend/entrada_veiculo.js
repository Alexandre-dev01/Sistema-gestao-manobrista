// frontend/entrada_veiculo.js
document.addEventListener("DOMContentLoaded", async () => {
  const entradaVeiculoForm = document.getElementById("entradaVeiculoForm");
  const numeroTicketInput = document.getElementById("numeroTicket");
  const modeloCarroInput = document.getElementById("modeloCarro");
  const corCarroInput = document.getElementById("corCarro");
  const placaCarroInput = document.getElementById("placaCarro");
  const localizacaoCarroInput = document.getElementById("localizacaoCarro");
  const messageDisplay = document.getElementById("message");

  const activeEventNameSpan = document.getElementById("activeEventName");
  const activeEventLocationSpan = document.getElementById(
    "activeEventLocation"
  );
  const activeEventDateSpan = document.getElementById("activeEventDate");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const activeEventId = localStorage.getItem("activeEventId");
  const activeEventDetails = JSON.parse(
    localStorage.getItem("activeEventDetails")
  );

  // Redireciona se não estiver logado ou se não houver evento ativo
  if (!token || !user) {
    alert("Você precisa estar logado para acessar esta página.");
    window.location.href = "login.html";
    return;
  }
  if (!activeEventId || !activeEventDetails) {
    alert(
      "Nenhum evento ativo selecionado. Por favor, selecione um evento primeiro."
    );
    window.location.href = "eventos.html"; // Redireciona para a página de eventos
    return;
  }

  // Exibe os detalhes do evento ativo
  activeEventNameSpan.textContent = activeEventDetails.nome_evento;
  activeEventLocationSpan.textContent = activeEventDetails.local_evento;
  activeEventDateSpan.textContent = new Date(
    activeEventDetails.data_evento
  ).toLocaleDateString("pt-BR");

  entradaVeiculoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    messageDisplay.textContent = "";
    messageDisplay.classList.remove("success-message", "error-message");

    const numero_ticket = numeroTicketInput.value;
    const modelo = modeloCarroInput.value;
    const cor = corCarroInput.value;
    const placa = placaCarroInput.value;
    const localizacao = localizacaoCarroInput.value;

    // --- ADICIONADO: LOGS PARA DEPURAR OS DADOS ENVIADOS ---
    console.log("[FRONTEND - Registrar Entrada Individual]");
    console.log("Evento ID Ativo:", activeEventId);
    console.log("Dados do Veículo a ser enviado:", {
      numero_ticket,
      modelo,
      cor,
      placa,
      localizacao,
    });
    // --- FIM DOS LOGS ---

    try {
      const response = await fetch(
        "http://localhost:3000/api/veiculos/entrada",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            evento_id: activeEventId, // CORRIGIDO AQUI: de id_evento para evento_id
            numero_ticket,
            modelo,
            cor,
            placa,
            localizacao,
          }),
        }
      );

      // --- ADICIONADO: LOGS PARA RESPOSTA DO BACKEND ---
      console.log(
        "[FRONTEND - Registrar Entrada Individual] Resposta do Backend:"
      );
      console.log("Status:", response.status);
      const data = await response.json();
      console.log("Dados da Resposta:", data);
      // --- FIM DOS LOGS ---

      if (response.ok) {
        messageDisplay.textContent = data.message;
        messageDisplay.classList.add("success-message");
        entradaVeiculoForm.reset(); // Limpa o formulário
        numeroTicketInput.focus(); // Coloca o foco no primeiro campo para agilizar
      } else {
        messageDisplay.textContent =
          data.message || "Erro ao registrar veículo.";
        messageDisplay.classList.add("error-message");
      }
    } catch (error) {
      console.error("Erro de rede ao registrar veículo:", error);
      messageDisplay.textContent = "Erro de conexão ao registrar veículo.";
      messageDisplay.classList.add("error-message");
    }
  });
});
