document.addEventListener("DOMContentLoaded", () => {
  const { token, user } = verificarAutenticacao();
  if (!user || user.cargo !== "admin") {
    // Se não for um admin, exibe um alerta e redireciona para o login.
    Swal.fire({
      icon: "error",
      title: "Acesso Negado",
      text: "Você não tem permissão para acessar esta página.",
    }).then(() => {
      window.location.href = "index.html";
    });
    return; // Impede que o resto do script seja executado.
  }
  // --- FIM DA MUDANÇA ---

  const registerForm = document.getElementById("registerForm");
  const nomeUsuarioInput = document.getElementById("nome_usuario");
  const senhaInput = document.getElementById("senha");
  const confirmSenhaInput = document.getElementById("confirm_senha");
  const cargoSelect = document.getElementById("cargo");
  const registerButton = document.getElementById("registerButton");

  // A lógica de validação de senha permanece a mesma.
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

  senhaInput.addEventListener("input", validatePassword);
  confirmSenhaInput.addEventListener("input", validatePassword);
  nomeUsuarioInput.addEventListener("input", validatePassword);
  cargoSelect.addEventListener("change", validatePassword);

  // A lógica de envio do formulário permanece a mesma.
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (registerButton.disabled) return;
    registerButton.disabled = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
