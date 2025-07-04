/**
 * Verifica se o usuário está logado checando o token e os dados no localStorage.
 * Redireciona para o login se não estiver autenticado.
 * @returns {{token: string, user: object, activeEventId: string, activeEventDetails: object}} - Retorna os dados da sessão ou um objeto vazio se não autenticado.
 */
function verificarAutenticacao() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // Se não houver token ou usuário, o acesso não é permitido.
  if (!token || !user) {
    localStorage.clear(); // Limpa qualquer dado inválido
    window.location.href = "login.html";
    return {}; // Retorna um objeto vazio para parar a execução do script que chamou
  }

  // Pega os detalhes do evento ativo, se existirem
  const activeEventId = localStorage.getItem("activeEventId");
  const activeEventDetails = JSON.parse(
    localStorage.getItem("activeEventDetails")
  );

  // Retorna todos os dados da sessão para serem usados na página
  return { token, user, activeEventId, activeEventDetails };
}

// Lógica para executar em todas as páginas (exceto login/cadastro)
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();

  // Não executa em páginas de autenticação
  if (currentPage !== "login.html" && currentPage !== "cadastro_usuario.html") {
    // Pega o usuário uma única vez
    const user = JSON.parse(localStorage.getItem("user"));

    // Chama a lógica do cabeçalho, passando o usuário
    if (typeof setupHeaderLogic === "function") {
      setupHeaderLogic(user); // Passa o usuário como argumento
    }
  }
});
