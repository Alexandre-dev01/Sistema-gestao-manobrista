// frontend/components.js

// Função para injetar o Header
function injectHeader() {
  // Cria um placeholder, busca o HTML do header e o injeta no corpo da página
  const headerPlaceholder = document.createElement("header");
  headerPlaceholder.id = "header-placeholder";
  document.body.prepend(headerPlaceholder);

  fetch("./components/header.html")
    .then((response) => {
      if (!response.ok) throw new Error("header.html não encontrado.");
      return response.text();
    })
    .then((html) => {
      // Substitui o placeholder pelo conteúdo real do header
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      headerPlaceholder.replaceWith(...tempDiv.children);

      // AGORA que o header está no DOM, podemos adicionar a lógica a ele
      const logoutButton = document.getElementById("logoutButton");
      if (logoutButton) {
        logoutButton.addEventListener("click", () => {
          localStorage.clear(); // Limpa todo o localStorage de uma vez
          window.location.href = "login.html";
        });
      }

      const userInfoText = document.getElementById("userInfoText");
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && userInfoText) {
        userInfoText.innerHTML = `Bem-vindo, <span>${user.nome_usuario}</span> (${user.cargo})`;
      }
    })
    .catch((error) => {
      console.error("Erro ao injetar o header:", error);
    });
}

// Função para injetar o Footer
function injectFooter() {
  const footerPlaceholder = document.createElement("footer");
  footerPlaceholder.id = "footer-placeholder";
  document.body.append(footerPlaceholder);

  fetch("./components/footer.html")
    .then((response) => {
      if (!response.ok) throw new Error("footer.html não encontrado.");
      return response.text();
    })
    .then((html) => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      footerPlaceholder.replaceWith(...tempDiv.children);
    })
    .catch((error) => {
      console.error("Erro ao injetar o footer:", error);
    });
}
