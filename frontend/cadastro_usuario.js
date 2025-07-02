// frontend/cadastro_usuario.js
document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const nomeUsuarioInput = document.getElementById("nome_usuario");
  const senhaInput = document.getElementById("senha");
  const confirmSenhaInput = document.getElementById("confirm_senha");
  const cargoSelect = document.getElementById("cargo");
  const registerButton = document.getElementById("registerButton");
  const messageDiv = document.getElementById("message");

  // Elementos de validação de senha
  const reqLength = document.getElementById("reqLength");
  const reqUppercase = document.getElementById("reqUppercase");
  const reqLowercase = document.getElementById("reqLowercase");
  const reqNumber = document.getElementById("reqNumber");
  const reqSpecial = document.getElementById("reqSpecial");
  const matchMessage = document.getElementById("matchMessage");

  // Remova esta linha, não precisamos mais do token para o registro público
  // const token = localStorage.getItem("token");

  // Função para exibir mensagens
  function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = "block";
  }

  // Função para validar a senha e atualizar os requisitos visuais
  function validatePassword() {
    const senha = senhaInput.value;
    const confirmSenha = confirmSenhaInput.value;

    // Requisitos
    const hasLength = senha.length >= 6;
    const hasUppercase = /[A-Z]/.test(senha);
    const hasLowercase = /[a-z]/.test(senha);
    const hasNumber = /[0-9]/.test(senha);
    const hasSpecial = /[!@#$%^&*]/.test(senha);

    // Atualiza classes e texto dos requisitos
    reqLength.className = hasLength ? "valid" : "invalid";
    reqUppercase.className = hasUppercase ? "valid" : "invalid";
    reqLowercase.className = hasLowercase ? "valid" : "invalid";
    reqNumber.className = hasNumber ? "valid" : "invalid";
    reqSpecial.className = hasSpecial ? "valid" : "invalid";

    // Validação de correspondência de senhas
    const passwordsMatch = senha === confirmSenha && senha !== "";
    if (confirmSenha !== "") {
      matchMessage.style.display = "block";
      matchMessage.className = passwordsMatch ? "valid" : "invalid";
      matchMessage.textContent = passwordsMatch
        ? "Senhas coincidem"
        : "Senhas não coincidem";
    } else {
      matchMessage.style.display = "none";
    }

    // Habilita/Desabilita o botão de registro
    const allRequirementsMet =
      hasLength &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecial &&
      passwordsMatch &&
      nomeUsuarioInput.value !== "" &&
      cargoSelect.value !== "";
    registerButton.disabled = !allRequirementsMet;
  }

  // Adiciona listeners para validação em tempo real
  senhaInput.addEventListener("input", validatePassword);
  confirmSenhaInput.addEventListener("input", validatePassword);
  nomeUsuarioInput.addEventListener("input", validatePassword); // Para habilitar o botão
  cargoSelect.addEventListener("change", validatePassword); // Para habilitar o botão

  // Listener para o formulário de registro
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Previne o envio padrão do formulário

    const nome_usuario = nomeUsuarioInput.value;
    const senha = senhaInput.value;
    const cargo = cargoSelect.value;

    // Revalida antes de enviar (caso o usuário tenha desabilitado JS ou algo assim)
    validatePassword();
    if (registerButton.disabled) {
      showMessage(
        "Por favor, preencha todos os campos e atenda aos requisitos da senha.",
        "error"
      );
      return;
    }

    registerButton.disabled = true; // Desabilita o botão para evitar múltiplos envios
    showMessage("Cadastrando usuário...", "info"); // Mensagem de carregamento

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Remova esta linha, não precisamos mais do cabeçalho Authorization para o registro público
          // "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ nome_usuario, senha, cargo }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(data.message, "success");
        registerForm.reset(); // Limpa o formulário
        validatePassword(); // Reseta a validação visual
        setTimeout(() => {
          window.location.href = "login.html"; // REDIRECIONA PARA LOGIN
        }, 2000); // Redireciona após 2 segundos para o usuário ler a mensagem
      } else {
        showMessage(data.message || "Erro ao cadastrar usuário.", "error");
      }
    } catch (error) {
      console.error("Erro de rede ao cadastrar usuário:", error);
      showMessage(
        "Erro de conexão ao cadastrar usuário. Tente novamente.",
        "error"
      );
    } finally {
      registerButton.disabled = false; // Reabilita o botão
    }
  });
});
