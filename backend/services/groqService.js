// Importa o SDK oficial da Groq para fazer chamadas á API de IA 
const Groq = require('groq-sdk');
const { systemPrompt } = require('./systemPrompt');

// Cria uma instância do cliente Groq usando a chave de API do arquivo .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function normalizarCards(cards) {
  if (!Array.isArray(cards)) return [];

  return cards
    .filter((card) => card && typeof card === 'object'
      && typeof card.titulo === 'string'
      && typeof card.subtitulo === 'string')
    .map((card) => ({
      icone: typeof card.icone === 'string' ? card.icone : '📦',
      titulo: card.titulo,
      subtitulo: card.subtitulo
    }));
}

function converterEstrutura(parsed) {
  if (Array.isArray(parsed)) {
    return { texto: 'Veja os produtos abaixo:', cards: normalizarCards(parsed) };
  }

  if (!parsed || typeof parsed !== 'object') return null;

  if (typeof parsed.titulo === 'string' && typeof parsed.subtitulo === 'string') {
    return { texto: 'Veja o produto abaixo:', cards: normalizarCards([parsed]) };
  }

  const cards = normalizarCards(parsed.cards);
  const texto = typeof parsed.texto === 'string' && parsed.texto.trim()
    ? parsed.texto.trim()
    : cards.length
      ? 'Veja os produtos abaixo:'
      : null;

  return texto ? { texto, cards } : null;
}

function recuperarRespostaIncompleta(texto) {
  const campoTexto = texto.match(/"texto"\s*:\s*("(?:\\.|[^"\\])*")/s);
  let mensagem = '';

  if (campoTexto) {
    try {
      mensagem = JSON.parse(campoTexto[1]);
    } catch {}
  }

  const cardsCompletos = [...texto.matchAll(/\{[^{}]*\}/gs)]
    .map((match) => {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    })
    .filter((item) => item && typeof item.titulo === 'string');
  const cards = normalizarCards(cardsCompletos);

  if (!mensagem && !cards.length) return null;

  return {
    texto: mensagem || 'Veja os produtos abaixo:',
    cards
  };
}

function normalizarResposta(texto) {
  const limpo = texto.replace(/```json|```/gi, '').trim();

  try {
    const respostaEstruturada = converterEstrutura(JSON.parse(limpo));
    if (respostaEstruturada) return respostaEstruturada;
  } catch {}

  const recuperada = recuperarRespostaIncompleta(limpo);
  if (recuperada) return recuperada;

  // Nunca envia JSON inválido para a interface como se fosse uma resposta em texto.
  if (/^[\[{]/.test(limpo) || /"(?:texto|cards)"\s*:/.test(limpo)) {
    return {
      texto: 'Desculpe, não consegui organizar a resposta agora. Pode tentar novamente?',
      cards: []
    };
  }

  return { texto: limpo, cards: [] };
}

// Função principal que envia o histórico da conversa para IA e retorna a resposta
async function enviarMensagem(historico) {
  const resposta = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: systemPrompt },
      ...historico
    ],
    max_tokens: 800,
    temperature: 0.7
  });

  // Pega o texto da resposta com segurança
  const texto = resposta?.choices?.[0]?.message?.content;
  if (!texto) {
    return { texto: 'Desculpe, não recebi resposta do modelo.', cards: [] };
  }

  return normalizarResposta(texto);
}

module.exports = { enviarMensagem };

