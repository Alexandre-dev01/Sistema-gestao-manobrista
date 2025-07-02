// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // Tenta obter o token do cabeçalho 'Authorization'
    const token = req.header('Authorization');

    // Verifica se o token existe
    if (!token) {
        return res.status(401).json({ message: 'Nenhum token fornecido, autorização negada.' });
    }

    // O token geralmente vem no formato "Bearer SEU_TOKEN_AQUI"
    // Precisamos extrair apenas o token
    const tokenParts = token.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Formato de token inválido.' });
    }
    const actualToken = tokenParts[1];

    try {
        // Verifica e decodifica o token
        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

        // Adiciona as informações do usuário decodificadas ao objeto de requisição
        req.user = decoded; // { id: user.id, cargo: user.cargo }
        next(); // Chama a próxima função middleware ou a rota
    } catch (error) {
        console.error('Erro na verificação do token:', error);
        res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};

module.exports = auth;
