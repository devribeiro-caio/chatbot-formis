const produtos = [
  { categoria: 'gases', icone: '🧪', titulo: 'FOR-CL2', subtitulo: 'Detector de gás cloro' },
  { categoria: 'gases', icone: '🧪', titulo: 'FOR-NH3', subtitulo: 'Detector de gás amônia' },
  { categoria: 'gases', icone: '🧪', titulo: 'FOR-CO', subtitulo: 'Detector de monóxido de carbono' },
  { categoria: 'gases', icone: '🧪', titulo: 'FOR-CO2', subtitulo: 'Detector de dióxido de carbono' },
  { categoria: 'gases', icone: '🧪', titulo: 'FOR-H2S', subtitulo: 'Detector de gás sulfídrico' },
  { categoria: 'gases', icone: '⚙️', titulo: 'DetectPump', subtitulo: 'Detector de 4 gases (H2S, CO, O2 e LEL) com bomba integrada' },
  { categoria: 'gases', icone: '🧪', titulo: 'GASFOR', subtitulo: 'Detector de 4 gases (H2S, CO, O2 e LEL)' },
  { categoria: 'gases', icone: '⚙️', titulo: 'FOR-4000', subtitulo: 'Detector de 4 gases (O2, CO, H2S e EX) com bomba integrada' },
  { categoria: 'gases', icone: '⚙️', titulo: 'FOR-ULTRA', subtitulo: 'Detector de 8 gases com bomba integrada, modelo 8 em 1' },
  { categoria: 'gases', icone: '🧰', titulo: 'Kit Espaço Confinado GOLD', subtitulo: 'Kit NR33 com detector 4 gases' },
  { categoria: 'gases', icone: '🧰', titulo: 'Kit Espaço Confinado PLATINUM', subtitulo: 'Kit NR33 com detector e bomba de amostragem' },
  { categoria: 'bafometros', icone: '💨', titulo: 'FOR-100', subtitulo: 'Bafômetro digital portátil' },
  { categoria: 'bafometros', icone: '💨', titulo: 'FOR-500', subtitulo: 'Bafômetro tipo bastão' },
  { categoria: 'bafometros', icone: '💨', titulo: 'FOR-700', subtitulo: 'Bafômetro tipo bastão digital' },
  { categoria: 'bafometros', icone: '💨', titulo: 'FOR-700R', subtitulo: 'Bafômetro com datalogger' },
  { categoria: 'bafometros', icone: '💨', titulo: 'FOR-500 PLUS', subtitulo: 'Bafômetro com impressora' },
  { categoria: 'bafometros', icone: '💨', titulo: 'FOR-60', subtitulo: 'Bafômetro portátil com impressora wireless' },
  { categoria: 'laboratorio', icone: '🧪', titulo: 'FOR-911', subtitulo: 'Medidor de pH portátil' },
  { categoria: 'laboratorio', icone: '🌡️', titulo: 'FOR-650', subtitulo: 'Termômetro digital à prova d’água' },
  { categoria: 'higiene', icone: '👷', titulo: 'Kit Safe Ergonomia PLATINUM', subtitulo: 'Conjunto ergonômico completo' },
  { categoria: 'higiene', icone: '👷', titulo: 'Kit Safe Ergonomia GOLD', subtitulo: 'Conjunto de segurança e medição' },
  { categoria: 'higiene', icone: '👷', titulo: 'Kit Safe Ergonomia SILVER', subtitulo: 'Conjunto compacto de medição' },
  { categoria: 'acessorios', icone: '🧰', titulo: 'KIT Acessórios GOLD', subtitulo: 'Ciclone, redutor e amostrador' },
  { categoria: 'acessorios', icone: '🧰', titulo: 'KIT Acessórios SILVER', subtitulo: 'Ciclone e suporte para cassete' },
  { categoria: 'higiene', icone: '📦', titulo: 'Kit Higiene Ocupacional SILVER', subtitulo: 'Amostragem de agentes químicos' },
  { categoria: 'higiene', icone: '📦', titulo: 'Kit Higiene Ocupacional GOLD', subtitulo: 'Amostragem avançada de agentes químicos' },
  { categoria: 'higiene', icone: '📦', titulo: 'Kit Higiene Ocupacional Turam SILVER', subtitulo: 'Amostradora de gases e poeiras' },
  { categoria: 'higiene', icone: '📦', titulo: 'Kit Higiene Ocupacional Turam GOLD', subtitulo: 'Amostragem profissional Turam' }
];

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function obterCategoria(pergunta) {
  if (/\b(bafometro|bafometros|etilometro|etilometros)\b/.test(pergunta)) return 'bafometros';
  if (/\b(acessorio|acessorios)\b/.test(pergunta)) return 'acessorios';
  if (/\b(laboratorio|ph|termometro|temperatura)\b/.test(pergunta)) return 'laboratorio';
  if (/\b(higiene|ergonomia|dosimetro|decibelimetro|luximetro)\b/.test(pergunta)) return 'higiene';
  if (/\b(gas|gases|detector|cloro|amonia|co2|h2s)\b/.test(pergunta)) return 'gases';
  return null;
}

function obterRespostaCatalogo(historico) {
  const ultimaMensagem = [...(historico || [])]
    .reverse()
    .find((mensagem) => mensagem?.role === 'user' && typeof mensagem.content === 'string');

  if (!ultimaMensagem) return null;

  const pergunta = normalizar(ultimaMensagem.content);
  if (!/\bcatalogo(s)?\b/.test(pergunta)) return null;

  const categoria = obterCategoria(pergunta);
  const selecionados = produtos.filter((produto) => !categoria || produto.categoria === categoria);
  if (selecionados.length === 0) return null;

  const nomeCategoria = {
    gases: 'de detecção de gases',
    bafometros: 'de bafômetros',
    laboratorio: 'de laboratório',
    higiene: 'de higiene ocupacional e ergonomia',
    acessorios: 'de acessórios'
  }[categoria];

  return {
    texto: categoria
      ? `Claro! Veja os produtos ${nomeCategoria}. Toque em um card para saber mais.`
      : 'Claro! Veja alguns produtos do nosso catálogo. Toque em um card para saber mais.',
    cards: selecionados.map(({ categoria: _categoria, ...card }) => card)
  };
}

function obterRespostaDetectorPorQuantidade(historico) {
  const ultimaMensagem = [...(historico || [])]
    .reverse()
    .find((mensagem) => mensagem?.role === 'user' && typeof mensagem.content === 'string');

  if (!ultimaMensagem) return null;

  const pergunta = normalizar(ultimaMensagem.content);
  const mencionaQuatroGases = /\b(?:4|quatro)[\s-]*gases?\b/.test(pergunta);
  const mencionaOitoGases = /\b(?:8|oito)[\s-]*gases?\b/.test(pergunta);
  const mencionaDeteccao = /\b(detector(?:es)?|detectpump|detecao|gas|gases)\b/.test(pergunta);

  if ((!mencionaQuatroGases && !mencionaOitoGases) || !mencionaDeteccao) return null;

  const nomesQuatroGases = pergunta.includes('detectpump')
    ? ['DetectPump']
    : ['DetectPump', 'GASFOR', 'FOR-4000'];
  const nomesSelecionados = [
    ...(mencionaQuatroGases ? nomesQuatroGases : []),
    ...(mencionaOitoGases ? ['FOR-ULTRA'] : [])
  ];
  const cards = produtos
    .filter((produto) => nomesSelecionados.includes(produto.titulo))
    .map(({ categoria: _categoria, ...card }) => card);

  let texto;
  if (mencionaQuatroGases && mencionaOitoGases) {
    texto = 'Sim. Temos opções de 4 gases e o FOR-ULTRA 8 em 1. Veja os modelos nos cards.';
  } else if (mencionaOitoGases) {
    texto = 'Sim. Temos o FOR-ULTRA, detector com bomba integrada e configuração 8 em 1.';
  } else if (pergunta.includes('detectpump')) {
    texto = 'Sim. O DetectPump é um detector de 4 gases com bomba integrada.';
  } else {
    texto = 'Sim. Temos detectores de 4 gases, incluindo DetectPump, GASFOR e FOR-4000.';
  }

  return {
    texto: `${texto} Toque em um card para saber mais.`,
    cards
  };
}

module.exports = { obterRespostaCatalogo, obterRespostaDetectorPorQuantidade };
