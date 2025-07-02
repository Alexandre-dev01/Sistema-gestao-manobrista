// frontend/login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Previne o comportamento padrão de recarregar a página

        const nome_usuario = usernameInput.value;
        const senha = passwordInput.value;

        errorMessage.textContent = ''; // Limpa mensagens de erro anteriores

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome_usuario, senha } )
            });

            const data = await response.json();

            if (response.ok) {
                // Login bem-sucedido
                localStorage.setItem('token', data.token); // Armazena o token JWT
                localStorage.setItem('user', JSON.stringify(data.user)); // Armazena dados do usuário
                alert(data.message); // Ou redirecione diretamente
                // Redirecionar para a próxima página (ex: dashboard.html)
                window.location.href = 'dashboard.html'; // Você criará esta página depois
            } else {
                // Erro no login
                errorMessage.textContent = data.message || 'Erro desconhecido ao fazer login.';
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            errorMessage.textContent = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
        }
    });
});
