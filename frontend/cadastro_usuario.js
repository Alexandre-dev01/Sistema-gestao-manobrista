document.addEventListener("DOMContentLoaded", () => {
  // --- GUARDA DE ACESSO REFORÇADO ---
  // Esta lógica garante que apenas um admin logado pode usar esta página.
  const { token, user } = verificarAutenticacao();
  if (!user || user.cargo !== "admin") {
    Swal.fire({
      icon: "error",
      title: "Acesso Negado",
      text: "Você não tem permissão para acessar esta página.",
    }).then(() => {
      window.location.href = "index.html";
    });
    return; // Impede a execução do resto do código se não for admin.
  }
  // --- FIM DA PROTEÇÃO ---

  // Seleção dos elementos do formulário
  const registerForm = document.getElementById("registerForm");
  const nomeUsuarioInput = document.getElementById("nome_usuario");
  const senhaInput = document.getElementById("senha");
  const confirmSenhaInput = document.getElementById("confirm_senha");
  const cargoSelect = document.getElementById("cargo");
  const registerButton = document.getElementById("registerButton");

  // A lógica de validação da senha não precisa de alterações.
  function validatePassword() {
    const senha = senhaInput.value;
    const confirmSenha = confirmSenhaInput.value;
    const hasLength = senha.length >= 6;
    const hasUppercase = /[A-Z]/.test(senha);
    const hasLowercase = /[a-z]/.test(senha);
    const hasNumber = /[0-9]/.test(senha);
    const hasSpecial = /[!@#$%^&*]/.test(senha);
    document.getElementById("reqLength").className = hasLength
      ? "valid"
      : "invalid";
    document.getElementById("reqUppercase").className = hasUppercase
      ? "valid"
      : "invalid";
    document.getElementById("reqLowercase").className = hasLowercase
      ? "valid"
      : "invalid";
    document.getElementById("reqNumber").className = hasNumber
      ? "valid"
      : "invalid";
    document.getElementById("reqSpecial").className = hasSpecial
      ? "valid"
      : "invalid";
    const passwordsMatch = senha === confirmSenha && senha !== "";
    const matchMessage = document.getElementById("matchMessage");
    if (confirmSenha !== "") {
      matchMessage.style.display = "block";
      matchMessage.className = passwordsMatch ? "valid" : "invalid";
      matchMessage.textContent = passwordsMatch
        ? "Senhas coincidem"
        : "Senhas não coincidem";
    } else {
      matchMessage.style.display = "none";
    }
    const allRequirementsMet =
      hasLength &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecial &&
      passwordsMatch &&
      nomeUsuarioInput.value.trim() !== "" &&
      cargoSelect.value !== "";
    registerButton.disabled = !allRequirementsMet;
  }

  // Adiciona os listeners para validar em tempo real.
  senhaInput.addEventListener("input", validatePassword);
  confirmSenhaInput.addEventListener("input", validatePassword);
  nomeUsuarioInput.addEventListener("input", validatePassword);
  cargoSelect.addEventListener("change", validatePassword);

  // Lógica de envio do formulário.
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (registerButton.disabled) return;
    registerButton.disabled = true;

    try {
      // --- CORREÇÃO AQUI ---
      // A requisição fetch agora usa o 'token' que foi validado no início do script,
      // garantindo que a autorização do admin seja enviada corretamente para a API.
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Garante que o token do admin seja enviado.
        },
        body: JSON.stringify({
          nome_usuario: nomeUsuarioInput.value,
          senha: senhaInput.value,
          cargo: cargoSelect.value,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Usuário Cadastrado!",
          text: data.message,
          timer: 2500,
          showConfirmButton: false,
        });
        registerForm.reset();
        validatePassword();
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro no Cadastro",
          text: data.message || "Não foi possível cadastrar o usuário.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro de Conexão",
        text: "Não foi possível conectar ao servidor.",
      });
    } finally {
      registerButton.disabled = false;
    }
  });
});
