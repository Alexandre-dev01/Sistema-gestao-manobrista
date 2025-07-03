// frontend/eventos.js (VERSÃO FINAL)
document.addEventListener("DOMContentLoaded", async () => {
  const createEventForm = document.getElementById("createEventForm");
  const nomeEventoInput = document.getElementById("nomeEvento");
  const dataEventoInput = document.getElementById("dataEvento");
  const localEventoInput = document.getElementById("localEvento");
  const descricaoEventoInput = document.getElementById("descricaoEvento");
  const eventsContainer = document.getElementById("eventsContainer");
  const noEventsMessage = document.getElementById("noEventsMessage");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    window.location.href = "login.html";
    return;
  }

  async function loadEvents() {
    try {
      const response = await fetch("http://localhost:3000/api/eventos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok) {
        eventsContainer.innerHTML = "";
        noEventsMessage.style.display = data.length === 0 ? "block" : "none";
        const activeEventId = localStorage.getItem("activeEventId");

        data.forEach((event) => {
          const eventItem = document.createElement("div");
          eventItem.classList.add("event-item");
          const isActive = event.id == activeEventId;
          eventItem.innerHTML = `
              <h3>${event.nome_evento} ${
            isActive
              ? '<span class="active-event-indicator">(ATIVO)</span>'
              : ""
          }</h3>
              <p>Data: ${new Date(event.data_evento).toLocaleDateString(
                "pt-BR"
              )}</p>
              <p>Local: ${event.local_evento}</p>
              <p>Descrição: ${event.descricao || "N/A"}</p>
              <div class="actions">
                  <button class="set-active-btn" data-event-id="${
                    event.id
                  }" data-event-details='${JSON.stringify(event)}' ${
            isActive ? "disabled" : ""
          }>
                      ${isActive ? "Evento Ativo" : "Definir como Ativo"}
                  </button>
                  <button class="delete-event" data-event-id="${
                    event.id
                  }">Excluir</button>
                  <button class="report-btn" data-event-id="${
                    event.id
                  }">Gerar Relatório</button>
              </div>`;
          eventsContainer.appendChild(eventItem);
        });
        addEventListeners();
      } else {
        Swal.fire(
          "Erro!",
          data.message || "Erro ao carregar eventos.",
          "error"
        );
      }
    } catch (error) {
      Swal.fire(
        "Erro de Conexão",
        "Não foi possível conectar ao servidor.",
        "error"
      );
    }
  }

  function addEventListeners() {
    document.querySelectorAll(".set-active-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const eventDetails = JSON.parse(e.target.dataset.eventDetails);
        localStorage.setItem("activeEventId", eventDetails.id);
        localStorage.setItem(
          "activeEventDetails",
          JSON.stringify(eventDetails)
        );
        Swal.fire({
          icon: "success",
          title: "Evento Ativado!",
          text: `O evento "${eventDetails.nome_evento}" agora está ativo.`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        loadEvents();
      });
    });

    document.querySelectorAll(".delete-event").forEach((button) => {
      button.addEventListener("click", (e) => {
        const eventId = e.target.dataset.eventId;
        Swal.fire({
          title: "Tem certeza?",
          text: "Esta ação é irreversível e excluirá o evento e todos os veículos associados!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Sim, excluir!",
          cancelButtonText: "Cancelar",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const response = await fetch(
                `http://localhost:3000/api/eventos/${eventId}`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              const data = await response.json();
              if (response.ok) {
                Swal.fire("Excluído!", data.message, "success");
                if (localStorage.getItem("activeEventId") == eventId) {
                  localStorage.removeItem("activeEventId");
                  localStorage.removeItem("activeEventDetails");
                }
                loadEvents();
              } else {
                Swal.fire(
                  "Erro!",
                  data.message || "Erro ao excluir evento.",
                  "error"
                );
              }
            } catch (error) {
              Swal.fire(
                "Erro de Conexão",
                "Não foi possível conectar ao servidor.",
                "error"
              );
            }
          }
        });
      });
    });

    document.querySelectorAll(".report-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const eventId = e.target.dataset.eventId;
        Swal.fire({
          title: "Gerar Relatório?",
          text: "Isso irá criar um PDF com o resumo completo do evento.",
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Sim, gerar!",
          cancelButtonText: "Cancelar",
        }).then((result) => {
          if (result.isConfirmed) {
            generateReport(eventId);
          }
        });
      });
    });
  }

  createEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      nome_evento: nomeEventoInput.value,
      data_evento: dataEventoInput.value,
      local_evento: localEventoInput.value,
      descricao: descricaoEventoInput.value,
    };
    try {
      const response = await fetch("http://localhost:3000/api/eventos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire("Sucesso!", data.message, "success");
        createEventForm.reset();
        loadEvents();
      } else {
        Swal.fire("Erro!", data.message || "Erro ao criar evento.", "error");
      }
    } catch (error) {
      Swal.fire(
        "Erro de Conexão",
        "Não foi possível conectar ao servidor.",
        "error"
      );
    }
  });

  async function generateReport(eventId) {
    Swal.fire({
      title: "Gerando Relatório...",
      text: "Aguarde...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      const response = await fetch(
        `http://localhost:3000/api/eventos/${eventId}/relatorio`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok)
        throw new Error(
          (await response.json()).message || "Falha ao buscar dados."
        );

      const { evento, veiculos, estatisticas } = await response.json();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Relatório Final de Evento", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text(`Evento: ${evento.nome_evento}`, 14, 40);
      // ... (Restante da sua lógica de criação de PDF) ...
      const tableHeaders = [
        ["Ticket", "Placa", "Entrada", "Saída", "Permanência"],
      ];
      const tableBody = veiculos.map((v) => {
        const entrada = new Date(v.hora_entrada);
        const saida = v.hora_saida ? new Date(v.hora_saida) : null;
        let permanencia = "N/A";
        if (saida) {
          const diffMs = saida - entrada;
          const diffHrs = Math.floor(diffMs / 3600000);
          const diffMins = Math.round((diffMs % 3600000) / 60000);
          permanencia = `${diffHrs}h ${diffMins}min`;
        }
        return [
          v.numero_ticket,
          v.placa,
          entrada.toLocaleTimeString("pt-BR"),
          saida ? saida.toLocaleTimeString("pt-BR") : "Estacionado",
          permanencia,
        ];
      });
      doc.autoTable({
        head: tableHeaders,
        body: tableBody,
        startY: 95,
        theme: "grid",
      });
      doc.save(`Relatorio_${evento.nome_evento.replace(/\s+/g, "_")}.pdf`);
      Swal.close();
    } catch (error) {
      Swal.fire(
        "Erro!",
        error.message || "Não foi possível gerar o relatório.",
        "error"
      );
    }
  }

  loadEvents();
});
