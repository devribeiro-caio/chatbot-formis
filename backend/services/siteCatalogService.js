const SITE_URL = 'https://www.formis.com.br';
const REQUEST_TIMEOUT_MS = 10000;
const MAX_DETAIL_PAGES = 3;
const MAX_CATALOG_CHARS = 8000;

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function limparTexto(texto) {
  return texto
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function buscar(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const resposta = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FormisBot/1.0 (catalogo de produtos)' }
    });

    if (!resposta.ok) {
      throw new Error(`O site retornou HTTP ${resposta.status} para ${url}`);
    }

    return new TextDecoder('windows-1252').decode(await resposta.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

function extrairUrls(xml) {
  return [...xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi)]
    .map((match) => match[1].trim())
    .filter((url) => url.startsWith(`${SITE_URL}/`));
}

function tituloDaUrl(url) {
  const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function tokens(texto) {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function pareceProduto(url) {
  return ![
    '/depoimentos-', '/politica-', '/trabalhe-', '/contato', '/cadastro',
    '/login', '/central-', '/atendimento', '/blog', '/sitemap', '/sobre-',
    '/nossa-', '/revendedor'
  ].some((caminho) => url.includes(caminho));
}

async function obterCatalogoDoSite(pergunta) {
  const sitemap = await buscar(`${SITE_URL}/sitemap.xml`);
  const urlsDoIndice = extrairUrls(sitemap);
  const sitemaps = urlsDoIndice.filter((url) => url.endsWith('.xml'));
  const urls = (sitemaps.length
    ? (await Promise.all(sitemaps.map(buscar))).flatMap(extrairUrls)
    : urlsDoIndice
  ).filter((url) => !url.endsWith('.xml') && pareceProduto(url));

  if (urls.length === 0) {
    throw new Error('O sitemap do site não contém produtos publicados.');
  }

  const consulta = tokens(pergunta);
  const selecionados = urls
    .map((url) => ({
      url,
      titulo: tituloDaUrl(url),
      relevancia: consulta.reduce(
        (total, token) => total + (normalizar(`${url} ${tituloDaUrl(url)}`).includes(token) ? 1 : 0),
        0
      )
    }))
    .sort((a, b) => b.relevancia - a.relevancia)
    .slice(0, MAX_DETAIL_PAGES);

  const detalhes = await Promise.all(selecionados.map(async (produto) => {
    const html = await buscar(produto.url);
    const descricao = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
    );
    return {
      titulo: descricao?.[1]?.trim() || produto.titulo,
      url: produto.url,
      descricao: limparTexto(html).slice(0, 1800)
    };
  }));

  const indice = urls
    .map((url) => `- ${tituloDaUrl(url)} | ${url}`)
    .join('\n')
    .slice(0, MAX_CATALOG_CHARS);

  return [
    `ÍNDICE EM TEMPO REAL DO SITE (${urls.length} URLs encontradas):`,
    indice,
    '\nDETALHES DAS PÁGINAS MAIS RELEVANTES:',
    detalhes.map((produto) => `\n${JSON.stringify(produto)}`).join('\n')
  ].join('\n');
}

module.exports = { obterCatalogoDoSite };
