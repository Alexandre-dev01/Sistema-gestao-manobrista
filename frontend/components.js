// frontend/components.js (VERSÃO FINAL SIMPLIFICADA)

function setupHeaderLogic() {
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  const userInfoText = document.getElementById("userInfoText");
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && userInfoText) {
    userInfoText.innerHTML = `Bem-vindo, <span>${user.nome_usuario}</span> (${user.cargo})`;
  }
}
