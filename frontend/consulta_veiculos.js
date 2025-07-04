// Arquivo: consulta_veiculos.js (VERSÃO FINAL E SIMPLIFICADA)

document.addEventListener("DOMContentLoaded", async () => {
  // --- BLOCO DE VERIFICAÇÃO SIMPLIFICADO ---
  const { token, user, activeEventId, activeEventDetails } =
    verificarAutenticacao();
  if (!user) return;
  // --- FIM DO BLOCO ---

  // Validação de evento ativo
  if (!activeEventId || !activeEventDetails) {
    Swal.fire({
      icon: "warning",
      title: "Nenhum Evento Ativo",
      text: "Por favor, selecione um evento para consultar os veículos.",
      confirmButtonText: "Selecionar Evento",
    }).then(() => {
      window.location.href = "dashboard.html";
    });
    return;
  }

  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const vehicleList = document.getElementById("vehicleList");
  const noVehiclesMessage = document.getElementById("noVehiclesMessage");
  const generatePdfBtn = document.getElementById("generatePdfBtn");

  document.getElementById("activeEventName").textContent =
    activeEventDetails.nome_evento;
  document.getElementById("activeEventLocation").textContent =
    activeEventDetails.local_evento;
  document.getElementById("activeEventDate").textContent = new Date(
    activeEventDetails.data_evento
  ).toLocaleDateString("pt-BR");

  let searchTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadVehicles(), 300);
  });
  statusFilter.addEventListener("change", loadVehicles);

  async function loadVehicles() {
    const search = searchInput.value.trim();
    const status = statusFilter.value;
    const url = `${API_BASE_URL}/api/veiculos/evento/${activeEventId}?status=${status}&search=${search}`;

    vehicleList.innerHTML =
      '<p class="loading-message">Carregando veículos...</p>';
    noVehiclesMessage.style.display = "none";

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        vehicleList.innerHTML = "";
        noVehiclesMessage.style.display = data.length === 0 ? "block" : "none";
        data.forEach((vehicle) => {
          const vehicleItem = document.createElement("div");
          vehicleItem.classList.add("vehicle-item");
          const statusClass =
            vehicle.status === "estacionado"
              ? "status-estacionado"
              : "status-saiu";
          const statusIcon = vehicle.status === "estacionado" ? "🅿️" : "✅";
          vehicleItem.innerHTML = `
              <div class="vehicle-header">
                <h3>Ticket: ${vehicle.numero_ticket} - Placa: ${
            vehicle.placa
          }</h3>
                <span class="status ${statusClass}">${statusIcon} ${vehicle.status
            .replace("_", " ")
            .toUpperCase()}</span>
              </div>
              <p>Modelo: ${vehicle.modelo} | Cor: ${vehicle.cor}</p>
              <p>Localização: ${vehicle.localizacao}</p>
              <p>Entrada: ${new Date(vehicle.hora_entrada).toLocaleString(
                "pt-BR"
              )}</p>
              ${
                vehicle.hora_saida
                  ? `<p>Saída: ${new Date(vehicle.hora_saida).toLocaleString(
                      "pt-BR"
                    )}</p>`
                  : ""
              }
                 ${
                   vehicle.observacoes
                     ? `<p class="obs"><strong>Observações:</strong> ${vehicle.observacoes}</p>`
                     : ""
                 }
              <p>Registrado por: ${vehicle.nome_usuario_entrada}</p>
              ${
                vehicle.nome_usuario_saida
                  ? `<p>Saída registrada por: ${vehicle.nome_usuario_saida}</p>`
                  : ""
              }
              ${
                vehicle.status === "estacionado" && user.cargo !== "manobrista"
                  ? `<button class="action-button saida" data-vehicle-id="${vehicle.id}">Registrar Saída</button>`
                  : ""
              }
          `;
          vehicleList.appendChild(vehicleItem);
        });
        addSaidaButtonListeners();
      } else {
        Swal.fire(
          "Erro!",
          data.message || "Erro ao carregar veículos.",
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

  function addSaidaButtonListeners() {
    document.querySelectorAll(".action-button.saida").forEach((button) => {
      button.addEventListener("click", (e) => {
        const vehicleId = e.target.dataset.vehicleId;
        Swal.fire({
          title: "Você tem certeza?",
          text: "Deseja realmente registrar a saída deste veículo?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sim, registrar saída!",
          cancelButtonText: "Cancelar",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const response = await fetch(
                `${API_BASE_URL}/api/veiculos/saida/${vehicleId}`,
                {
                  method: "PUT",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              const data = await response.json();
              if (response.ok) {
                Swal.fire("Registrado!", data.message, "success");
                loadVehicles();
              } else {
                Swal.fire(
                  "Erro!",
                  data.message || "Erro ao registrar saída.",
                  "error"
                );
              }
            } catch (error) {
              Swal.fire(
                "Erro de Conexão!",
                "Não foi possível conectar ao servidor.",
                "error"
              );
            }
          }
        });
      });
    });
  }

  // ... (O resto do arquivo, como a função de gerar PDF, permanece igual,
  // mas lembre-se de que a função getVehiclesForPdf também deve usar API_BASE_URL) ...

  async function getVehiclesForPdf() {
    const search = searchInput.value;
    const status = statusFilter.value;
    const url = `${API_BASE_URL}/api/veiculos/evento/${activeEventId}?status=${status}&search=${search}`;
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      return [];
    }
  }

  generatePdfBtn.addEventListener("click", async () => {
    const vehicles = await getVehiclesForPdf();
    if (vehicles.length === 0) {
      Swal.fire(
        "Lista Vazia",
        "Não há veículos na lista atual para gerar o PDF.",
        "info"
      );
      return;
    }
    Swal.fire({
      title: "Gerando PDF...",
      text: "Aguarde enquanto o relatório é criado.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
          doc.text(
            `Relatório de Veículos - Evento: ${activeEventDetails.nome_evento}`,
            10,
            10
          );
          const headers = [
            [
              "Ticket",
              "Modelo",
              "Cor",
              "Placa",
              "Localização",
              "Status",
              "Entrada por",
            ],
          ];
          const data = vehicles.map((v) => [
            v.numero_ticket,
            v.modelo,
            v.cor,
            v.placa,
            v.localizacao,
            v.status.toUpperCase(),
            v.nome_usuario_entrada,
          ]);
          doc.autoTable({ startY: 20, head: headers, body: data });
          doc.save(`relatorio_veiculos_${activeEventDetails.nome_evento}.pdf`);
          Swal.close();
        } catch (e) {
          Swal.fire("Erro!", "Ocorreu um problema ao gerar o PDF.", "error");
        }
      },
    });
  });

  loadVehicles();
});
