// frontend/login.js
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("errorMessage"); // Pode ser removido se usar só SweetAlert

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome_usuario = usernameInput.value;
    const senha = passwordInput.value;

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome_usuario, senha }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Alerta de sucesso e redirecionamento
        Swal.fire({
          icon: "success",
          title: "Login bem-sucedido!",
          text: `Bem-vindo, ${data.user.nome_usuario}!`,
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          window.location.href = "dashboard.html";
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Falha no Login",
          text: data.message || "Usuário ou senha inválidos.",
        });
      }
    } catch (error) {
      console.error("Erro de rede ou servidor:", error);
      Swal.fire({
        icon: "error",
        title: "Erro de Conexão",
        text: "Não foi possível conectar ao servidor. Tente novamente.",
      });
    }
  });
});
