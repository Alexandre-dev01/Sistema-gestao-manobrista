document.addEventListener("DOMContentLoaded", () => {
  // --- BLOCO DE VERIFICAÇÃO SIMPLIFICADO (sem alterações) ---
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

  // --- SELEÇÃO DE ELEMENTOS (sem alterações) ---
  const generateTableBtn = document.getElementById("generateTableBtn");
  const ticketCountInput = document.getElementById("ticketCount");
  const vehiclesTableBody = document.getElementById("vehiclesTableBody");
  const massRegisterForm = document.getElementById("massRegisterForm");
  const generatePdfBtn = document.getElementById("generatePdfBtn");
  const searchInput = document.getElementById("searchInput");

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

  // --- CORREÇÃO 1: FUNÇÃO DE VALIDAÇÃO COMPLETA E ROBUSTA ---
  // Esta função agora é completa e lida com todos os casos de validação.
  function validateField(inputElement, rule) {
    const value = inputElement.value.trim();
    inputElement.classList.remove("invalid-field");
    inputElement.title = "";

    // Campos opcionais são válidos se estiverem vazios.
    if (rule === "observacoes" && value === "") {
      return true;
    }

    // Campos obrigatórios não podem ser vazios.
    if (rule !== "observacoes" && value === "") {
      inputElement.classList.add("invalid-field");
      inputElement.title = "Este campo é obrigatório.";
      return false;
    }

    let isValid = true;
    let errorMessage = "";

    switch (rule) {
      case "ticket":
        if (value.length < 1 || value.length > 10) {
          isValid = false;
          errorMessage = "Ticket deve ter entre 1 e 10 caracteres.";
        }
        break;
      case "modelo":
        if (value.length < 2 || value.length > 50) {
          isValid = false;
          errorMessage = "Modelo deve ter entre 2 e 50 caracteres.";
        }
        break;
      case "cor":
        if (value.length < 2 || value.length > 20) {
          isValid = false;
          errorMessage = "Cor deve ter entre 2 e 20 caracteres.";
        }
        break;
      case "placa":
        const unmaskedPlaca = value.replace(/[^a-zA-Z0-9]/g, "");
        if (unmaskedPlaca.length !== 7) {
          isValid = false;
          errorMessage = "A placa deve conter 7 caracteres.";
        }
        break;
      case "localizacao":
        if (value.length < 1 || value.length > 50) {
          isValid = false;
          errorMessage = "Localização deve ter entre 1 e 50 caracteres.";
        }
        break;
      case "observacoes":
        if (value.length > 255) {
          isValid = false;
          errorMessage = "Observações não podem exceder 255 caracteres.";
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
    // ... (Função sem alterações)
    const count = parseInt(ticketCountInput.value, 10);
    if (isNaN(count) || count <= 0) return;
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
            <td><input type="text" class="observacoes-input" placeholder="Observações (opcional)"></td>
        `;
      const placaInput = newRow.querySelector(".placa-input");
      const localizacaoInput = newRow.querySelector(".localizacao-input");
      IMask(placaInput, placaMaskOptions);
      placaInput.addEventListener("keyup", (e) => {
        if (e.target._imask.unmaskedValue.length === 7) {
          localizacaoInput.focus();
        }
      });
      vehiclesTableBody.appendChild(newRow);
    }
  };

  // --- CORREÇÃO 2: LÓGICA DE SUBMISSÃO REFEITA E SIMPLIFICADA ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const vehiclesToRegister = [];
    let hasInvalidField = false;

    // Remove todas as mensagens de erro e estilos antigos
    vehiclesTableBody.querySelectorAll("tr").forEach((row) => {
      row.classList.remove("error-row", "success-row");
    });

    for (const row of vehiclesTableBody.querySelectorAll("tr")) {
      const inputs = {
        ticket: row.querySelector(".ticket-input"),
        modelo: row.querySelector(".modelo-input"),
        cor: row.querySelector(".cor-input"),
        placa: row.querySelector(".placa-input"),
        localizacao: row.querySelector(".localizacao-input"),
        observacoes: row.querySelector(".observacoes-input"),
      };

      // Verifica se a linha está sendo preenchida (ignora linhas vazias)
      const isRowBeingFilled = Object.keys(inputs)
        .filter((key) => key !== "ticket" && key !== "observacoes") // Ignora campos opcionais ou pré-preenchidos
        .some((key) => inputs[key].value.trim() !== "");

      if (!isRowBeingFilled) {
        continue; // Pula para a próxima linha
      }

      // Valida cada campo da linha
      let isRowValid = true;
      for (const key in inputs) {
        if (!validateField(inputs[key], key)) {
          isRowValid = false;
        }
      }

      if (isRowValid) {
        vehiclesToRegister.push({
          rowElement: row,
          data: {
            evento_id: activeEventId,
            numero_ticket: inputs.ticket.value.trim(),
            modelo: inputs.modelo.value.trim(),
            cor: inputs.cor.value.trim(),
            placa: inputs.placa.value
              .replace(/[^a-zA-Z0-9]/g, "")
              .toUpperCase(),
            localizacao: inputs.localizacao.value.trim(),
            observacoes: inputs.observacoes.value.trim(),
          },
        });
      } else {
        hasInvalidField = true;
        row.classList.add("error-row");
      }
    }

    if (hasInvalidField) {
      Swal.fire(
        "Validação Pendente",
        "Por favor, corrija os campos inválidos destacados em vermelho.",
        "warning"
      );
      return;
    }

    if (vehiclesToRegister.length === 0) {
      Swal.fire(
        "Nenhum Veículo",
        "Preencha os dados de pelo menos um veículo para registrar.",
        "info"
      );
      return;
    }

    Swal.fire({
      title: "Registrando veículos...",
      text: "Por favor, aguarde.",
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
            body: JSON.stringify(item.data),
          });
          const data = await response.json();
          return { ok: response.ok, data, item };
        } catch (error) {
          return { ok: false, data: { message: "Erro de rede" }, item };
        }
      })
    );

    let successCount = 0;
    results.forEach(({ ok, data, item }) => {
      if (ok) {
        successCount++;
        item.rowElement.classList.remove("error-row");
        item.rowElement.classList.add("success-row");
        item.rowElement
          .querySelectorAll("input")
          .forEach((input) => (input.disabled = true));
      } else {
        item.rowElement.classList.add("error-row");
        Swal.fire(
          "Erro no Registro",
          `Erro ao registrar o ticket ${item.data.numero_ticket}: ${data.message}`,
          "error"
        );
      }
    });

    if (successCount === vehiclesToRegister.length) {
      Swal.fire(
        "Sucesso!",
        `${successCount} veículos foram registrados com sucesso!`,
        "success"
      );
    }
  };

  // --- LISTENERS DE EVENTOS (sem alterações) ---
  generateTableBtn.addEventListener("click", generateTable);
  massRegisterForm.addEventListener("submit", handleFormSubmit);
  generateTable(); // Gera a tabela inicial
});
