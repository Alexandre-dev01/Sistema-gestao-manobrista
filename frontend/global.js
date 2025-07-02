document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();
  if (currentPage !== "login.html" && currentPage !== "cadastro_usuario.html") {
    // Supondo que injectHeader e injectFooter estão em components.js
    if (typeof injectHeader === "function") injectHeader();
    if (typeof injectFooter === "function") injectFooter();
  }
});
