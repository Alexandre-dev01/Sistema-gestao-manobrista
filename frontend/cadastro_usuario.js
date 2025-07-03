// frontend/cadastro_usuario.js (VERSÃO FINAL E REALMENTE CORRIGIDA)

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const nomeUsuarioInput = document.getElementById("nome_usuario");
  const senhaInput = document.getElementById("senha");
  const confirmSenhaInput = document.getElementById("confirm_senha");
  const cargoSelect = document.getElementById("cargo");
  const registerButton = document.getElementById("registerButton");
  const navLink = document.getElementById("navLink");

  // --- LÓGICA DE TOKEN E NAVEGAÇÃO ---
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // Se um usuário (admin) estiver logado, muda o link de navegação
  if (user && token) {
    if (navLink) {
      navLink.textContent = "Voltar para o Dashboard";
      navLink.href = "dashboard.html";
    }
  }

  // --- FUNÇÃO DE VALIDAÇÃO DE SENHA (sem alterações) ---
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
      nomeUsuarioInput.value !== "" &&
      cargoSelect.value !== "";
    registerButton.disabled = !allRequirementsMet;
  }

  // Adiciona listeners para validação em tempo real
  senhaInput.addEventListener("input", validatePassword);
  confirmSenhaInput.addEventListener("input", validatePassword);
  nomeUsuarioInput.addEventListener("input", validatePassword);
  cargoSelect.addEventListener("change", validatePassword);

  // --- SUBMISSÃO DO FORMULÁRIO (COM A CORREÇÃO) ---
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    validatePassword();
    if (registerButton.disabled) {
      Swal.fire({
        icon: "error",
        title: "Campos Inválidos",
        text: "Por favor, preencha todos os campos e atenda aos requisitos da senha.",
      });
      return;
    }

    registerButton.disabled = true;

    try {
      // --- CORREÇÃO PRINCIPAL AQUI ---
      // O cabeçalho de autorização agora é adicionado à requisição
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ENVIA O TOKEN DO ADMIN
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
        // Limpa o formulário para o admin poder cadastrar outro usuário
        registerForm.reset();
        validatePassword(); // Reseta a validação visual
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro no Cadastro",
          text: data.message || "Não foi possível cadastrar o usuário.",
        });
      }
    } catch (error) {
      console.error("Erro de rede ao cadastrar usuário:", error);
      Swal.fire({
        icon: "error",
        title: "Erro de Conexão",
        text: "Não foi possível conectar ao servidor. Tente novamente.",
      });
    } finally {
      registerButton.disabled = false;
    }
  });
});
