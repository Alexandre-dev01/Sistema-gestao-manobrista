// Arquivo: global.js (VERSÃO FINAL)

function verificarAutenticacao() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    localStorage.clear();
    window.location.href = "index.html"; // ALTERADO DE login.html
    return {};
  }

  const activeEventId = localStorage.getItem("activeEventId");
  const activeEventDetails = JSON.parse(
    localStorage.getItem("activeEventDetails")
  );

  return { token, user, activeEventId, activeEventDetails };
}

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();

  if (currentPage !== "index.html" && currentPage !== "cadastro_usuario.html") {
    const user = JSON.parse(localStorage.getItem("user"));
    if (typeof setupHeaderLogic === "function") {
      setupHeaderLogic(user);
    }
  }
});
