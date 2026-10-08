const assert = require('node:assert/strict');
const Module = require('node:module');
const originalLoad = Module._load;

class FakeGroq {
  constructor() {
    this.chat = {
      completions: {
        create: async () => ({ choices: [{ message: { content: FakeGroq.content } }] })
      }
    };
  }
}

Module._load = function (request, parent, isMain) {
  if (request === 'groq-sdk') return FakeGroq;
  return originalLoad.call(this, request, parent, isMain);
};

const { enviarMensagem } = require('./backend/services/groqService');

(async () => {
  FakeGroq.content = '{"texto":"Resposta limpa","cards":[{"icone":"📦","titulo":"Produto","subtitulo":"Detalhe"}]}';
  const valida = await enviarMensagem([]);
  assert.equal(valida.texto, 'Resposta limpa');
  assert.equal(valida.cards.length, 1);

  FakeGroq.content = '{"texto":"Resposta limpa parcial","cards":[{"icone":"📦","titulo":"Produto","subtitulo":"Detalhe"},{"icone":"📦';
  const parcial = await enviarMensagem([]);
  assert.equal(parcial.texto, 'Resposta limpa parcial');
  assert.equal(parcial.cards.length, 1);

  FakeGroq.content = '{"cards":[';
  const irrecuperavel = await enviarMensagem([]);
  assert.ok(!irrecuperavel.texto.includes('{'));
  assert.ok(irrecuperavel.texto.includes('tentar novamente'));

  console.log('OK: respostas válidas, truncadas e irrecuperáveis não exibem JSON bruto.');
})().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
