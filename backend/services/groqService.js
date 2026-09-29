// Importa o SDK oficial da Groq para fazer chamadas á API de IA 
const Groq = require('groq-sdk');
const { systemPrompt } = require('./systemPrompt');

// Cria uma instância do cliente Groq usando a chave de API do arquivo .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Função principal que envia o histórico da conversa para IA e retorna a resposta
async function enviarMensagem(historico) {
  const resposta = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: systemPrompt },
      ...historico
    ],
    max_tokens: 500,
    temperature: 0.7
  });

  // Pega o texto da resposta com segurança
  const texto = resposta?.choices?.[0]?.message?.content;
  if (!texto) {
    return { texto: 'Desculpe, não recebi resposta do modelo.', cards: [] };
  }

  // Tenta parsear o JSON retornado pela IA
  try {
    
    // Remove possíveis marcações de código caso o modelo as inclua
    const limpo = texto.replace(/```json|```/g, '').trim();
    const match = limpo.match(/\{[\s\S]*\}/);
    const jsonText = match ? match[0] : limpo;
    return JSON.parse(jsonText);
  } catch {
    // Se não vier em JSON, retorna só o texto sem cards
    return { texto: texto.trim(), cards: [] };
  }
}

module.exports = { enviarMensagem };

