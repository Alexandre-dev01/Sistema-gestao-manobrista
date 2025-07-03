// frontend/entrada_veiculo.js (VERSÃO FINAL)
document.addEventListener("DOMContentLoaded", async () => {
  const entradaVeiculoForm = document.getElementById("entradaVeiculoForm");
  const numeroTicketInput = document.getElementById("numeroTicket");
  const modeloCarroInput = document.getElementById("modeloCarro");
  const corCarroInput = document.getElementById("corCarro");
  const placaCarroInput = document.getElementById("placaCarro");
  const localizacaoCarroInput = document.getElementById("localizacaoCarro");

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

  if (!token || !user) {
    window.location.href = "login.html";
    return;
  }
  if (!activeEventId || !activeEventDetails) {
    Swal.fire({
      icon: "warning",
      title: "Nenhum Evento Ativo",
      text: "Por favor, selecione um evento antes de registrar um veículo.",
      confirmButtonText: "Selecionar Evento",
    }).then(() => {
      window.location.href = "eventos.html";
    });
    return;
  }

  activeEventNameSpan.textContent = activeEventDetails.nome_evento;
  activeEventLocationSpan.textContent = activeEventDetails.local_evento;
  activeEventDateSpan.textContent = new Date(
    activeEventDetails.data_evento
  ).toLocaleDateString("pt-BR");

  entradaVeiculoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    const veiculo = {
      evento_id: activeEventId,
      numero_ticket: numeroTicketInput.value,
      modelo: modeloCarroInput.value,
      cor: corCarroInput.value,
      placa: placaCarroInput.value,
      localizacao: localizacaoCarroInput.value,
    };

    try {
      const response = await fetch(
        "http://localhost:3000/api/veiculos/entrada",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(veiculo),
        }
      );
      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Veículo Registrado!",
          text: data.message,
          timer: 2000,
          showConfirmButton: false,
        });
        entradaVeiculoForm.reset();
        numeroTicketInput.focus();
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro ao Registrar",
          text: data.message || "Não foi possível registrar o veículo.",
        });
      }
    } catch (error) {
      console.error("Erro de rede:", error);
      Swal.fire({
        icon: "error",
        title: "Erro de Conexão",
        text: "Não foi possível conectar ao servidor.",
      });
    } finally {
      submitButton.disabled = false;
    }
  });
});
