// frontend/consulta_veiculos.js
document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const vehicleList = document.getElementById("vehicleList");
  const noVehiclesMessage = document.getElementById("noVehiclesMessage");
  const generatePdfBtn = document.getElementById("generatePdfBtn"); // Certifique-se que este ID existe no HTML

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
    window.location.href = "eventos.html";
    return;
  }

  // Exibe os detalhes do evento ativo
  activeEventNameSpan.textContent = activeEventDetails.nome_evento;
  activeEventLocationSpan.textContent = activeEventDetails.local_evento;
  activeEventDateSpan.textContent = new Date(
    activeEventDetails.data_evento
  ).toLocaleDateString("pt-BR");

  // Função para carregar e exibir os veículos
  async function loadVehicles() {
    const search = searchInput.value;
    const status = statusFilter.value;

    let url = `http://localhost:3000/api/veiculos/evento/${activeEventId}`;
    const queryParams = [];
    if (status) queryParams.push(`status=${status}`);
    if (search) queryParams.push(`search=${search}`);

    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        vehicleList.innerHTML = ""; // Limpa a lista existente
        if (data.length === 0) {
          noVehiclesMessage.style.display = "block";
        } else {
          noVehiclesMessage.style.display = "none";
          data.forEach((vehicle) => {
            const vehicleItem = document.createElement("div");
            vehicleItem.classList.add("vehicle-item");
            vehicleItem.innerHTML = `
                            <h3>Ticket: ${vehicle.numero_ticket} - Placa: ${
              vehicle.placa
            }</h3>
                            <p>Modelo: ${vehicle.modelo} | Cor: ${
              vehicle.cor
            }</p>
                            <p>Localização: ${vehicle.localizacao}</p>
                            <p>Entrada: ${new Date(
                              vehicle.hora_entrada
                            ).toLocaleString("pt-BR")}</p>
                            ${
                              vehicle.hora_saida
                                ? `<p>Saída: ${new Date(
                                    vehicle.hora_saida
                                  ).toLocaleString("pt-BR")}</p>`
                                : ""
                            }
                            <p>Status: <span class="status ${
                              vehicle.status
                            }">${vehicle.status
              .replace("_", " ")
              .toUpperCase()}</span></p>
                            <p>Registrado por: ${
                              vehicle.nome_usuario_entrada
                            }</p>
                            ${
                              vehicle.nome_usuario_saida
                                ? `<p>Saída registrada por: ${vehicle.nome_usuario_saida}</p>`
                                : ""
                            }
                            ${
                              vehicle.status === "estacionado"
                                ? `<button class="action-button saida" data-vehicle-id="${vehicle.id}">Registrar Saída</button>`
                                : ""
                            }
                        `;
            vehicleList.appendChild(vehicleItem);
          });

          // Adiciona listeners aos botões de saída
          document
            .querySelectorAll(".action-button.saida")
            .forEach((button) => {
              button.addEventListener("click", async (e) => {
                const vehicleId = e.target.dataset.vehicleId;
                if (
                  confirm(
                    "Tem certeza que deseja registrar a saída deste veículo?"
                  )
                ) {
                  try {
                    const response = await fetch(
                      `http://localhost:3000/api/veiculos/saida/${vehicleId}`,
                      {
                        method: "PUT",
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                    const data = await response.json();

                    if (response.ok) {
                      alert(data.message);
                      loadVehicles(); // Recarrega a lista para atualizar o status
                    } else {
                      alert(data.message || "Erro ao registrar saída.");
                    }
                  } catch (error) {
                    console.error("Erro de rede ao registrar saída:", error);
                    alert("Erro de conexão ao registrar saída.");
                  }
                }
              });
            });
        }
      } else {
        alert(data.message || "Erro ao carregar veículos.");
      }
    } catch (error) {
      console.error("Erro de rede ao carregar veículos:", error);
      alert("Erro de conexão ao carregar veículos.");
    }
  }

  // Listener para o botão Gerar PDF
  generatePdfBtn.addEventListener("click", async () => {
    const vehicles = await getVehiclesForPdf(); // Função para obter os veículos atuais na lista

    if (vehicles.length === 0) {
      alert("Não há veículos para gerar o PDF.");
      return;
    }

    // Usando jsPDF para criar o PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(
      "Relatório de Veículos - Evento: " + activeEventDetails.nome_evento,
      10,
      10
    );
    doc.setFontSize(12);
    doc.text(
      `Local: ${activeEventDetails.local_evento} | Data: ${new Date(
        activeEventDetails.data_evento
      ).toLocaleDateString("pt-BR")}`,
      10,
      20
    );
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 10, 30);

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
    // doc.autoTable é uma função do plugin jspdf-autotable
    doc.autoTable({
      startY: 40,
      head: headers,
      body: data,
      theme: "striped",
      headStyles: { fillColor: [15, 52, 96] }, // Cor do cabeçalho da tabela (azul escuro)
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
         0: { cellWidth: 20 }, 
        1: { cellWidth: 30 }, 
        2: { cellWidth: 20 }, 
        3: { cellWidth: 25 }, 
        4: { cellWidth: 30 }, 
        5: { cellWidth: 25 }, 
        6: { cellWidth: 30 }
      },
    });

    doc.save(
      `relatorio_veiculos_${activeEventDetails.nome_evento.replace(
        /\s/g,
        "_"
      )}.pdf`
    );
  });

  // Função auxiliar para obter os veículos da lista atual (com filtros aplicados)
  async function getVehiclesForPdf() {
    const search = searchInput.value;
    const status = statusFilter.value;

    let url = `http://localhost:3000/api/veiculos/evento/${activeEventId}`;
    const queryParams = [];
    if (status) queryParams.push(`status=${status}`);
    if (search) queryParams.push(`search=${search}`);

    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        return data;
      } else {
        console.error("Erro ao obter veículos para PDF:", data.message);
        return [];
      }
    } catch (error) {
      console.error("Erro de rede ao obter veículos para PDF:", error);
      return [];
    }
  }

  // Adiciona listeners para busca e filtro
  searchInput.addEventListener("input", loadVehicles);
  statusFilter.addEventListener("change", loadVehicles);

  // Carrega os veículos ao iniciar a página
  loadVehicles();
});
