// Cria o HTML do widget do chat dinamicamente no body da página
function criarWidget() {
  const widget = document.createElement('div');
  widget.id = 'formis-chat-widget';
  widget.innerHTML = `
    <!-- Janela do chat (começa escondida) -->
    <div id="formis-chat-box">

      <!-- Cabeçalho do chat -->
      <div id="formis-chat-header">
        <div>
          <span>Forminho</span>
          <small>Assistente Virtual Formis</small>
        </div>
        <button id="formis-chat-home" title="Ir para a página inicial">← Início</button>
      </div>

      <!-- Área onde as mensagens aparecem -->
      <div id="formis-chat-messages"></div>

      <!-- Área de input para o usuário digitar -->
      <div id="formis-chat-input-area">
        <img src="src/forminho.png.png" alt="Forminho" id="formis-chat-input-image" />
        <input id="formis-chat-input" type="text" placeholder="Digite sua mensagem..." />
        <button id="formis-chat-send">➤</button>
      </div>

    </div>

    <!-- Botão flutuante que abre/fecha o chat -->
    <button id="formis-chat-toggle" aria-label="Abrir chat">
      <img src="src/rostoforminho.png" alt="Forminho" />
    </button>
  `;
  document.body.appendChild(widget);
}

// Histórico da conversa
let historico = [];

// ID da conversa no MongoDB
let conversaId = null;

// Temporizador de inatividade
let timerInatividade;

// Inicia ou reinicia o timer de inatividade de 5 minutos
function resetarTimerInatividade() {
  clearTimeout(timerInatividade);

  // Só ativa o timer se houver histórico (conversa em andamento)
  if (historico.length === 0) return;

  timerInatividade = setTimeout(() => {
    exibirAlertaInatividade();
  }, 200000); // 200000ms = 4 minutos
}

// Exibe o alerta de inatividade com cards de sim ou não
function exibirAlertaInatividade() {
  const box = document.querySelector('#formis-chat-box');

  // Só exibe se o chat estiver aberto e tiver histórico
  if (box.style.display !== 'flex' || historico.length === 0) return;

  adicionarMensagem('Você ainda está aí? Deseja continuar o atendimento?', 'bot');

  adicionarCards([
    {
      icone: '✅',
      titulo: 'Sim',
      subtitulo: 'Continuar atendimento'
    },
    {
      icone: '❌',
      titulo: 'Não',
      subtitulo: 'Encerrar conversa'
    }
  ]);
}

// Exibe a tela de boas vindas com os cards de escolha de atendimento
function exibirBoasVindas() {
  adicionarMensagem('Olá! Sou o Forminho, assistente virtual da Formis. Como você prefere ser atendido?', 'bot');
  adicionarCards([
    {
      icone: '🤖',
      titulo: 'Atendimento com IA',
      subtitulo: 'Respondido pelo Forminho, nosso assistente virtual'
    },
    {
      icone: '👨‍💼',
      titulo: 'Falar com Especialista',
      subtitulo: 'Atendimento humano via WhatsApp'
    }
  ]);
}

// Exibe cards para continuar ou encerrar após cada resposta do bot
function exibirCardsContinuidade() {
  adicionarCards([
    {
      icone: '✅',
      titulo: 'Sim',
      subtitulo: 'Quero continuar',
      acao: 'continuar_conversa'
    },
    {
      icone: '❌',
      titulo: 'Não',
      subtitulo: 'Voltar ao início',
      acao: 'voltar_inicio'
    }
  ]);
}

// Exibe avaliação por emojis ao encerrar a conversa
function exibirAvaliacaoAtendimento() {
  const container = document.querySelector('#formis-chat-messages');
  if (!container) return;

  // Opções de avaliação com emoji, label e mensagem de resposta
  const opcoes = [
    { emoji: '😞', label: 'Ruim',     mensagem: 'Lamentamos não ter atendido suas expectativas. Vamos melhorar! 💙' },
    { emoji: '😐', label: 'Regular',  mensagem: 'Obrigado pelo feedback! Estamos sempre melhorando. 💙' },
    { emoji: '😊', label: 'Bom',      mensagem: 'Ficamos felizes em ajudar! Obrigado. 💙' },
    { emoji: '😄', label: 'Ótimo',    mensagem: 'Que ótimo! Obrigado pela avaliação. 💙' }
  ];

  const avaliacaoWrapper = document.createElement('div');
  avaliacaoWrapper.className = 'avaliacao-wrapper';

  opcoes.forEach(opcao => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'avaliacao-btn';
    btn.innerHTML = `
      <span class="avaliacao-emoji">${opcao.emoji}</span>
      <span class="avaliacao-label">${opcao.label}</span>
    `;
    btn.title = opcao.label;

    btn.addEventListener('click', async () => {
      // Remove a avaliação após escolha
      avaliacaoWrapper.remove();

      // Tenta salvar a avaliação no servidor
      try {
        const apiUrl = getApiUrl().replace('/api/chat', '/api/chat/avaliar');
        await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emoji: opcao.emoji,
            label: opcao.label,
            conversaId: conversaId
          })
        });
      } catch (error) {
        console.error('Erro ao salvar avaliação:', error);
      }

      // Exibe mensagem de agradecimento
      adicionarMensagem(opcao.mensagem, 'bot');

      // Reseta o chat após 2 segundos
      setTimeout(() => {
        resetarParaInicio();
      }, 2000);
    });

    avaliacaoWrapper.appendChild(btn);
  });

  container.appendChild(avaliacaoWrapper);
  container.scrollTop = container.scrollHeight;
}

// Inicia encerramento da conversa pedindo avaliação
function encerrarComAvaliacao() {
  clearTimeout(timerInatividade);
  adicionarMensagem('Antes de encerrar, como você avalia o atendimento?', 'bot');
  exibirAvaliacaoAtendimento();
}

// Restaura o chat para a tela inicial do bot
function resetarParaInicio() {
  clearTimeout(timerInatividade);
  const container = document.querySelector('#formis-chat-messages');
  if (!container) return;
  container.innerHTML = '';
  historico = [];
  conversaId = null;
  exibirBoasVindas();
}

// Adiciona uma mensagem de texto na tela do chat
function adicionarMensagem(texto, tipo) {
  const container = document.querySelector('#formis-chat-messages');
  const msg = document.createElement('div');
  msg.className = `msg ${tipo}`;
  msg.textContent = texto;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  return msg;
}

// Renderiza os cards clicáveis dentro do chat
function adicionarCards(cards) {
  const container = document.querySelector('#formis-chat-messages');

  const cardsWrapper = document.createElement('div');
  cardsWrapper.className = 'cards-wrapper';

  cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'chat-card';
    cardEl.innerHTML = `
      <span class="card-icone">${card.icone}</span>
      <span class="card-titulo">${card.titulo}</span>
      <span class="card-subtitulo">${card.subtitulo}</span>
    `;

    cardEl.addEventListener('click', () => {
      cardsWrapper.remove();

      // Fluxo de continuidade da conversa
      if (card.acao === 'continuar_conversa') {
        adicionarMensagem('Perfeito! Me conta como posso te ajudar.', 'bot');
        resetarTimerInatividade();
        return;
      }

      if (card.acao === 'voltar_inicio') {
        encerrarComAvaliacao();
        return;
      }

      // Falar com Especialista — abre WhatsApp
      if (card.titulo === 'Falar com Especialista') {
        adicionarMensagem('Ótimo! Vou te redirecionar para um especialista Formis. 😊', 'bot');
        setTimeout(() => {
          window.open('https://wa.me/5511945092300?text=Olá!%20Gostaria%20de%20falar%20com%20um%20especialista%20Formis.', '_blank');
        }, 1000);

      // Inatividade: Não — pede avaliação antes de encerrar
      } else if (card.titulo === 'Não') {
        encerrarComAvaliacao();

      // Inatividade: Sim — continua e reinicia timer
      } else if (card.titulo === 'Sim') {
        adicionarMensagem('Ótimo! Como posso te ajudar? 😊', 'bot');
        resetarTimerInatividade();

      // Qualquer outro card — envia mensagem normalmente
      } else {
        enviarMensagemTexto(`Me fale mais sobre ${card.titulo}`);
      }
    });

    cardsWrapper.appendChild(cardEl);
  });

  container.appendChild(cardsWrapper);
  container.scrollTop = container.scrollHeight;
}

// Tenta extrair JSON válido quando o modelo retorna texto extra junto com o objeto
function extrairJSON(texto) {
  if (typeof texto !== 'string') return null;
  const limpo = texto.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(limpo);
  } catch {
    const match = limpo.match(/(\{[\s\S]*\})|(\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    const trecho = limpo.match(/"texto"\s*:\s*"[\s\S]*"\s*(,\s*"cards"\s*:\s*\[[\s\S]*\])?/);
    if (trecho) {
      try {
        return JSON.parse(`{${trecho[0]}}`);
      } catch {}
    }
  }
  return null;
}

// Retorna a URL da API (baseado no ambiente - desenvolvimento ou produção)
function getApiUrl() {
  const configurado = window.FORMIS_API_URL || window.__FORMIS_API_URL__;

  if (typeof configurado === 'string' && configurado.trim()) {
    const baseUrl = configurado.trim().replace(/\/$/, '');
    return baseUrl.endsWith('/api/chat')
      ? baseUrl
      : `${baseUrl}/api/chat`;
  }

  return window.location.protocol === 'file:'
    ? 'http://localhost:3002/api/chat'
    : '/api/chat';
}

    // Função que processa e envia uma mensagem de texto para o backend
   async function enviarMensagemTexto(texto) {
  
    // Reinicia o timer de inatividade a cada mensagem enviada
  resetarTimerInatividade();

  adicionarMensagem(texto, 'user');
  historico.push({ role: 'user', content: texto });
  const digitando = adicionarMensagem('Forminho está digitando...', 'digitando');

  try {
    // Tenta a URL principal
    const primaryUrl = getApiUrl();
    const payload = { 
      historico,
      conversaId 
    };

    let resposta;
    try {
      resposta = await fetch(primaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Se houve erro de rede, tenta fallback na porta 3002
      const host = window.location.hostname;
      const fallbackUrl = `http://${host}:3002/api/chat`;
      if (!primaryUrl.includes(':3002')) {
        try {
          resposta = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (err2) {
          throw err2;
        }
      } else {
        throw err;
      }
    }

    // Se retornou uma resposta inválida (404 etc), tenta fallback também
    if (!resposta.ok && (resposta.status === 404 || resposta.status === 0)) {
      const host = window.location.hostname;
      const fallbackUrl = `http://${host}:3002/api/chat`;
      if (!primaryUrl.includes(':3002')) {
        const tentativa = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        resposta = tentativa;
      }
    }

    if (!resposta.ok) {
      const mensagemErro = await resposta.text();
      throw new Error(`Erro ${resposta.status}: ${mensagemErro}`);
    }

    const dados = await resposta.json();
    digitando.remove();

    // Salva o conversaId retornado pelo servidor
    if (dados.conversaId) {
      conversaId = dados.conversaId;
    }

    const resultado = dados.resposta || dados;

    let textoBot = '';
    let cards = [];
    let source = resultado;

    if (typeof resultado === 'string') {
      const parsed = extrairJSON(resultado);
      if (parsed) source = parsed;
    }

    if (typeof source === 'object' && source !== null) {
      if (Array.isArray(source)) {
        cards = source;
        textoBot = 'Veja os produtos abaixo:';
      } else if ('texto' in source || 'cards' in source) {
        textoBot = typeof source.texto === 'string' && source.texto.trim().length
          ? source.texto
          : source.cards && source.cards.length
            ? 'Veja os cards abaixo:'
            : '';
        cards = source.cards || [];
      } else if ('icone' in source && 'titulo' in source) {
        cards = [source];
        textoBot = 'Veja o produto abaixo:';
      }
    } else if (typeof source === 'string') {
      textoBot = source;
    }

    // Se ainda tiver JSON cru no texto, limpa antes de exibir
    if (typeof textoBot === 'string' && textoBot.match(/"texto"\s*:\s*"/)) {
      const parsed = extrairJSON(textoBot);
      if (parsed && typeof parsed.texto === 'string') {
        textoBot = parsed.texto;
        cards = parsed.cards || cards;
      }
    }

    // Exibe só o texto limpo
    adicionarMensagem(textoBot, 'bot');

    // Exibe os cards se existirem
    if (cards.length > 0) {
      adicionarCards(cards);
    }

    // Pergunta se deseja continuar após a resposta
    exibirCardsContinuidade();

    // Salva no histórico só o texto limpo
    historico.push({ role: 'assistant', content: textoBot });

  } catch (error) {
    digitando.remove();
    console.error('Erro na chamada da API:', error);
    adicionarMensagem('Erro ao conectar. Tente novamente.', 'bot');
  }
}

// Função chamada ao clicar no botão enviar ou pressionar Enter
async function enviarMensagem() {
  const input = document.querySelector('#formis-chat-input');
  const texto = input.value.trim();
  if (!texto) return;
  input.value = '';
  await enviarMensagemTexto(texto);
}

// Inicializa o widget quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  criarWidget();

  // Abre/fecha o chat
  document.querySelector('#formis-chat-toggle').addEventListener('click', () => {
    const box = document.querySelector('#formis-chat-box');
    const aberto = box.style.display === 'flex';
    box.style.display = aberto ? 'none' : 'flex';

    // Exibe boas vindas na primeira abertura
    if (!aberto && historico.length === 0) {
      exibirBoasVindas();
    }
  });

  // Botão início — reseta o chat para a tela inicial
  document.querySelector('#formis-chat-home').addEventListener('click', () => {
    resetarParaInicio();
  });

  // Botão enviar
  document.querySelector('#formis-chat-send').addEventListener('click', enviarMensagem);

  // Enter para enviar
  document.querySelector('#formis-chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') enviarMensagem();
  });
});