/**
 * Configura a lógica do cabeçalho, como o botão de logout e as informações do usuário.
 * @param {object} user - O objeto do usuário logado.
 */
function setupHeaderLogic(user) {
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  const userInfoText = document.getElementById("userInfoText");
  // Agora usa o objeto 'user' passado como argumento
  if (user && userInfoText) {
    userInfoText.innerHTML = `Bem-vindo, <span>${user.nome_usuario}</span> (${user.cargo})`;
  }
}
