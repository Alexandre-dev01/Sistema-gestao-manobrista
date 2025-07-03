// frontend/dashboard.js (VERSÃO FINAL E COMPLETA)

document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTOS DA PÁGINA ---
  const activeEventDisplay = document.getElementById("activeEventDisplay");
  const activeEventNameSpan = document.getElementById("activeEventName");
  const activeEventLocationSpan = document.getElementById(
    "activeEventLocation"
  );
  const activeEventDateSpan = document.getElementById("activeEventDate");
  const changeEventBtn = document.getElementById("changeEventBtn");
  const statsContainer = document.getElementById("statsContainer");

  // --- ELEMENTOS DOS CARDS ---
  const cards = {
    eventos: document.getElementById("cardEventos"),
    relatorios: document.getElementById("cardRelatorios"),
    registrarEntrada: document.getElementById("cardRegistrarEntrada"),
    consultaVeiculos: document.getElementById("cardConsultaVeiculos"),
    registroMassa: document.getElementById("cardRegistroMassa"),
    cadastrarUsuario: document.getElementById("cardCadastrarUsuario"),
  };

  // --- ELEMENTOS DO MODAL ---
  const eventModal = document.getElementById("eventSelectorModal");
  const closeModalBtn = document.querySelector(".close-button");
  const modalEventList = document.getElementById("modalEventList");
  const selectEventButton = document.getElementById("selectEventButton");

  // --- DADOS DA SESSÃO ---
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  let activeEventDetails = JSON.parse(
    localStorage.getItem("activeEventDetails")
  );
  let selectedEventInModal = null;

  // --- VALIDAÇÃO INICIAL ---
  if (!user || !token) {
    window.location.href = "login.html";
    return;
  }

  // --- LÓGICA DE PERMISSÕES ---
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
        if (cards.relatorios) cards.relatorios.style.display = "block";
        if (cards.registrarEntrada)
          cards.registrarEntrada.style.display = "block";
        if (cards.consultaVeiculos)
          cards.consultaVeiculos.style.display = "block";
        if (cards.registroMassa) cards.registroMassa.style.display = "block";
        break;
      case "manobrista":
        if (cards.consultaVeiculos)
          cards.consultaVeiculos.style.display = "block";
        break;
    }
  }

  // --- FUNÇÕES DE ESTATÍSTICAS E EVENTO ATIVO ---
  async function loadStats(eventId) {
    if (!eventId || !statsContainer) return;
    statsContainer.innerHTML = "<p>Carregando estatísticas...</p>";
    statsContainer.style.display = "grid";

    try {
      const response = await fetch(
        `http://localhost:3000/api/eventos/${eventId}/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha na resposta da API");
      }

      const stats = await response.json();

      // --- CÓDIGO ALTERADO AQUI ---
      // Gera o HTML para os cards de métricas com um design melhorado
      statsContainer.innerHTML = `
        <div class="metric-card blue">
          <div class="metric-value">${stats.noPatio}</div>
          <div class="metric-label">Veículos no Pátio</div>
        </div>

        <div class="metric-card green">
          <div class="metric-value">${stats.jaSairam}</div>
          <div class="metric-label">Veículos que já Saíram</div>
        </div>

        <div class="metric-card purple">
          <div class="metric-value">${stats.totalMovimentos}</div>
          <div class="metric-label">Total de Movimentos</div>
        </div>
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
      loadStats(activeEventDetails.id);
    } else {
      activeEventDisplay.style.display = "none";
      if (statsContainer) statsContainer.style.display = "none";
    }
  }

  // --- FUNÇÕES DO MODAL ---
  async function openEventModal() {
    eventModal.style.display = "flex";
    modalEventList.innerHTML = "<p>Carregando eventos...</p>";
    selectEventButton.disabled = true;
    selectedEventInModal = null;

    try {
      const response = await fetch("http://localhost:3000/api/eventos", {
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
        eventItem.dataset.eventId = event.id;

        if (activeEventDetails && event.id === activeEventDetails.id) {
          eventItem.classList.add("selected");
        }

        eventItem.addEventListener("click", () => {
          document
            .querySelectorAll(".modal-event-item")
            .forEach((item) => item.classList.remove("selected"));
          eventItem.classList.add("selected");
          selectedEventInModal = event;
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

  function confirmEventSelection() {
    if (selectedEventInModal) {
      localStorage.setItem("activeEventId", selectedEventInModal.id);
      localStorage.setItem(
        "activeEventDetails",
        JSON.stringify(selectedEventInModal)
      );
      displayActiveEvent();
      closeEventModal();
    }
  }

  // --- ATRELAR EVENTOS ---
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

  // --- EXECUÇÃO INICIAL ---
  setupPermissions();
  displayActiveEvent();
});
