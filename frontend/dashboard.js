// frontend/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  // Elementos do evento ativo
  const activeEventDisplay = document.getElementById("activeEventDisplay");
  const activeEventNameSpan = document.getElementById("activeEventName");
  const activeEventLocationSpan = document.getElementById(
    "activeEventLocation"
  );
  const activeEventDateSpan = document.getElementById("activeEventDate");
  const selectActiveEventButton = document.getElementById(
    "selectActiveEventButton"
  );

  // Cards
  const cardEventos = document.getElementById("cardEventos");
  const cardRegistrarEntrada = document.getElementById("cardRegistrarEntrada");
  const cardConsultaVeiculos = document.getElementById("cardConsultaVeiculos");
  const cardRegistroMassa = document.getElementById("cardRegistroMassa");
  const cardCadastrarUsuario = document.getElementById("cardCadastrarUsuario"); // Novo card

  // Verifica se o usuário está logado
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    // Se não estiver logado, redireciona para a página de login
    window.location.href = "login.html";
    return;
  }

  // Lógica para exibir/ocultar o card "Cadastrar Usuário"
  if (user.cargo === "orientador") {
    cardCadastrarUsuario.style.display = "block"; // Mostra o card para orientadores
  } else {
    cardCadastrarUsuario.style.display = "none"; // Esconde para outros cargos
  }

  // Função para carregar e exibir o evento ativo
  function loadActiveEvent() {
    const activeEventId = localStorage.getItem("activeEventId");
    const activeEventDetails = JSON.parse(
      localStorage.getItem("activeEventDetails")
    );

    if (activeEventId && activeEventDetails) {
      activeEventNameSpan.textContent = activeEventDetails.nome_evento;
      activeEventLocationSpan.textContent = activeEventDetails.local_evento;
      activeEventDateSpan.textContent = new Date(
        activeEventDetails.data_evento
      ).toLocaleDateString("pt-BR");
      activeEventDisplay.style.display = "block"; // Mostra o display do evento ativo
      selectActiveEventButton.textContent = "Alterar Evento Ativo"; // Muda o texto do botão
    } else {
      activeEventDisplay.style.display = "none"; // Esconde o display do evento ativo
      selectActiveEventButton.textContent = "Selecionar Evento Ativo"; // Mantém o texto original
    }
  }

  // Chama a função para carregar o evento ativo ao carregar a dashboard
  loadActiveEvent();

  // Lógica para o botão "Selecionar/Alterar Evento Ativo"
  selectActiveEventButton.addEventListener("click", () => {
    window.location.href = "eventos.html"; // Redireciona para a página de eventos
  });

  // Lógica para os cards (redirecionamento para outras páginas)
  cardEventos.addEventListener("click", () => {
    window.location.href = "eventos.html";
  });

  cardRegistrarEntrada.addEventListener("click", () => {
    const activeEventId = localStorage.getItem("activeEventId");
    if (!activeEventId) {
      alert("Por favor, selecione um evento ativo primeiro.");
      window.location.href = "eventos.html"; // Redireciona para a página de eventos
    } else {
      window.location.href = "entrada_veiculo.html";
    }
  });

  cardConsultaVeiculos.addEventListener("click", () => {
    const activeEventId = localStorage.getItem("activeEventId");
    if (!activeEventId) {
      alert("Por favor, selecione um evento ativo primeiro.");
      window.location.href = "eventos.html"; // Redireciona para a página de eventos
    } else {
      window.location.href = "consulta_veiculos.html";
    }
  });

  cardRegistroMassa.addEventListener("click", () => {
    const activeEventId = localStorage.getItem("activeEventId");
    if (!activeEventId) {
      alert("Por favor, selecione um evento ativo primeiro.");
      window.location.href = "eventos.html";
    } else {
      window.location.href = "registro_massa_veiculos.html";
    }
  });

  cardCadastrarUsuario.addEventListener("click", () => {
    window.location.href = "cadastro_usuario.html";
  });
});
