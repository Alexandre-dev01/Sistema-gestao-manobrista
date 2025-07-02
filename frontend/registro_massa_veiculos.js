// frontend/registro_massa_veiculos.js
document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTOS DA PÁGINA ---
  const generateTableBtn = document.getElementById("generateTableBtn");
  const ticketCountInput = document.getElementById("ticketCount");
  const vehiclesTableBody = document.getElementById("vehiclesTableBody");
  const massRegisterForm = document.getElementById("massRegisterForm");
  const messageDisplay = document.getElementById("message");
  const generatePdfBtn = document.getElementById("generatePdfBtn");
  const searchInput = document.getElementById("searchInput");

  if (!generateTableBtn || !massRegisterForm || !generatePdfBtn) {
    console.error("ERRO CRÍTICO: Botões ou formulário não encontrados.");
    return;
  }

  // --- DADOS DA SESSÃO ---
  const token = localStorage.getItem("token");
  const activeEventId = localStorage.getItem("activeEventId");
  const activeEventDetails = JSON.parse(
    localStorage.getItem("activeEventDetails")
  );

  // --- VALIDAÇÃO INICIAL ---
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  if (!activeEventId || !activeEventDetails) {
    alert("Nenhum evento ativo selecionado. Redirecionando...");
    window.location.href = "eventos.html";
    return;
  }

  // --- EXIBE DETALHES DO EVENTO ---
  const activeEventNameSpan = document.getElementById("activeEventName");
  const activeEventLocationSpan = document.getElementById(
    "activeEventLocation"
  );
  const activeEventDateSpan = document.getElementById("activeEventDate");
  activeEventNameSpan.textContent = activeEventDetails.nome_evento;
  activeEventLocationSpan.textContent = activeEventDetails.local_evento;
  activeEventDateSpan.textContent = new Date(
    activeEventDetails.data_evento
  ).toLocaleDateString("pt-BR");
  document.getElementById("activeEventDisplay").style.display = "block";

  // --- FUNÇÕES E LÓGICAS DA PÁGINA ---
  function showMessage(msg, type) {
    messageDisplay.textContent = msg;
    messageDisplay.className = `message ${
      type === "error" ? "error-message" : "success-message"
    }`;
  }

  const generateTable = () => {
    const count = parseInt(ticketCountInput.value, 10);
    if (isNaN(count) || count <= 0) {
      return;
    }
    vehiclesTableBody.innerHTML = "";
    for (let i = 1; i <= count; i++) {
      const number = i.toString().padStart(2, "0");
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td class="prisma-cell">${number}</td>
        <td><input type="text" class="ticket-input" value="${number}" readonly></td>
        <td><input type="text" class="modelo-input" placeholder="Modelo"></td>
        <td><input type="text" class="cor-input" placeholder="Cor"></td>
        <td><input type="text" class="placa-input" placeholder="Placa"></td>
        <td><input type="text" class="localizacao-input" placeholder="Localização"></td>
      `;
      vehiclesTableBody.appendChild(newRow);
    }
  };

  const filterTable = () => {
    const filterText = searchInput.value.toLowerCase();
    const rows = vehiclesTableBody.querySelectorAll("tr");
    rows.forEach((row) => {
      const ticket = row.querySelector(".ticket-input").value.toLowerCase();
      const modelo = row.querySelector(".modelo-input").value.toLowerCase();
      const placa = row.querySelector(".placa-input").value.toLowerCase();
      row.style.display =
        ticket.includes(filterText) ||
        modelo.includes(filterText) ||
        placa.includes(filterText)
          ? ""
          : "none";
    });
  };

  const generatePDF = () => {
    try {
      // Acessa a biblioteca principal diretamente do objeto window
      const jsPDF = window.jspdf.jsPDF;
      const doc = new jsPDF();

      // Coleta os dados da tabela
      const head = [
        ["Prisma", "Ticket", "Modelo", "Cor", "Placa", "Localização"],
      ];
      const body = [];
      vehiclesTableBody.querySelectorAll("tr").forEach((row) => {
        const rowData = [
          row.querySelector(".prisma-cell").textContent,
          row.querySelector(".ticket-input").value,
          row.querySelector(".modelo-input").value,
          row.querySelector(".cor-input").value,
          row.querySelector(".placa-input").value,
          row.querySelector(".localizacao-input").value,
        ];
        body.push(rowData);
      });

      // Adiciona o título antes de chamar a autoTable
      doc.text(`Mapa de Veículos - ${activeEventDetails.nome_evento}`, 14, 16);
      doc.setFontSize(12);
      doc.text(
        `Data: ${new Date(activeEventDetails.data_evento).toLocaleDateString(
          "pt-BR"
        )}`,
        14,
        22
      );

      // **A CHAMADA MAIS DIRETA E SEGURA PARA O PLUGIN**
      doc.autoTable({
        head: head,
        body: body,
        startY: 28,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 52, 96] },
      });

      doc.save(
        `mapa_veiculos_${activeEventDetails.nome_evento.replace(
          /\s+/g,
          "_"
        )}.pdf`
      );
    } catch (error) {
      console.error("Erro detalhado ao gerar PDF:", error);
      alert(
        `Ocorreu um erro ao gerar o PDF. Verifique o console do navegador (F12) para detalhes.`
      );
    }
  };
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const rows = vehiclesTableBody.querySelectorAll("tr");
    const vehiclesToRegister = [];
    let hasError = false;

    rows.forEach((row) => {
      if (hasError) return;
      const modelo = row.querySelector(".modelo-input").value.trim();
      const placa = row.querySelector(".placa-input").value.trim();
      if (modelo || placa) {
        const ticket = row.querySelector(".ticket-input").value.trim();
        const cor = row.querySelector(".cor-input").value.trim();
        const localizacao = row
          .querySelector(".localizacao-input")
          .value.trim();
        if (!modelo || !cor || !placa || !localizacao) {
          showMessage(
            `A linha do Ticket #${ticket} parece preenchida, mas faltam dados.`,
            "error"
          );
          hasError = true;
        } else {
          vehiclesToRegister.push({
            numero_ticket: ticket,
            modelo,
            cor,
            placa,
            localizacao,
          });
        }
      }
    });

    if (hasError) return;
    if (vehiclesToRegister.length === 0) {
      showMessage("Nenhum veículo preenchido para registrar.", "error");
      return;
    }

    let successCount = 0;
    let errorMessages = [];
    for (const vehicleData of vehiclesToRegister) {
      try {
        const response = await fetch(
          "http://localhost:3000/api/veiculos/entrada",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ evento_id: activeEventId, ...vehicleData }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          successCount++;
        } else {
          errorMessages.push(
            `Ticket ${vehicleData.numero_ticket}: ${data.message || "Erro."}`
          );
        }
      } catch (error) {
        errorMessages.push(
          `Ticket ${vehicleData.numero_ticket}: Erro de conexão.`
        );
      }
    }

    if (errorMessages.length === 0) {
      showMessage(
        `Os ${successCount} veículos preenchidos foram registrados com sucesso!`,
        "success"
      );
    } else {
      showMessage(
        `Registrados ${successCount} veículos. Erros:\n${errorMessages.join(
          "\n"
        )}`,
        "error"
      );
    }
  };

  // --- ATRELAR EVENTOS ---
  generateTableBtn.addEventListener("click", generateTable);
  searchInput.addEventListener("keyup", filterTable);
  generatePdfBtn.addEventListener("click", generatePDF);
  massRegisterForm.addEventListener("submit", handleFormSubmit);

  // --- EXECUÇÃO INICIAL ---
  generateTable();
});
