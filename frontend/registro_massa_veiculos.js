document.addEventListener("DOMContentLoaded", () => {
  const { token, user, activeEventId, activeEventDetails } =
    verificarAutenticacao();
  if (!user || !activeEventId) {
    document.querySelector("main").style.display = "none";
    Swal.fire({
      icon: "warning",
      title: "Nenhum Evento Ativo",
      text: "Por favor, selecione um evento no dashboard antes de continuar.",
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then(() => {
      window.location.href = "dashboard.html";
    });
    return;
  }

  const addRowsBtn = document.getElementById("addRowsBtn");
  const addRowCountInput = document.getElementById("addRowCount");
  const vehiclesTableBody = document.getElementById("vehiclesTableBody");
  const massRegisterForm = document.getElementById("massRegisterForm");
  const generatePdfBtn = document.getElementById("generatePdfBtn");
  const searchInput = document.getElementById("searchInput");
  const clearEmptyRowsBtn = document.getElementById("clearEmptyRowsBtn");

  document.getElementById("activeEventName").textContent =
    activeEventDetails.nome_evento;
  document.getElementById("activeEventLocation").textContent =
    activeEventDetails.local_evento;
  document.getElementById("activeEventDate").textContent = new Date(
    activeEventDetails.data_evento
  ).toLocaleDateString("pt-BR");
  document.getElementById("activeEventDisplay").style.display = "block";

  const placaMaskOptions = {
    mask: "AAA-0*00",
    definitions: { A: /[A-Z]/, 0: /[0-9]/, "*": /[A-Z0-9]/ },
    prepare: (str) => str.toUpperCase(),
  };

  const createRow = (vehicle = {}) => {
    const newRow = document.createElement("tr");
    const isSaved = !!vehicle.id;
    newRow.dataset.id = vehicle.id || "";
    newRow.dataset.ticket = vehicle.numero_ticket || "";
    if (isSaved) newRow.classList.add("saved-row");

    newRow.innerHTML = `
            <td class="prisma-cell">${vehicle.numero_ticket || ""}</td>
            <td><input type="text" class="ticket-input table-input" value="${
              vehicle.numero_ticket || ""
            }" ${isSaved ? "disabled" : ""} placeholder="Ticket"></td>
            <td><input type="text" class="modelo-input table-input" value="${
              vehicle.modelo || ""
            }" ${isSaved ? "disabled" : ""} placeholder="Modelo"></td>
            <td><input type="text" class="cor-input table-input" value="${
              vehicle.cor || ""
            }" ${isSaved ? "disabled" : ""} placeholder="Cor"></td>
            <td><input type="text" class="placa-input table-input" value="${
              vehicle.placa || ""
            }" ${isSaved ? "disabled" : ""} placeholder="Placa"></td>
            <td><input type="text" class="localizacao-input table-input" value="${
              vehicle.localizacao || ""
            }" ${isSaved ? "disabled" : ""} placeholder="Localização"></td>
            <td><input type="text" class="observacoes-input table-input" value="${
              vehicle.observacoes || ""
            }" ${isSaved ? "disabled" : ""} placeholder="Observações"></td>
            <td>
                ${
                  !isSaved
                    ? `<button type="button" class="remove-row-btn btn-secondary">Remover</button>`
                    : ""
                }
            </td>
        `;

    const placaInput = newRow.querySelector(".placa-input");
    if (!isSaved) {
      IMask(placaInput, placaMaskOptions);
    }

    if (isSaved) {
      newRow.addEventListener("click", (e) => {
        const targetIsInput = e.target.tagName === "INPUT";
        // Só permite clicar na linha se não estiver em modo de edição e se o clique for em um input desabilitado
        if (
          targetIsInput &&
          e.target.disabled &&
          !newRow.classList.contains("editing-row")
        ) {
          Swal.fire({
            title: "Editar Veículo Registrado?",
            text: "Deseja editar as informações deste veículo? A alteração será salva.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sim, editar",
            cancelButtonText: "Cancelar",
          }).then((result) => {
            if (result.isConfirmed) {
              newRow
                .querySelectorAll("input")
                .forEach((input) => (input.disabled = false));
              newRow.classList.add("editing-row");
              newRow.classList.remove("saved-row");
              IMask(placaInput, placaMaskOptions); // Reaplicar máscara
            }
          });
        }
      });
    } else {
      const removeBtn = newRow.querySelector(".remove-row-btn");
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          newRow.remove();
        });
      }
    }
    return newRow;
  };

  const loadVehiclesAndGenerateTable = async () => {
    vehiclesTableBody.innerHTML =
      '<tr><td colspan="8">Carregando veículos...</td></tr>';
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/veiculos/evento/${activeEventId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Falha ao carregar veículos.");

      const vehicles = await response.json();
      vehiclesTableBody.innerHTML = "";

      if (vehicles.length > 0) {
        vehicles.forEach((v) => vehiclesTableBody.appendChild(createRow(v)));
      }
      addMoreRows(parseInt(addRowCountInput.value, 10));
    } catch (error) {
      Swal.fire(
        "Erro!",
        "Não foi possível carregar os dados do evento.",
        "error"
      );
      vehiclesTableBody.innerHTML =
        '<tr><td colspan="8">Erro ao carregar.</td></tr>';
    }
  };

  const addMoreRows = (countToAdd = null) => {
    const count =
      countToAdd !== null ? countToAdd : parseInt(addRowCountInput.value, 10);

    const allTicketInputs = Array.from(
      vehiclesTableBody.querySelectorAll(".ticket-input")
    );
    const existingTickets = allTicketInputs
      .map((input) => parseInt(input.value, 10))
      .filter((num) => !isNaN(num));

    let lastTicketNum = 0;
    if (existingTickets.length > 0) {
      lastTicketNum = Math.max(...existingTickets);
    } else {
      lastTicketNum = 0;
    }

    for (let i = 1; i <= count; i++) {
      const newTicketNum = (lastTicketNum + i).toString().padStart(2, "0");
      vehiclesTableBody.appendChild(createRow({ numero_ticket: newTicketNum }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const inserts = [];
    const updates = [];

    for (const row of vehiclesTableBody.querySelectorAll("tr")) {
      // Se a linha já foi salva e NÃO está em modo de edição, pule
      if (
        row.classList.contains("saved-row") &&
        !row.classList.contains("editing-row")
      )
        continue;

      const id = row.dataset.id;
      const ticketInput = row.querySelector(".ticket-input");
      const modeloInput = row.querySelector(".modelo-input");
      const corInput = row.querySelector(".cor-input");
      const placaInput = row.querySelector(".placa-input");

      // Se nenhum campo principal foi preenchido, pule a linha
      if (
        !modeloInput.value.trim() &&
        !corInput.value.trim() &&
        !placaInput.value.trim()
      ) {
        continue;
      }

      const vehicleData = {
        evento_id: activeEventId,
        numero_ticket: ticketInput.value.trim(),
        modelo: modeloInput.value.trim(),
        cor: corInput.value.trim(),
        // Acessa o valor não mascarado APENAS se o IMask foi aplicado.
        // Se o input estiver desabilitado (linha salva), ele não terá _imask.
        placa: placaInput._imask
          ? placaInput._imask.unmaskedValue.toUpperCase()
          : placaInput.value.toUpperCase(),
        localizacao: row.querySelector(".localizacao-input").value.trim(),
        observacoes: row.querySelector(".observacoes-input").value.trim(),
      };

      if (id && row.classList.contains("editing-row")) {
        updates.push({ id, ...vehicleData });
      } else if (!id) {
        // Se não tem ID, é uma nova inserção
        inserts.push(vehicleData);
      }
    }

    if (inserts.length === 0 && updates.length === 0) {
      Swal.fire(
        "Nada a Salvar",
        "Nenhum veículo novo ou editado para registrar.",
        "info"
      );
      return;
    }

    Swal.fire({
      title: "Registrando...",
      text: "Aguarde...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      // CORREÇÃO: Define o 'body' corretamente aqui
      const body = { inserts, updates };

      const response = await fetch(`${API_BASE_URL}/api/veiculos/massa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body), // Usa o 'body' definido
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Erro no servidor.");
      }

      Swal.fire(
        "Sucesso!",
        "Veículos registrados e atualizados com sucesso!",
        "success"
      );
      loadVehiclesAndGenerateTable();
    } catch (error) {
      Swal.fire("Erro!", error.message, "error");
    }
  };

  const filterTable = () => {
    const filterText = searchInput.value.toLowerCase();
    vehiclesTableBody.querySelectorAll("tr").forEach((row) => {
      const rowText = row.textContent.toLowerCase();
      const inputValues = Array.from(row.querySelectorAll("input"))
        .map((i) => i.value.toLowerCase())
        .join(" ");
      row.style.display =
        rowText.includes(filterText) || inputValues.includes(filterText)
          ? ""
          : "none";
    });
  };

  // Função para gerar o PDF do mapa de veículos
  async function generateVehicleMapPdf() {
    // Adiciona o Swal.fire de confirmação
    Swal.fire({
      title: "Gerar Mapa de Veículos?",
      text: "Isso irá criar um PDF com os veículos listados na tabela.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Sim, gerar!",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Gerando Mapa de Veículos...",
          text: "Aguarde...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF("l", "mm", "a4"); // 'l' para layout paisagem (landscape)

          // --- INFORMAÇÕES DO CABEÇALHO ---
          doc.setFontSize(18);
          doc.text(
            "Mapa de Veículos - Evento: " + activeEventDetails.nome_evento,
            14,
            20
          );
          doc.setFontSize(10);
          doc.text(
            `Local: ${activeEventDetails.local_evento} | Data: ${new Date(
              activeEventDetails.data_evento
            ).toLocaleDateString("pt-BR")}`,
            14,
            28
          );

          // Adiciona Horário do Evento (se disponível)
          if (activeEventDetails.hora_inicio && activeEventDetails.hora_fim) {
            doc.text(
              `Horário: ${activeEventDetails.hora_inicio} - ${activeEventDetails.hora_fim}`,
              14,
              35
            );
          } else if (activeEventDetails.hora_inicio) {
            doc.text(
              `Horário de Início: ${activeEventDetails.hora_inicio}`,
              14,
              35
            );
          } else if (activeEventDetails.hora_fim) {
            doc.text(
              `Horário de Término: ${activeEventDetails.hora_fim}`,
              14,
              35
            );
          }

          // Adiciona Data de Término do Evento (se diferente da data de início)
          if (
            activeEventDetails.data_fim &&
            activeEventDetails.data_fim !== activeEventDetails.data_evento
          ) {
            doc.text(
              `Data de Término: ${new Date(
                activeEventDetails.data_fim
              ).toLocaleDateString("pt-BR")}`,
              14,
              42
            );
          }

          // --- DADOS DA TABELA ---
          const tableHeaders = [
            [
              "Prisma",
              "Ticket",
              "Modelo",
              "Cor",
              "Placa",
              "Localização",
              "Observações",
            ],
          ];

          const tableBody = [];
          let totalVehicles = 0; // Contador para o total de veículos
          vehiclesTableBody.querySelectorAll("tr").forEach((row) => {
            if (row.style.display !== "none") {
              const ticket = row.querySelector(".ticket-input").value || "";
              const modelo = row.querySelector(".modelo-input").value || "";
              const cor = row.querySelector(".cor-input").value || "";
              const placa = row.querySelector(".placa-input").value || "";
              const localizacao =
                row.querySelector(".localizacao-input").value || "";
              const observacoes =
                row.querySelector(".observacoes-input").value || "";
              const prisma =
                row.querySelector(".prisma-cell").textContent || "";

              // Inclui apenas linhas que tenham pelo menos um campo principal preenchido
              if (modelo || cor || placa || localizacao || observacoes) {
                tableBody.push([
                  prisma,
                  ticket,
                  modelo,
                  cor,
                  placa,
                  localizacao,
                  observacoes,
                ]);
                totalVehicles++; // Incrementa o contador
              }
            }
          });

          doc.autoTable({
            head: tableHeaders,
            body: tableBody,
            startY: 50, // Ajusta o startY para dar espaço às novas informações
            theme: "grid",
            styles: {
              fontSize: 8,
              cellPadding: 1.5,
              overflow: "linebreak",
              valign: "middle",
              halign: "center",
            },
            headStyles: {
              fillColor: [15, 52, 96],
              textColor: 255,
              fontSize: 9,
              fontStyle: "bold",
              halign: "center",
            },
            columnStyles: {
              0: { cellWidth: 15 }, // Prisma
              1: { cellWidth: 15 }, // Ticket
              2: { cellWidth: 30 }, // Modelo
              3: { cellWidth: 20 }, // Cor
              4: { cellWidth: 25 }, // Placa
              5: { cellWidth: 30 }, // Localização
              6: { cellWidth: 60 }, // Observações
            },
            // Adiciona o rodapé com informações de geração
            didDrawPage: function (data) {
              doc.setFontSize(8);
              const pageCount = doc.internal.getNumberOfPages();
              doc.text(
                `Página ${data.pageNumber} de ${pageCount}`,
                data.settings.margin.left,
                doc.internal.pageSize.height - 10
              );
              doc.text(
                `Gerado por: ${
                  user.nome_usuario
                } em ${new Date().toLocaleString("pt-BR")}`,
                doc.internal.pageSize.width - data.settings.margin.right,
                doc.internal.pageSize.height - 10,
                { align: "right" }
              );
              doc.text(
                `Total de Veículos no Mapa: ${totalVehicles}`,
                data.settings.margin.left,
                doc.internal.pageSize.height - 5
              );
            },
          });

          doc.save(
            `Mapa_Veiculos_${activeEventDetails.nome_evento.replace(
              /\s+/g,
              "_"
            )}.pdf`
          );
          Swal.close();
        } catch (error) {
          console.error("Erro ao gerar PDF do mapa de veículos:", error);
          Swal.fire(
            "Erro!",
            "Não foi possível gerar o mapa de veículos. " + error.message,
            "error"
          );
        }
      }
    });
  }

  const clearEmptyRows = () => {
    const rows = vehiclesTableBody.querySelectorAll("tr");
    rows.forEach((row) => {
      const isSaved = row.classList.contains("saved-row");
      if (!isSaved) {
        const modeloInput = row.querySelector(".modelo-input");
        const corInput = row.querySelector(".cor-input");
        const placaInput = row.querySelector(".placa-input");

        if (
          !modeloInput.value.trim() &&
          !corInput.value.trim() &&
          !placaInput.value.trim()
        ) {
          row.remove();
        }
      }
    });
  };

  addRowsBtn.addEventListener("click", () => addMoreRows());
  massRegisterForm.addEventListener("submit", handleFormSubmit);
  searchInput.addEventListener("keyup", filterTable);
  generatePdfBtn.addEventListener("click", generateVehicleMapPdf); // Chama a função de geração de PDF
  clearEmptyRowsBtn.addEventListener("click", clearEmptyRows);

  loadVehiclesAndGenerateTable();
});
