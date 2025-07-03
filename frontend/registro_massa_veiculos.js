// frontend/registro_massa_veiculos.js (VERSÃO FINAL)
document.addEventListener("DOMContentLoaded", () => {
  const generateTableBtn = document.getElementById("generateTableBtn");
  const ticketCountInput = document.getElementById("ticketCount");
  const vehiclesTableBody = document.getElementById("vehiclesTableBody");
  const massRegisterForm = document.getElementById("massRegisterForm");
  const generatePdfBtn = document.getElementById("generatePdfBtn");
  const searchInput = document.getElementById("searchInput");

  const token = localStorage.getItem("token");
  const activeEventId = localStorage.getItem("activeEventId");
  const activeEventDetails = JSON.parse(
    localStorage.getItem("activeEventDetails")
  );

  if (!token) {
    window.location.href = "login.html";
    return;
  }
  if (!activeEventId || !activeEventDetails) {
    Swal.fire({
      icon: "warning",
      title: "Nenhum Evento Ativo",
      text: "Por favor, selecione um evento antes de usar o registro em massa.",
      confirmButtonText: "Selecionar Evento",
    }).then(() => (window.location.href = "eventos.html"));
    return;
  }

  document.getElementById("activeEventName").textContent =
    activeEventDetails.nome_evento;
  document.getElementById("activeEventLocation").textContent =
    activeEventDetails.local_evento;
  document.getElementById("activeEventDate").textContent = new Date(
    activeEventDetails.data_evento
  ).toLocaleDateString("pt-BR");
  document.getElementById("activeEventDisplay").style.display = "block";

  const generateTable = () => {
    const count = parseInt(ticketCountInput.value, 10);
    if (isNaN(count) || count <= 0) return;
    vehiclesTableBody.innerHTML = "";
    for (let i = 1; i <= count; i++) {
      const number = i.toString().padStart(2, "0");
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
          <td class="prisma-cell">${number}</td>
          <td><input type="text" class="ticket-input" value="${number}" readonly></td>
          <td><input type="text" class="modelo-input" placeholder="Modelo" maxlength="30"></td>
          <td><input type="text" class="cor-input" placeholder="Cor" maxlength="20"></td>
          <td><input type="text" class="placa-input" placeholder="Placa" maxlength="7"></td>
          <td><input type="text" class="localizacao-input" placeholder="Localização" maxlength="50"></td>`;
      vehiclesTableBody.appendChild(newRow);
    }
  };

  const filterTable = () => {
    const filterText = searchInput.value.toLowerCase();
    vehiclesTableBody.querySelectorAll("tr").forEach((row) => {
      const isVisible = Array.from(row.querySelectorAll("input")).some(
        (input) => input.value.toLowerCase().includes(filterText)
      );
      row.style.display = isVisible ? "" : "none";
    });
  };

  const generatePDF = () => {
    if (vehiclesTableBody.rows.length === 0) {
      Swal.fire(
        "Atenção",
        "Gere uma tabela primeiro antes de criar o PDF.",
        "warning"
      );
      return;
    }
    Swal.fire({
      title: "Gerando PDF...",
      text: "Aguarde enquanto o mapa de veículos é criado.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
          const head = [
            ["Prisma", "Ticket", "Modelo", "Cor", "Placa", "Localização"],
          ];
          const body = Array.from(vehiclesTableBody.rows).map((row) =>
            Array.from(row.cells).map(
              (cell) => cell.querySelector("input")?.value || cell.textContent
            )
          );
          doc.text(
            `Mapa de Veículos - ${activeEventDetails.nome_evento}`,
            14,
            16
          );
          doc.autoTable({ head, body, startY: 28, theme: "grid" });
          doc.save(`mapa_veiculos_${activeEventDetails.nome_evento}.pdf`);
          Swal.close();
        } catch (error) {
          Swal.fire("Erro!", "Ocorreu um erro ao gerar o PDF.", "error");
        }
      },
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const vehiclesToRegister = [];
    let hasError = false;

    vehiclesTableBody.querySelectorAll("tr").forEach((row) => {
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
          Swal.fire(
            "Dados Incompletos",
            `A linha do Ticket #${ticket} parece preenchida, mas faltam dados.`,
            "warning"
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
      Swal.fire(
        "Nenhum veículo",
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

    const promises = vehiclesToRegister.map((vehicleData) =>
      fetch("http://localhost:3000/api/veiculos/entrada", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ evento_id: activeEventId, ...vehicleData }),
      }).then((res) =>
        res
          .json()
          .then((data) => ({
            ok: res.ok,
            data,
            ticket: vehicleData.numero_ticket,
          }))
      )
    );

    const results = await Promise.all(promises);
    const successCount = results.filter((r) => r.ok).length;
    const errorMessages = results
      .filter((r) => !r.ok)
      .map((r) => `Ticket ${r.ticket}: ${r.data.message || "Erro."}`);

    if (errorMessages.length === 0) {
      Swal.fire(
        "Sucesso!",
        `Os ${successCount} veículos foram registrados com sucesso!`,
        "success"
      );
    } else {
      Swal.fire({
        icon: "warning",
        title: "Registro Parcial",
        html: `<b>${successCount} veículos registrados.</b><br><br>Erros:<br><pre style="text-align:left; font-size:0.8em;">${errorMessages.join(
          "\n"
        )}</pre>`,
      });
    }
  };

  generateTableBtn.addEventListener("click", generateTable);
  searchInput.addEventListener("keyup", filterTable);
  generatePdfBtn.addEventListener("click", generatePDF);
  massRegisterForm.addEventListener("submit", handleFormSubmit);
  generateTable();
});
