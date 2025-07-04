// Arquivo: dashboard.js (VERSÃO FINAL E SIMPLIFICADA)

document.addEventListener("DOMContentLoaded", () => {
  // --- BLOCO DE VERIFICAÇÃO SIMPLIFICADO ---
  const {
    token,
    user,
    activeEventDetails: initialActiveEventDetails,
  } = verificarAutenticacao();
  if (!user) return; // Para a execução se o usuário não for autenticado
  // --- FIM DO BLOCO ---

  // Permite que a variável seja atualizada depois
  let activeEventDetails = initialActiveEventDetails;

  // --- ELEMENTOS DA PÁGINA ---
  const activeEventDisplay = document.getElementById("activeEventDisplay");
  const activeEventNameSpan = document.getElementById("activeEventName");
  const activeEventLocationSpan = document.getElementById(
    "activeEventLocation"
  );
  const activeEventDateSpan = document.getElementById("activeEventDate");
  const changeEventBtn = document.getElementById("changeEventBtn");
  const statsContainer = document.getElementById("statsContainer");

  const cards = {
    eventos: document.getElementById("cardEventos"),
    relatorios: document.getElementById("cardRelatorios"),
    registrarEntrada: document.getElementById("cardRegistrarEntrada"),
    consultaVeiculos: document.getElementById("cardConsultaVeiculos"),
    registroMassa: document.getElementById("cardRegistroMassa"),
    cadastrarUsuario: document.getElementById("cardCadastrarUsuario"),
  };

  const eventModal = document.getElementById("eventSelectorModal");
  const closeModalBtn = document.querySelector(".close-button");
  const modalEventList = document.getElementById("modalEventList");
  const selectEventButton = document.getElementById("selectEventButton");

  let selectedEventInModal = null;

  function setupPermissions() {
    const cargo = user.cargo;
    if (!cargo) return;

    Object.values(cards).forEach((card) => {
      if (card) card.style.display = "none";
    });

    switch (cargo) {
      case "admin":
        Object.values(cards).forEach((card) => {
          if (card) card.style.display = "block";
        });
        break;
      case "orientador":
        if (cards.eventos) cards.eventos.style.display = "block";
        if (cards.relatorios) cards.relatorios.style.display = "block";
        if (cards.registrarEntrada)
          cards.registrarEntrada.style.display = "block";
        if (cards.consultaVeiculos)
          cards.consultaVeiculos.style.display = "block";
        if (cards.registroMassa) cards.registroMassa.style.display = "block";
        break;
      case "manobrista":
        if (cards.registrarEntrada)
          cards.registrarEntrada.style.display = "block";
        if (cards.consultaVeiculos)
          cards.consultaVeiculos.style.display = "block";
        break;
    }
  }

  async function loadStats() {
    if (
      (user.cargo !== "admin" && user.cargo !== "orientador") ||
      !statsContainer
    ) {
      if (statsContainer) statsContainer.style.display = "none";
      return;
    }

    if (!activeEventDetails) {
      statsContainer.style.display = "none";
      return;
    }

    statsContainer.innerHTML = "<p>Carregando estatísticas...</p>";
    statsContainer.style.display = "grid";

    try {
      const response = await fetch(`${API_BASE_URL}/api/eventos/ativo/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha na resposta da API");
      }
      const stats = await response.json();
      statsContainer.innerHTML = `
        <div class="metric-card purple"><div class="metric-value">${stats.veiculosEstacionados}</div><div class="metric-label">Veículos Estacionados</div></div>
        <div class="metric-card green"><div class="metric-value">${stats.veiculosSaida}</div><div class="metric-label">Saídas Registradas</div></div>
        <div class="metric-card blue"><div class="metric-value">${stats.totalVeiculos}</div><div class="metric-label">Total de Veículos</div></div>
      `;
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      statsContainer.style.display = "block";
      statsContainer.innerHTML = `<p style="color: #ffbaba; grid-column: 1 / -1; text-align: center;">Não foi possível carregar as estatísticas.</p>`;
    }
  }

  function displayActiveEvent() {
    activeEventDetails = JSON.parse(localStorage.getItem("activeEventDetails"));
    if (activeEventDetails) {
      activeEventDisplay.style.display = "block";
      activeEventNameSpan.textContent = activeEventDetails.nome_evento;
      activeEventLocationSpan.textContent = activeEventDetails.local_evento;
      activeEventDateSpan.textContent = new Date(
        activeEventDetails.data_evento
      ).toLocaleDateString("pt-BR");
      loadStats();
    } else {
      activeEventDisplay.style.display = "none";
      if (statsContainer) statsContainer.style.display = "none";
    }
  }

  async function openEventModal() {
    eventModal.style.display = "flex";
    modalEventList.innerHTML = "<p>Carregando eventos...</p>";
    selectEventButton.disabled = true;
    selectedEventInModal = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/eventos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Falha ao buscar eventos.");
      const events = await response.json();
      modalEventList.innerHTML = "";
      if (events.length === 0) {
        modalEventList.innerHTML = "<p>Nenhum evento cadastrado.</p>";
        return;
      }
      events.forEach((event) => {
        const eventItem = document.createElement("div");
        eventItem.className = "modal-event-item";
        eventItem.textContent = `${event.nome_evento} (${
          event.local_evento
        }) - ${new Date(event.data_evento).toLocaleDateString("pt-BR")}`;
        eventItem.dataset.eventDetails = JSON.stringify(event);
        if (event.is_active) {
          eventItem.classList.add("selected");
        }
        eventItem.addEventListener("click", () => {
          document
            .querySelectorAll(".modal-event-item")
            .forEach((item) => item.classList.remove("selected"));
          eventItem.classList.add("selected");
          selectedEventInModal = JSON.parse(eventItem.dataset.eventDetails);
          selectEventButton.disabled = false;
        });
        modalEventList.appendChild(eventItem);
      });
    } catch (error) {
      console.error("Erro ao carregar eventos no modal:", error);
      modalEventList.innerHTML =
        "<p>Erro ao carregar eventos. Tente novamente.</p>";
    }
  }

  function closeEventModal() {
    eventModal.style.display = "none";
  }

  async function confirmEventSelection() {
    if (selectedEventInModal) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/eventos/${selectedEventInModal.id}/ativar`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok)
          throw new Error("Falha ao definir o evento como ativo.");
        localStorage.setItem("activeEventId", selectedEventInModal.id);
        localStorage.setItem(
          "activeEventDetails",
          JSON.stringify(selectedEventInModal)
        );
        displayActiveEvent();
        closeEventModal();
      } catch (error) {
        console.error("Erro ao ativar evento:", error);
        Swal.fire(
          "Erro",
          "Não foi possível ativar o evento selecionado.",
          "error"
        );
      }
    }
  }

  Object.keys(cards).forEach((key) => {
    if (cards[key]) {
      cards[key].addEventListener("click", () => {
        const pageMap = {
          eventos: "eventos.html",
          relatorios: "eventos.html",
          registrarEntrada: "entrada_veiculo.html",
          consultaVeiculos: "consulta_veiculos.html",
          registroMassa: "registro_massa_veiculos.html",
          cadastrarUsuario: "cadastro_usuario.html",
        };
        if (pageMap[key]) window.location.href = pageMap[key];
      });
    }
  });

  if (changeEventBtn) changeEventBtn.addEventListener("click", openEventModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeEventModal);
  if (selectEventButton)
    selectEventButton.addEventListener("click", confirmEventSelection);
  window.addEventListener("click", (event) => {
    if (event.target === eventModal) closeEventModal();
  });

  setupPermissions();
  displayActiveEvent();
});
