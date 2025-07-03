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
  const statsContainer = document.getElementById("statsContainer"); // Div para as estatísticas

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
    statsContainer.style.display = "block";

    try {
      const response = await fetch(
        `http://localhost:3000/api/eventos/${eventId}/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        statsContainer.innerHTML =
          "<p>Não foi possível carregar as estatísticas.</p>";
        return;
      }

      const stats = await response.json();
      statsContainer.innerHTML = `
            <h3>Estatísticas do Evento</h3>
            <p>Veículos no Pátio: <strong>${stats.noPatio}</strong></p>
            <p>Veículos que já Saíram: <strong>${stats.jaSairam}</strong></p>
            <p>Total de Movimentos: <strong>${stats.totalMovimentos}</strong></p>
        `;
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      statsContainer.innerHTML =
        "<p>Erro de conexão ao buscar estatísticas.</p>";
    }
  }

  function displayActiveEvent() {
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

  async function openEventModal() {
    // ... (seu código para abrir o modal continua o mesmo) ...
  }
  function closeEventModal() {
    // ... (seu código para fechar o modal continua o mesmo) ...
  }
  function confirmEventSelection() {
    if (selectedEventInModal) {
      localStorage.setItem("activeEventId", selectedEventInModal.id);
      localStorage.setItem(
        "activeEventDetails",
        JSON.stringify(selectedEventInModal)
      );
      activeEventDetails = selectedEventInModal;
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
