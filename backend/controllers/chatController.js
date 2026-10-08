// Importa o serviço que faz a comunicação com a API da Groq
const { enviarMensagem } = require('../services/groqService');

// Importa os modelos do MongoDB
const Conversa = require('../models/conversa');
const Avaliacao = require('../models/avaliacao');
const {
  obterRespostaCatalogo,
  obterRespostaDetectorPorQuantidade
} = require('../services/catalogoService');

// Função principal que processa as mensagens recebidas do frontend
async function processarMensagem(req, res) {
  try {
    const { historico, conversaId } = req.body;

    if (!historico || historico.length === 0) {
      return res.status(400).json({ error: 'Histórico de mensagens é obrigatório.' });
    }

    // Pedidos de catálogo e perguntas sobre detectores de 4/8 gases usam dados locais confiáveis.
    let resposta = obterRespostaCatalogo(historico)
      || obterRespostaDetectorPorQuantidade(historico);

    if (!resposta) {
      // Envia o histórico para o serviço da Groq e aguarda a resposta
      const resultado = await enviarMensagem(historico);

      // Se o resultado já vier parseado como objeto, usa direto
      // Se vier como string, tenta parsear
      if (typeof resultado === 'object') {
        resposta = resultado;
      } else {
        try {
          const limpo = resultado.replace(/```json|```/g, '').trim();
          resposta = JSON.parse(limpo);
        } catch {
          // Se não conseguir parsear, retorna texto puro sem cards
          resposta = { texto: resultado, cards: [] };
        }
      }
    }

    // Loga no console para debug — mostra o que o bot retornou
    console.log('Resposta do bot:', JSON.stringify(resposta, null, 2));

    // Salva ou atualiza a conversa no MongoDB
    let conversa;
    if (conversaId) {
      // Atualiza conversa existente
      conversa = await Conversa.findByIdAndUpdate(
        conversaId,
        {
          $set: { mensagens: historico }
        },
        { new: true }
      );
    } else {
      // Cria nova conversa
      conversa = new Conversa({
        mensagens: historico
      });
      await conversa.save();
    }

    // Retorna a resposta junto com o ID da conversa
    res.json({ 
      resposta,
      conversaId: conversa._id
    });

  } catch (error) {
    console.error('Erro ao processar mensagem:', error.message);
    res.status(500).json({ error: 'Erro interno ao processar a mensagem.' });
  }
}

// Função para salvar a avaliação do atendimento
async function salvarAvaliacao(req, res) {
  try {
    const { emoji, label, conversaId } = req.body;

    if (!emoji || !label) {
      return res.status(400).json({ error: 'Emoji e label são obrigatórios.' });
    }

    // Salva a avaliação
    const avaliacao = new Avaliacao({
      emoji,
      label
    });
    await avaliacao.save();

    // Se houver conversaId, atualiza a conversa com a avaliação e data de encerramento
    if (conversaId) {
      await Conversa.findByIdAndUpdate(
        conversaId,
        {
          $set: {
            'avaliacao.emoji': emoji,
            'avaliacao.label': label,
            encerradoEm: new Date()
          }
        }
      );
    }

    res.json({ 
      sucesso: true,
      mensagem: 'Avaliação salva com sucesso!',
      avaliacaoId: avaliacao._id
    });

  } catch (error) {
    console.error('Erro ao salvar avaliação:', error.message);
    res.status(500).json({ error: 'Erro interno ao salvar a avaliação.' });
  }
}

module.exports = { processarMensagem, salvarAvaliacao };
