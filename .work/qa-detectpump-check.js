const assert = require('node:assert/strict');
const {
  obterRespostaCatalogo,
  obterRespostaDetectorPorQuantidade
} = require('../backend/services/catalogoService');

const oitoGases = obterRespostaDetectorPorQuantidade([
  { role: 'user', content: 'Vocês teriam detector de 8 gases?' }
]);
assert.ok(oitoGases);
assert.match(oitoGases.texto, /FOR-ULTRA/);
assert.deepEqual(oitoGases.cards.map((card) => card.titulo), ['FOR-ULTRA']);
assert.match(oitoGases.cards[0].subtitulo, /8 gases/);

const oitoPorExtenso = obterRespostaDetectorPorQuantidade([
  { role: 'user', content: 'Tem detector de oito gases?' }
]);
assert.equal(oitoPorExtenso.cards[0].titulo, 'FOR-ULTRA');

const quatroGases = obterRespostaDetectorPorQuantidade([
  { role: 'user', content: 'Vocês têm detector de 4 gases?' }
]);
assert.deepEqual(quatroGases.cards.map((card) => card.titulo), ['DetectPump', 'GASFOR', 'FOR-4000']);
assert.ok(quatroGases.cards.every((card) => /4 gases/.test(card.subtitulo)));

const apenasDetectPump = obterRespostaDetectorPorQuantidade([
  { role: 'user', content: 'O DetectPump é de 4 gases?' }
]);
assert.deepEqual(apenasDetectPump.cards.map((card) => card.titulo), ['DetectPump']);

const ambasVersoes = obterRespostaDetectorPorQuantidade([
  { role: 'user', content: 'Temos detector de 4 e 8 gases?' }
]);
assert.deepEqual(ambasVersoes.cards.map((card) => card.titulo), [
  'DetectPump', 'GASFOR', 'FOR-4000', 'FOR-ULTRA'
]);

const catalogoGases = obterRespostaCatalogo([
  { role: 'user', content: 'Quero ver o catálogo de gases' }
]);
assert.ok(catalogoGases.cards.some((card) =>
  card.titulo === 'DetectPump' && /4 gases/.test(card.subtitulo)
));
assert.ok(catalogoGases.cards.some((card) =>
  card.titulo === 'FOR-ULTRA' && /8 gases/.test(card.subtitulo)
));

console.log('OK: DetectPump/GASFOR/FOR-4000 = 4 gases; FOR-ULTRA = 8 em 1.');
