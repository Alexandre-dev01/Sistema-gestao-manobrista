/**
 * Configura a lógica do cabeçalho, como o botão de logout e as informações do usuário.
 * @param {object} user - O objeto do usuário logado.
 */
function setupHeaderLogic(user) {
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      // Limpa todos os dados da sessão do navegador
      localStorage.clear();
      // --- CORREÇÃO AQUI ---
      // Redireciona para 'index.html' (a nova página de login), e não mais para 'login.html'.
      window.location.href = "index.html";
    });
  }

  const userInfoText = document.getElementById("userInfoText");
  // Usa o objeto 'user' passado como argumento para exibir a mensagem de boas-vindas.
  if (user && userInfoText) {
    userInfoText.innerHTML = `Bem-vindo, <span>${user.nome_usuario}</span> (${user.cargo})`;
  }
}
