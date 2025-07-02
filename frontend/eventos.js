// frontend/eventos.js
document.addEventListener("DOMContentLoaded", async () => {
  const createEventForm = document.getElementById("createEventForm");
  const nomeEventoInput = document.getElementById("nomeEvento");
  const dataEventoInput = document.getElementById("dataEvento");
  const localEventoInput = document.getElementById("localEvento");
  const descricaoEventoInput = document.getElementById("descricaoEvento");
  const createMessageDisplay = document.getElementById("createMessage");
  const eventsContainer = document.getElementById("eventsContainer");
  const noEventsMessage = document.getElementById("noEventsMessage");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // Redireciona se não estiver logado
  if (!token || !user) {
    alert("Você precisa estar logado para acessar esta página.");
    window.location.href = "login.html";
    return;
  }

  // Função para exibir mensagens (reutilizável)
  function showMessage(msg, type) {
    createMessageDisplay.textContent = msg;
    createMessageDisplay.classList.remove("success-message", "error-message");
    createMessageDisplay.classList.add(type + "-message");
    createMessageDisplay.style.display = "block";
    setTimeout(() => {
      createMessageDisplay.style.display = "none";
    }, 3000); // Esconde a mensagem após 3 segundos
  }

  // Função para carregar e exibir os eventos
  async function loadEvents() {
    try {
      const response = await fetch("http://localhost:3000/api/eventos", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        eventsContainer.innerHTML = ""; // Limpa a lista existente
        if (data.length === 0) {
          noEventsMessage.style.display = "block";
        } else {
          noEventsMessage.style.display = "none";
          const activeEventId = localStorage.getItem("activeEventId"); // Pega o ID do evento ativo

          data.forEach((event) => {
            const eventItem = document.createElement("div");
            eventItem.classList.add("event-item");
            eventItem.innerHTML = `
                <h3>${event.nome_evento} ${
              event.id == activeEventId
                ? '<span class="active-event-indicator">(ATIVO)</span>'
                : ""
            }</h3>
                <p>Data: ${new Date(event.data_evento).toLocaleDateString(
                  "pt-BR"
                )}</p>
                <p>Local: ${event.local_evento}</p>
                <p>Descrição: ${event.descricao || "N/A"}</p>
                <div class="actions">
                    <button class="set-active-btn"
                        data-event-id="${event.id}"
                        data-event-name="${event.nome_evento}"
                        data-local-evento="${event.local_evento}"
                        data-event-date="${event.data_evento}">
                        ${
                          event.id == activeEventId
                            ? "Evento Ativo"
                            : "Definir como Ativo"
                        }
                    </button>
                    <button class="delete-event" data-event-id="${
                      event.id
                    }">Excluir</button>
                </div>
            `;
            eventsContainer.appendChild(eventItem);
          });

          // Adiciona listeners aos botões "Definir como Ativo"
          document.querySelectorAll(".set-active-btn").forEach((button) => {
            button.addEventListener("click", (e) => {
              const eventId = e.target.dataset.eventId;
              const eventName = e.target.dataset.eventName;
              const eventLocation = e.target.dataset.localEvento; // CORRIGIDO AQUI: dataset.localEvento
              const eventDate = e.target.dataset.eventDate;

              localStorage.setItem("activeEventId", eventId);
              localStorage.setItem(
                "activeEventDetails",
                JSON.stringify({
                  id: eventId,
                  nome_evento: eventName,
                  local_evento: eventLocation, // Agora vai salvar o local correto
                  data_evento: eventDate,
                })
              );
              showMessage(
                `Evento "${eventName}" definido como ativo!`,
                "success"
              );
              loadEvents(); // Recarrega a lista para atualizar o indicador (ATIVO)
            });
          });

          // Adiciona listeners aos botões "Excluir"
          document.querySelectorAll(".delete-event").forEach((button) => {
            button.addEventListener("click", async (e) => {
              const eventId = e.target.dataset.eventId;
              console.log(
                `[FRONTEND] Botão Excluir clicado para o evento ID: ${eventId}`
              ); // Log 1

              if (
                confirm(
                  "Tem certeza que deseja excluir este evento? Esta ação é irreversível e excluirá também todos os veículos associados a ele!"
                )
              ) {
                console.log(
                  `[FRONTEND] Confirmação de exclusão para o evento ID: ${eventId}. Enviando requisição DELETE...`
                ); // Log 2
                try {
                  const response = await fetch(
                    `http://localhost:3000/api/eventos/${eventId}`,
                    {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );

                  console.log(
                    `[FRONTEND] Resposta recebida do backend para exclusão do evento ID: ${eventId}. Status: ${response.status}`
                  ); // Log 3
                  const data = await response.json();
                  console.log(`[FRONTEND] Dados da resposta do backend:`, data); // Log 4

                  if (response.ok) {
                    showMessage(data.message, "success");
                    // Se o evento excluído era o ativo, limpa o localStorage
                    if (localStorage.getItem("activeEventId") == eventId) {
                      localStorage.removeItem("activeEventId");
                      localStorage.removeItem("activeEventDetails");
                    }
                    loadEvents(); // Recarrega a lista
                  } else {
                    showMessage(
                      data.message || "Erro ao excluir evento.",
                      "error"
                    );
                  }
                } catch (error) {
                  console.error(
                    "[FRONTEND] Erro de rede ao excluir evento:",
                    error
                  ); // Log 5
                  showMessage("Erro de conexão ao excluir evento.", "error");
                }
              } else {
                console.log(
                  `[FRONTEND] Exclusão do evento ID: ${eventId} cancelada pelo usuário.`
                ); // Log 6
              }
            });
          });
        }
      } else {
        showMessage(data.message || "Erro ao carregar eventos.", "error");
      }
    } catch (error) {
      console.error("Erro de rede ao carregar eventos:", error);
      showMessage("Erro de conexão ao carregar eventos.", "error");
    }
  }

  // Adiciona listener ao formulário de criação de evento
  createEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Limpa mensagens anteriores
    createMessageDisplay.textContent = "";
    createMessageDisplay.classList.remove("success-message", "error-message");

    const nome_evento = nomeEventoInput.value;
    const data_evento = dataEventoInput.value;
    const local_evento = localEventoInput.value;
    const descricao = descricaoEventoInput.value;

    try {
      const response = await fetch("http://localhost:3000/api/eventos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome_evento,
          data_evento,
          local_evento,
          descricao,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(data.message, "success");
        createEventForm.reset(); // Limpa o formulário
        loadEvents(); // Recarrega a lista de eventos
      } else {
        showMessage(data.message || "Erro ao criar evento.", "error");
      }
    } catch (error) {
      console.error("Erro de rede ao criar evento:", error);
      showMessage("Erro de conexão ao criar evento.", "error");
    }
  });

  // Carrega os eventos ao iniciar a página
  loadEvents();
});
