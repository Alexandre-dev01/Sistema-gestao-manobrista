// Este script chama a lógica do header em todas as páginas
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();
  if (currentPage !== "login.html" && currentPage !== "cadastro_usuario.html") {
    if (typeof setupHeaderLogic === "function") {
      setupHeaderLogic();
    }
  }
});
