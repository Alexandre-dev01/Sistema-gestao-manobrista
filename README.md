# Sistema de Gestão de Manobristas - DNA

Bem-vindo ao repositório do Sistema de Gestão de Manobristas DNA! Este projeto visa otimizar e profissionalizar a operação de serviços de manobrista em eventos, oferecendo ferramentas robustas para a equipe de gestão e manobristas.

## Visão Geral do Projeto

O Sistema de Gestão de Manobristas DNA é uma aplicação web completa, desenvolvida para gerenciar eficientemente a entrada, movimentação e saída de veículos em eventos. Ele oferece funcionalidades para:

-   **Gestão de Eventos:** Criação, ativação e desativação de eventos, com controle de datas, horários e locais.
-   **Registro de Veículos:** Entrada e saída de veículos de forma individual ou em massa, com rastreamento de informações como modelo, cor, placa, localização e observações.
-   **Controle de Usuários:** Gerenciamento de diferentes perfis de acesso (Admin, Orientador, Manobrista) com permissões específicas.
-   **Relatórios:** Geração de relatórios detalhados por evento para análise de performance e auditoria.
-   **Dashboard Interativo:** Visão geral das estatísticas do evento ativo e acesso rápido às principais funcionalidades.

## Tecnologias Utilizadas

**Frontend:**
-   HTML5
-   CSS3 (com design responsivo)
-   JavaScript (Vanilla JS para interatividade)
-   `jsPDF` e `jspdf-autotable` para geração de PDFs
-   `SweetAlert2` para alertas e modais amigáveis
-   `IMask.js` para máscaras de input (ex: placas)

**Backend:**
-   Node.js
-   Express.js (framework web)
-   MySQL (banco de dados relacional)
-   `bcrypt` para hashing de senhas
-   `jsonwebtoken` para autenticação JWT
-   `cors` para gerenciamento de políticas de Cross-Origin Resource Sharing
-   `dotenv` para variáveis de ambiente

**Infraestrutura:**
-   **Frontend Hosting:** Netlify
-   **Backend Hosting:** Render
-   **Controle de Versão:** Git & GitHub

## Funcionalidades Principais

-   **Autenticação e Autorização:** Sistema de login seguro com diferentes níveis de acesso baseados em cargo (Admin, Orientador, Manobrista).
-   **Gestão de Eventos:**
    -   Criação de eventos com nome, data de início, data de término, hora de início, hora de término, local e descrição.
    -   Ativação e desativação de eventos (apenas um evento pode estar ativo por vez).
    -   Exclusão de eventos (apenas se não estiverem ativos).
    -   Geração de relatórios PDF completos por evento.
-   **Registro de Veículos:**
    -   Registro individual de entrada de veículos.
    -   **Registro em Massa:** Interface otimizada para registro rápido de múltiplos veículos, com numeração automática de tickets, edição de linhas e geração de mapa PDF.
    -   Registro de saída de veículos.
    -   Consulta de veículos por evento, status e busca por placa/ticket.
-   **Dashboard:**
    -   Exibição clara do evento ativo com todas as suas informações (nome, local, data, horário).
    -   Estatísticas em tempo real do evento ativo (veículos estacionados, saídas registradas, total de veículos).
    -   Navegação intuitiva para as diferentes seções do sistema.

## Como Rodar o Projeto Localmente

### Pré-requisitos

-   Node.js (versão LTS recomendada)
-   MySQL Server
-   Git

### Configuração do Banco de Dados

1.  **Crie um banco de dados MySQL:**
    ```sql
    CREATE DATABASE manobrista_db;
    ```
2.  **Crie as tabelas necessárias:**
    As tabelas `usuarios`, `eventos` e `veiculos` são essenciais. Você pode encontrar os scripts SQL para criação e as colunas esperadas na documentação ou nos arquivos de migração do projeto (se existirem).
    **Exemplo de estrutura de tabelas (simplificado):**
    ```sql
    -- Tabela de Usuários
    CREATE TABLE usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome_usuario VARCHAR(50) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        cargo ENUM('admin', 'orientador', 'manobrista') NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de Eventos
    CREATE TABLE eventos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome_evento VARCHAR(100) NOT NULL,
        data_evento DATE NOT NULL,
        data_fim DATE NOT NULL,         -- Nova coluna
        hora_inicio TIME NOT NULL,      -- Nova coluna
        hora_fim TIME NOT NULL,         -- Nova coluna
        local_evento VARCHAR(100) NOT NULL,
        descricao VARCHAR(255),
        is_active BOOLEAN DEFAULT FALSE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de Veículos
    CREATE TABLE veiculos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        evento_id INT NOT NULL,
        numero_ticket VARCHAR(20) NOT NULL,
        modelo VARCHAR(100) NOT NULL,
        cor VARCHAR(50) NOT NULL,
        placa VARCHAR(10) NOT NULL,
        localizacao VARCHAR(100) NOT NULL,
        observacoes VARCHAR(255),
        hora_entrada DATETIME NOT NULL,
        hora_saida DATETIME,
        status ENUM('estacionado', 'saiu') DEFAULT 'estacionado',
        usuario_entrada_id INT NOT NULL,
        usuario_saida_id INT,
        FOREIGN KEY (evento_id) REFERENCES eventos(id),
        FOREIGN KEY (usuario_entrada_id) REFERENCES usuarios(id),
        FOREIGN KEY (usuario_saida_id) REFERENCES usuarios(id)
    );
    ```
3.  **Crie um usuário `admin` inicial:**
    ```sql
    INSERT INTO usuarios (nome_usuario, senha, cargo) VALUES ('admin', '$2b$10$SEU_HASH_DA_SENHA', 'admin');
    -- Use um gerador de hash bcrypt para sua senha, ex: 'admin123' -> '$2b$10$SEU_HASH_DA_SENHA'
    ```

### Configuração do Backend

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Alexandre-dev01/Sistema-gestao-manobrista.git
    cd Sistema-gestao-manobrista
    ```
2.  **Instale as dependências do backend:**
    ```bash
    cd backend
    npm install
    ```
3.  **Crie um arquivo `.env` na pasta `backend`** com as seguintes variáveis:
    ```
    DB_HOST=localhost
    DB_USER=seu_usuario_mysql
    DB_PASSWORD=sua_senha_mysql
    DB_NAME=manobrista_db
    JWT_SECRET=sua_chave_secreta_jwt_muito_segura
    PORT=3000
    ```
4.  **Inicie o servidor backend:**
    ```bash
    npm start
    ```
    O servidor estará rodando em `http://localhost:3000`.

### Configuração do Frontend

1.  **Volte para a pasta raiz do projeto:**
    ```bash
    cd ..
    ```
2.  **Edite o arquivo `frontend/config.js`:**
    Altere `API_BASE_URL` para apontar para o seu backend local:
    ```javascript
    // frontend/config.js
    const API_BASE_URL = "http://localhost:3000";
    ```
3.  **Abra o arquivo `frontend/index.html`** no seu navegador (usando uma extensão como Live Server do VS Code ou abrindo diretamente ).

## Roadmap Futuro (Módulo Cliente)

Para expandir o valor comercial do sistema, planejamos implementar um módulo de interação direta com o cliente. As funcionalidades incluem:

-   **Tickets Digitais:** Geração de QR Codes e códigos alfanuméricos para cada veículo registrado.
-   **Web App do Cliente:** Uma interface simples para o cliente solicitar seu veículo digitando o ticket ou escaneando o QR Code.
-   **Dashboard de Solicitações:** Uma nova tela para a equipe de manobristas visualizar e gerenciar as solicitações de veículos em tempo real.
-   **Notificações (Fase 2):** Envio de SMS/WhatsApp para o cliente sobre o status do veículo.

## Contribuição

Contribuições são bem-vindas! Se você tiver sugestões, melhorias ou encontrar bugs, sinta-se à vontade para abrir uma issue ou enviar um Pull Request.

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
