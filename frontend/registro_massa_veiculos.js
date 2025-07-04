document.addEventListener("DOMContentLoaded", () => {
  const { token, user, activeEventId, activeEventDetails } =
    verificarAutenticacao();
  if (!user) return;

  if (!activeEventId || !activeEventDetails) {
    Swal.fire({
      icon: "warning",
      title: "Nenhum Evento Ativo",
      text: "Por favor, selecione um evento antes de usar o registro em massa.",
      confirmButtonText: "Selecionar Evento",
    }).then(() => (window.location.href = "dashboard.html"));
    return;
  }

  const generateTableBtn = document.getElementById("generateTableBtn");
  const ticketCountInput = document.getElementById("ticketCount");
  const vehiclesTableBody = document.getElementById("vehiclesTableBody");
  const massRegisterForm = document.getElementById("massRegisterForm");
  // ... (outras constantes no topo do arquivo)

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

  function validateField(inputElement, rule) {
    // ... (função de validação existente) ...
    // --- ALTERAÇÃO 1: Adicionar regra de validação para observações ---
    // (O resto da função continua igual)
    switch (rule) {
      // ... (outros cases) ...
      case "localizacao":
        if (value.length < 1 || value.length > 50) {
          isValid = false;
          errorMessage = "Localização (1-50 caracteres)";
        }
        break;
      case "observacoes": // NOVA REGRA
        if (value.length > 255) {
          isValid = false;
          errorMessage = "Observações (máx 255 caracteres)";
        }
        break;
    }

    if (!isValid) {
      inputElement.classList.add("invalid-field");
      inputElement.title = errorMessage;
    }
    return isValid;
  }

  const generateTable = () => {
    const count = parseInt(ticketCountInput.value, 10);
    if (isNaN(count) || count <= 0) return;
    vehiclesTableBody.innerHTML = "";
    for (let i = 1; i <= count; i++) {
      const number = i.toString().padStart(2, "0");
      const newRow = document.createElement("tr");

      // --- ALTERAÇÃO 2: Adicionar o campo de input de observações na linha da tabela ---
      newRow.innerHTML = `
          <td class="prisma-cell">${number}</td>
          <td><input type="text" class="ticket-input" value="${number}" readonly></td>
          <td><input type="text" class="modelo-input" placeholder="Modelo"></td>
          <td><input type="text" class="cor-input" placeholder="Cor"></td>
          <td><input type="text" class="placa-input" placeholder="Placa"></td>
          <td><input type="text" class="localizacao-input" placeholder="Localização"></td>
          <td><input type="text" class="observacoes-input" placeholder="Observações (opcional)"></td>
      `;
      // --- FIM DA ALTERAÇÃO 2 ---

      const placaInput = newRow.querySelector(".placa-input");
      const localizacaoInput = newRow.querySelector(".localizacao-input");
      const placaMask = IMask(placaInput, placaMaskOptions);
      placaInput.addEventListener("keyup", () => {
        if (placaMask.unmaskedValue.length === 7) {
          localizacaoInput.focus();
        }
      });
      // Adiciona validação para todos os inputs da linha
      Array.from(newRow.querySelectorAll("input")).forEach((input) => {
        // Extrai a regra do nome da classe (ex: 'modelo-input' -> 'modelo')
        const rule = input.className.split("-")[0];
        input.addEventListener("input", () => validateField(input, rule));
      });
      vehiclesTableBody.appendChild(newRow);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const vehiclesToRegister = [];
    let hasAnyInvalidField = false;

    vehiclesTableBody.querySelectorAll("tr").forEach((row) => {
      row.classList.remove("success-row", "error-row");
      const existingError = row.querySelector(".error-message-cell");
      if (existingError) existingError.remove();

      // --- ALTERAÇÃO 3: Capturar o novo campo de observações ---
      const inputs = {
        ticket: row.querySelector(".ticket-input"),
        modelo: row.querySelector(".modelo-input"),
        cor: row.querySelector(".cor-input"),
        placa: row.querySelector(".placa-input"),
        localizacao: row.querySelector(".localizacao-input"),
        observacoes: row.querySelector(".observacoes-input"), // NOVO CAMPO
      };

      const placaUnmaskedValue = inputs.placa.value.replace(
        /[^a-zA-Z0-9]/g,
        ""
      );
      const isRowBeingFilled =
        inputs.modelo.value.trim() ||
        inputs.cor.value.trim() ||
        placaUnmaskedValue ||
        inputs.localizacao.value.trim();

      if (!isRowBeingFilled) return;

      // Valida todos os campos, incluindo o novo de observações
      const isRowValid = Object.keys(inputs).every((key) =>
        validateField(inputs[key], key)
      );

      if (!isRowValid) {
        hasAnyInvalidField = true;
      } else {
        // --- ALTERAÇÃO 4: Adicionar as observações aos dados a serem enviados ---
        vehiclesToRegister.push({
          rowElement: row,
          data: {
            evento_id: activeEventId,
            numero_ticket: inputs.ticket.value.trim(),
            modelo: inputs.modelo.value.trim(),
            cor: inputs.cor.value.trim(),
            placa: placaUnmaskedValue,
            localizacao: inputs.localizacao.value.trim(),
            observacoes: inputs.observacoes.value.trim(), // NOVO CAMPO
          },
        });
        // --- FIM DA ALTERAÇÃO 4 ---
      }
    });

    if (hasAnyInvalidField) {
      Swal.fire(
        "Validação Pendente",
        "Corrija os campos inválidos destacados.",
        "warning"
      );
      return;
    }
    if (vehiclesToRegister.length === 0) {
      Swal.fire(
        "Nenhum veículo",
        "Preencha os dados de pelo menos um veículo.",
        "info"
      );
      return;
    }

    Swal.fire({
      title: "Registrando...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const results = await Promise.all(
      vehiclesToRegister.map(async (item) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/veiculos/entrada`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(item.data), // O evento_id já está dentro do item.data
          });
          const data = await response.json();
          return { ok: response.ok, data, item };
        } catch (error) {
          return { ok: false, data: { message: "Erro de rede" }, item };
        }
      })
    );

    let successCount = 0;
    const errorMessages = [];
    results.forEach(({ ok, data, item }) => {
      if (ok) {
        successCount++;
        item.rowElement.classList.add("success-row");
        item.rowElement
          .querySelectorAll("input")
          .forEach((input) => (input.disabled = true));
      } else {
        item.rowElement.classList.add("error-row");
        errorMessages.push(
          `Ticket ${item.data.numero_ticket}: ${data.message || "Erro"}`
        );
      }
    });

    if (errorMessages.length === 0) {
      Swal.fire("Sucesso!", `${successCount} veículos registrados!`, "success");
    } else {
      Swal.fire({
        icon: "warning",
        title: "Registro Parcial",
        html: `<b>${successCount} veículos registrados.</b><br><br>Erros:<br><pre style="text-align:left;">${errorMessages.join(
          "\n"
        )}</pre>`,
      });
    }
  };

  // ... (Restante do arquivo: filterTable, generatePDF, listeners)
  // Nenhuma alteração necessária no restante do arquivo
  const searchInput = document.getElementById("searchInput");
  const generatePdfBtn = document.getElementById("generatePdfBtn");

  const filterTable = () => {};
  const generatePDF = () => {};

  generateTableBtn.addEventListener("click", generateTable);
  searchInput.addEventListener("keyup", filterTable);
  generatePdfBtn.addEventListener("click", generatePDF);
  massRegisterForm.addEventListener("submit", handleFormSubmit);
  generateTable();
});
