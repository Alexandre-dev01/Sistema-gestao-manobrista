// Arquivo: eventos.js (VERSÃO FINAL E SIMPLIFICADA)

document.addEventListener("DOMContentLoaded", () => {
  // --- BLOCO DE VERIFICAÇÃO SIMPLIFICADO ---
  const { token, user } = verificarAutenticacao();
  if (!user) return; // Para a execução se o usuário não for autenticado
  // --- FIM DO BLOCO ---

  const createEventForm = document.getElementById("createEventForm");
  const nomeEventoInput = document.getElementById("nomeEvento");
  const dataEventoInput = document.getElementById("dataEvento");
  const localEventoInput = document.getElementById("localEvento");
  const descricaoEventoInput = document.getElementById("descricaoEvento");
  const eventsContainer = document.getElementById("eventsContainer");
  const noEventsMessage = document.getElementById("noEventsMessage");

  async function loadEvents() {
    eventsContainer.innerHTML = "<p>Carregando eventos...</p>";
    noEventsMessage.style.display = "none";

    try {
      const response = await fetch(`${API_BASE_URL}/api/eventos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok) {
        eventsContainer.innerHTML = "";
        noEventsMessage.style.display = data.length === 0 ? "block" : "none";

        data.forEach((event) => {
          const eventItem = document.createElement("div");
          eventItem.classList.add("event-item");
          const isActive = event.is_active;

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
      button.addEventListener("click", async (e) => {
        const eventId = e.target.dataset.eventId;
        const eventDetails = JSON.parse(e.target.dataset.eventDetails);

        Swal.fire({
          title: "Ativando evento...",
          text: "Por favor, aguarde.",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        try {
          const response = await fetch(
            `${API_BASE_URL}/api/eventos/${eventId}/ativar`,
            {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const data = await response.json();
          if (!response.ok)
            throw new Error(data.message || "Falha ao ativar o evento.");

          localStorage.setItem("activeEventId", eventId);
          localStorage.setItem(
            "activeEventDetails",
            JSON.stringify(eventDetails)
          );

          Swal.fire({
            icon: "success",
            title: "Evento Ativado!",
            text: `O evento "${eventDetails.nome_evento}" agora está ativo.`,
          });
          loadEvents();
        } catch (error) {
          Swal.fire("Erro!", error.message, "error");
        }
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
          confirmButtonText: "Sim, excluir!",
          cancelButtonText: "Cancelar",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const response = await fetch(
                `${API_BASE_URL}/api/eventos/${eventId}`,
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
      const response = await fetch(`${API_BASE_URL}/api/eventos`, {
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
        `${API_BASE_URL}/api/eventos/${eventId}/relatorio`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json()).message || "Falha ao buscar dados."
        );

      const { evento, veiculos } = await response.json();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF("p", "mm", "a4");

      doc.setFontSize(20);
      doc.text("Relatório Final de Evento", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text(`Evento: ${evento.nome_evento}`, 14, 40);
      doc.text(`Local: ${evento.local_evento}`, 14, 47);
      doc.text(
        `Data: ${new Date(evento.data_evento).toLocaleDateString("pt-BR")}`,
        14,
        54
      );
      doc.text(`Descrição: ${evento.descricao || "N/A"}`, 14, 61);

      const tableHeaders = [
        [
          "Ticket",
          "Placa",
          "Modelo",
          "Cor",
          "Localização",
          "Entrada",
          "Saída",
          "Permanência",
          "Entrada por",
          "Saída por",
        ],
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
          v.modelo,
          v.cor,
          v.localizacao,
          entrada.toLocaleTimeString("pt-BR"),
          saida ? saida.toLocaleTimeString("pt-BR") : "Estacionado",
          permanencia,
          v.nome_usuario_entrada || "N/A",
          v.nome_usuario_saida || "N/A",
        ];
      });

      doc.autoTable({
        head: tableHeaders,
        body: tableBody,
        startY: 70,
        theme: "grid",
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          overflow: "linebreak",
          valign: "middle",
          halign: "center",
        },
        headStyles: {
          fillColor: [15, 52, 96],
          textColor: 255,
          fontSize: 8,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 18 },
          2: { cellWidth: 22 },
          3: { cellWidth: 15 },
          4: { cellWidth: 22 },
          5: { cellWidth: 18 },
          6: { cellWidth: 18 },
          7: { cellWidth: 18 },
          8: { cellWidth: 22 },
          9: { cellWidth: 22 },
        },
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
