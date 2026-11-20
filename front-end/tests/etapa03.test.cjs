// Verificações de arquivos e DOM/rede simulados. Não são testes visuais de navegador.
// Executar: node front-end/tests/etapa03.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pagina, read, vm, fs, root } = require('./support/ambiente.cjs');

function arquivoComCaseExato(file) {
  const relative = path.relative(root, file);
  let atual = root;
  for (const parte of relative.split(path.sep)) {
    assert.ok(fs.readdirSync(atual).includes(parte), `Caminho ausente ou case incorreto: ${file}`);
    atual = path.join(atual, parte);
  }
  assert.ok(fs.statSync(atual).isFile(), file);
}

test('auditoria de caminhos: imagens, CSS, JS e links locais existem com case exato', () => {
  const sources = fs.readdirSync(root).filter(f => f.endsWith('.html')).map(f => path.join(root, f));
  for (const folder of ['css', 'js']) {
    sources.push(...fs.readdirSync(path.join(root, folder)).filter(f => /\.(css|js)$/.test(f)).map(f => path.join(root, folder, f)));
  }
  let count = 0;
  for (const source of sources) {
    const text = fs.readFileSync(source, 'utf8');
    const refs = [];
    if (source.endsWith('.html')) refs.push(...[...text.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)].map(m => m[1]));
    if (source.endsWith('.css')) refs.push(...[...text.matchAll(/url\(\s*["']?([^\s\)"']+)/g)].map(m => m[1]));
    refs.push(...[...text.matchAll(/["']((?:\.?\.?\/)?images\/[^"'`\s]+)["']/g)].map(m => m[1]));
    for (const ref of new Set(refs)) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(ref) || ref.includes('${')) continue;
      const pathname = decodeURIComponent(ref.split(/[?#]/)[0]);
      if (!pathname) continue;
      const base = source.endsWith('.js') ? root : path.dirname(source);
      arquivoComCaseExato(path.resolve(base, pathname));
      count++;
    }
  }
  assert.ok(count > 50);
});

test('11 galerias mantêm apenas as 14 imagens locais existentes, sem duplicações', () => {
  const context = vm.createContext({});
  vm.runInContext(read('js/produtos-data.js'), context);
  const products = vm.runInContext('produtos', context);
  assert.equal(Object.keys(products).length, 11);
  let total = 0;
  for (const p of Object.values(products)) {
    assert.ok(p.imagens.length >= 1);
    assert.equal(new Set(p.imagens).size, p.imagens.length);
    for (const image of p.imagens) arquivoComCaseExato(path.join(root, image));
    total += p.imagens.length;
  }
  assert.equal(total, 14);
});

test('produto válido mostra detalhe e galeria, ocultando o carregamento', async () => {
  const h = await pagina({ page: 'produto' });
  assert.equal(h.get('estadoProduto').hidden, true);
  assert.equal(h.get('conteudoProduto').hidden, false);
  assert.equal(h.get('relacionados').hidden, false);
  assert.equal(h.get('imagemPrincipal').src, h.products['black-hat'].imagens[0]);
  assert.equal(h.get('miniaturas').children.length, 1);
  assert.equal(h.get('avisoCatalogoProduto').hidden, true);
});

for (const query of ['', '?id=', '?id=nao-existe', '?id=toString', '?id=__proto__']) {
  test(`produto ausente/inválido (${query || 'sem ID'}) mostra retorno e bloqueia compra`, async () => {
    const h = await pagina({ page: 'produto', search: query });
    assert.equal(h.get('tituloEstadoProduto').textContent, 'Produto não encontrado');
    assert.equal(h.get('estadoProduto').hidden, false);
    assert.equal(h.get('conteudoProduto').hidden, true);
    assert.equal(h.get('relacionados').hidden, true);
    assert.equal(h.get('btnComprar').disabled, true);
    assert.match(read('produto.html'), /id="estadoProduto"[\s\S]*?<a href="produtos.html">VOLTAR AO CATÁLOGO<\/a>/);
    h.get('btnComprar').click();
    assert.deepEqual(h.cart(), []);
  });
}

test('galeria alterna miniaturas e ignora referências que falharam', async () => {
  const h = await pagina({ page: 'produto', id: 'fleece-frente', offline: true });
  const miniaturas = h.get('miniaturas').children;
  assert.equal(miniaturas.length, 3);
  miniaturas[1].click();
  [...h.timers.values()].filter(t => t.ms === 180).at(-1).fn();
  assert.equal(h.get('imagemPrincipal').src, miniaturas[1].src);
  miniaturas[1].dispatchEvent({ type: 'error' });
  assert.equal(miniaturas[1].hidden, true);
  assert.equal(h.get('imagemPrincipal').src, miniaturas[0].src);
  miniaturas[1].click();
  assert.equal(h.get('imagemPrincipal').src, miniaturas[0].src);
});

test('imagem remota que falha usa a frente local do mesmo produto; falha completa informa indisponibilidade', async () => {
  const h = await pagina({ page: 'produto', remote: [{
    source_id: 'black-hat', name: 'Black Hat', price: 89.99, sizes: ['Único'],
    images: ['https://exemplo.invalid/indisponivel.png'], is_active: true
  }] });
  const main = h.get('imagemPrincipal');
  main.dispatchEvent({ type: 'error' });
  assert.equal(main.src, 'images/produtos/black-hat/frente.png');
  assert.equal(h.get('miniaturas').children[0].hidden, true);
  main.dispatchEvent({ type: 'error' });
  assert.equal(main.hidden, true);
  assert.equal(main.getAttribute('src'), null);
  assert.equal(h.get('estadoImagem').hidden, false);
});

test('produto remoto sem imagens apresenta aviso, sem fabricar imagem', async () => {
  const h = await pagina({ page: 'produto', id: 'novo', remote: [{ source_id: 'novo', name: 'Peça nova', price: 10, sizes: ['M'], is_active: true }] });
  assert.equal(h.get('imagemPrincipal').hidden, true);
  assert.equal(h.get('estadoImagem').hidden, false);
  assert.equal(h.get('miniaturas').children.length, 0);
});

test('rede offline mantém detalhe local com aviso explícito', async () => {
  const h = await pagina({ page: 'produto', offline: true });
  assert.equal(h.context.armoireCatalogoEstado.fonte, 'local');
  assert.equal(h.get('avisoCatalogoProduto').hidden, false);
  assert.equal(h.get('conteudoProduto').hidden, false);
  assert.equal(h.get('imagemPrincipal').src, 'images/produtos/black-hat/frente.png');
});

test('sem ID, estado aparece imediatamente antes do timeout de rede', async () => {
  await pagina({ page: 'produto', search: '', slow: true, afterDispatch: ({ document, timers }) => {
    assert.equal(document.getElementById('tituloEstadoProduto').textContent, 'Produto não encontrado');
    [...timers.values()].find(t => t.ms === 8000).fn();
  } });
});

test('rede lenta encerra loading com fallback mesmo sem AbortController; resposta tardia não altera a fonte', async () => {
  let resolveFetch;
  const pending = new Promise(resolve => { resolveFetch = resolve; });
  const h = await pagina({ page: 'produto', withoutAbort: true, fetchOverride: () => pending,
    afterDispatch: ({ document, context, timers }) => {
      assert.equal(context.armoireCatalogoEstado.fonte, 'carregando');
      assert.equal(document.getElementById('conteudoProduto').hidden, true);
      [...timers.values()].find(t => t.ms === 8000).fn();
    }
  });
  assert.equal(h.get('estadoProduto').hidden, true);
  assert.equal(h.get('avisoCatalogoProduto').hidden, false);
  resolveFetch({ ok: true, json: async () => [] });
  await new Promise(setImmediate);
  assert.equal(h.context.armoireCatalogoEstado.fonte, 'local');
  assert.ok(h.products['black-hat']);
});

test('scroll inicial e após rolagem aplica/remove classes e registra listeners uma vez', async () => {
  const h = await pagina({ page: 'home', beforeReady: ({ context }) => { context.scrollY = 100; } });
  assert.equal(h.get('header').classList.contains('header-scroll'), true);
  assert.equal(h.get('topbar').classList.contains('topbar-clara'), true);
  assert.equal(h.get('heroImg').style.transform, 'translateY(10px) scale(1.02)');
  const listeners = h.windowEvents.listeners.scroll.length;
  assert.equal(listeners, 2); // Um para header e um para o parallax existente.
  for (const y of [0, 71, 70, 200, 0]) {
    h.context.scrollY = y; h.context.dispatchEvent({ type: 'scroll' });
    assert.equal(h.get('header').classList.contains('header-scroll'), y > 70);
    assert.equal(h.get('topbar').classList.contains('topbar-clara'), y > 70);
    assert.equal(h.windowEvents.listeners.scroll.length, listeners);
  }
  vm.runInContext(read('js/home.js'), h.context);
  h.document.dispatchEvent({ type: 'DOMContentLoaded' });
  assert.equal(h.windowEvents.listeners.scroll.length, listeners);
});

test('navegação home → catálogo → detalhe → catálogo preserva destinos existentes', async () => {
  const homeLink = read('index.html').match(/href="(produtos.html\?categoria=calcas-bermudas)"/)[1];
  const catalog = await pagina({ page: 'catalogo', offline: true, search: new URL(homeLink, 'http://localhost').search });
  const card = catalog.get('grade').querySelectorAll('.catalogo-card').find(c => c.style.display !== 'none');
  const href = card.querySelector('a').href;
  const detailURL = new URL(href, 'http://localhost');
  arquivoComCaseExato(path.join(root, detailURL.pathname));
  const detail = await pagina({ page: 'produto', offline: true, search: detailURL.search });
  assert.equal(detail.get('conteudoProduto').hidden, false);
  assert.ok(read('produto.html').includes('<a href="produtos.html">Produtos</a>'));
  arquivoComCaseExato(path.join(root, 'produtos.html'));
});
