// Importa o Express, framework que gerencia as rotas e requisições HTTP
const express = require('express');

// Importa o CORS para permitir que o frontend possa acessar o backend de domínios diferentes
const cors = require('cors');

// Importa o path para trabalhar com caminhos de arquivos
const path = require('path');

// Importa o dotenv para carregar as variáveis de ambiente do arquivo .env
require('dotenv').config({
  path: [path.resolve(__dirname, '..', '.env'), path.resolve(__dirname, '.env')]
});

// Importa a função de conexão com o MongoDB Atlas
const conectarBanco = require('./config/db');

// Importa as rotas do chat
const chatRoutes = require('./routes/chatRoutes');

// Cria a aplicação Express
const app = express();

// Habilita o CORS para aceitar requisições do site da Formis
app.use(cors());

// Habilita o Express a entender JSON no corpo das requisições
app.use(express.json());

// Registra as rotas do chat sob o prefixo /api/chat
app.use('/api/chat', chatRoutes);

// Define a porta do servidor
const PORT = process.env.PORT || 3002;

async function startServer() {
  await conectarBanco();
  return app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  });
}

module.exports = { app, startServer };
