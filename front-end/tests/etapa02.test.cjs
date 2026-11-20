// DOM e rede simulados; não substituem validação em navegador/Supabase real.
// Executar: node front-end/tests/etapa02.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pagina, read, vm } = require('./support/ambiente.cjs');
const remoteProduct = (id, category = 'Acessórios', extra = {}) => ({
  source_id: id, name: `Produto ${id}`, price: 10, stock: 20,
  sizes: ['M', 'G'], images: ['images/black-hat.png'], colors: ['Preto'],
  category, is_active: true, ...extra
});
const cards = h => h.get('grade').querySelectorAll('.catalogo-card');
const visible = h => cards(h).filter(c => c.style.display !== 'none');
const change = (h, id, checked = true) => {
  const node = h.get(id); node.checked = checked; node.dispatchEvent({ type: 'change' });
};
const notify = h => h.document.dispatchEvent(new h.context.CustomEvent('armoire:catalogo-atualizado'));

test('quatro links da home selecionam grupos corretos; sem inventar acervo ausente', async () => {
  const links = [...read('index.html').matchAll(/href="(produtos.html\?categoria=[^"]+)"/g)].map(m => m[1]);
  assert.equal(links.length, 4);
  const expected = [['camisetas', 'polos'], ['camisas'], ['calcas', 'bermudas'], ['acessorios']];
  for (const [i, link] of links.entries()) {
    const h = await pagina({ page: 'catalogo', offline: true, search: new URL(link, 'http://localhost').search });
    assert.deepEqual(h.document.querySelectorAll('.filtro-categoria').filter(c => c.checked).map(c => c.value), expected[i]);
    if (i < 2) {
      assert.equal(visible(h).length, 0);
      assert.equal(h.get('nenhumResultado').style.display, 'flex');
    } else assert.ok(visible(h).length > 0);
  }
});

test('URLs antigas com categorias repetidas permanecem compatíveis', async () => {
  const h = await pagina({ page: 'catalogo', offline: true, search: '?categoria=calcas&categoria=bermudas' });
  assert.equal(h.get('cat-calcas').checked, true);
  assert.equal(h.get('cat-bermudas').checked, true);
  assert.equal(visible(h).length, 2);
});

test('remoto válido substitui locais: cria novo, atualiza preço e exclui ausentes/inativos', async () => {
  const h = await pagina({ page: 'catalogo', remote: [
    remoteProduct('novo', 'Camisas'), remoteProduct('black-hat', 'Bonés', { price: 42, stock: 1 }),
    remoteProduct('inativo', 'Camisas', { is_active: false })
  ] });
  assert.deepEqual(Object.keys(h.products).sort(), ['black-hat', 'novo']);
  assert.deepEqual(cards(h).map(c => c.dataset.produtoId).sort(), ['black-hat', 'novo']);
  const card = cards(h).find(c => c.dataset.produtoId === 'black-hat');
  assert.equal(card.querySelector('.preco').textContent, h.money(42));
  assert.equal(h.get('contadorProdutos').textContent, '2 produtos encontrados');
  change(h, 'cat-camisas');
  assert.deepEqual(visible(h).map(c => c.dataset.produtoId), ['novo']);
  assert.equal(h.context.adicionarCarrinho('black-hat', 1, 'M'), true);
  assert.equal(h.get('totalCarrinho').textContent, h.money(42));
  assert.equal(h.context.adicionarCarrinho('black-hat', 1, 'G'), false);
});

test('resposta remota vazia é coleção vazia, não fallback local', async () => {
  const h = await pagina({ page: 'catalogo', remote: [] });
  assert.equal(h.context.armoireCatalogoEstado.fonte, 'remoto');
  assert.deepEqual(Object.keys(h.products), []);
  assert.equal(cards(h).length, 0);
  assert.equal(h.get('nenhumResultado').style.display, 'flex');
  assert.equal(h.get('contadorProdutos').textContent, '0 produtos encontrados');
  assert.equal(h.context.adicionarCarrinho('black-hat'), false);
});

test('apenas is_active true entra no catálogo; zero de estoque continua zero', async () => {
  const h = await pagina({ page: 'catalogo', remote: [
    remoteProduct('ativo', 'Camisas', { stock: 0 }), remoteProduct('inativo', 'Camisas', { is_active: false }),
    remoteProduct('sem-flag', 'Camisas', { is_active: null })
  ] });
  assert.deepEqual(Object.keys(h.products), ['ativo']);
  assert.equal(h.products.ativo.estoque, 0);
  assert.equal(h.context.adicionarCarrinho('ativo', 1, 'M'), false);
});

test('queda de rede restaura catálogo local sem preços ou estoque inventados', async () => {
  const h = await pagina({ page: 'catalogo', offline: true });
  assert.equal(h.context.armoireCatalogoEstado.fonte, 'local');
  assert.equal(cards(h).length, Object.keys(h.products).length);
  assert.equal(h.products['black-hat'].preco, 89.99);
  assert.equal(h.products['black-hat'].estoque, 20);
  assert.match(h.get('estadoCatalogo').textContent, /catálogo local/);
});

test('rede lenta cai em fallback e finaliza carregamento em 8 segundos (timer simulado)', async () => {
  const h = await pagina({ page: 'catalogo', slow: true, beforeReady: ({ timers }) => {
    const timeout = [...timers.values()].find(t => t.ms === 8000);
    assert.ok(timeout); timeout.fn();
  } });
  assert.equal(h.context.armoireCatalogoEstado.fonte, 'local');
  assert.ok(cards(h).length > 0);
  assert.equal(h.timers.size, 0);
});

test('resposta malformada, IDs repetidos e preço inválido não publicam catálogo parcial', async () => {
  for (const options of [
    { malformed: true },
    { remote: [remoteProduct('novo'), remoteProduct('novo')] },
    { remote: [remoteProduct('novo'), remoteProduct('ruim', 'Camisas', { price: null })] }
  ]) {
    const h = await pagina({ page: 'catalogo', ...options });
    assert.equal(h.context.armoireCatalogoEstado.fonte, 'local');
    assert.equal(h.products.novo, undefined);
    assert.ok(h.products['black-hat']);
  }
});

test('favorito ativo acompanha o card inteiro ao aplicar filtros sem duplicar corações', async () => {
  const h = await pagina({ page: 'catalogo', favorites: true, remote: [
    remoteProduct('camisa', 'Camisas'), remoteProduct('calca', 'Calça')
  ] });
  await new Promise(setImmediate);
  const camisa = cards(h).find(c => c.dataset.produtoId === 'camisa');
  const heart = camisa.querySelector('.ac-favorito-botao');
  assert.ok(heart); heart.click();
  await new Promise(setImmediate);
  assert.equal(heart.classList.contains('ativo'), true);
  change(h, 'cat-calcas');
  assert.equal(camisa.style.display, 'none');
  assert.equal(heart.closest('.catalogo-card'), camisa);
  h.get('limparFiltros').click();
  assert.equal(camisa.style.display, '');
  assert.equal(heart.classList.contains('ativo'), true);
  for (let i = 0; i < 3; i++) notify(h);
  assert.equal(camisa.querySelectorAll('.ac-favorito-botao').length, 1);
  assert.equal(h.get('cat-calcas').listeners.change.length, 1);
  let buys = 0; h.context.abrirQuickShop = () => buys++;
  camisa.querySelector('.produto button').click();
  assert.equal(buys, 1);
});

test('filtros de categoria/tamanho/cor combinam e limpar remove só categoria da URL', async () => {
  const h = await pagina({ page: 'catalogo', search: '?categoria=camisas&teste=1', remote: [
    remoteProduct('camisa', 'Camisas'), remoteProduct('calca', 'Calças', { colors: ['Branco'], sizes: ['M'] })
  ] });
  change(h, 'size-G'); h.get('cor-preto').click();
  assert.deepEqual(visible(h).map(c => c.dataset.produtoId), ['camisa']);
  h.get('limparFiltrosResultado').click();
  assert.equal(visible(h).length, 2);
  assert.equal(h.context.location.search, '?teste=1');
});

test('carrinho preserva produto removido/inativo, mas impede nova inclusão', async () => {
  const saved = [{ id: 'black-hat', tamanho: 'Único', quantidade: 2 }];
  const h = await pagina({ page: 'catalogo', saved, remote: [remoteProduct('black-hat', 'Bonés', { is_active: false })] });
  assert.deepEqual(h.cart(), saved);
  assert.match(h.get('listaCarrinho').textContent, /não está disponível/);
  assert.equal(h.get('contador').textContent, '2');
  assert.equal(h.get('totalCarrinho').textContent, 'A confirmar');
  assert.equal(h.context.adicionarCarrinho('black-hat'), false);
  h.context.removerProduto('black-hat', 'Único');
  assert.deepEqual(h.cart(), []);
});

test('sincronização posterior atualiza cards e carrinho mantendo filtros e variantes', async () => {
  const h = await pagina({ page: 'catalogo', remote: [remoteProduct('camisa', 'Camisas')] });
  h.context.adicionarCarrinho('camisa', 1, 'M');
  change(h, 'cat-camisas');
  h.products.camisa.preco = 35;
  h.products.calca = { ...h.products.camisa, id: 'calca', nome: 'Calça', tipo: 'calcas' };
  h.context.armoireCatalogoEstado.versao++;
  notify(h);
  assert.equal(cards(h).length, 2);
  assert.equal(visible(h).length, 1);
  assert.equal(h.get('totalCarrinho').textContent, h.money(35));
  assert.equal(h.cart()[0].tamanho, 'M');
  assert.equal(h.cart()[0].quantidade, 1);
});

test('detalhe usa preço remoto, sem ressuscitar produto ausente no catálogo remoto', async () => {
  const h = await pagina({ page: 'produto', id: 'black-hat', remote: [remoteProduct('black-hat', 'Bonés', { price: 30, sizes: ['Único'] })] });
  h.get('btnComprar').click();
  assert.equal(h.get('totalCarrinho').textContent, h.money(30));
  const missing = await pagina({ page: 'produto', id: 'black-hat', remote: [] });
  missing.get('btnComprar').click();
  assert.deepEqual(missing.cart(), []);
});

test('sintaxe dos blocos inline alterados e fonte única de filtros no HTML', () => {
  for (const file of ['index.html', 'produtos.html']) {
    for (const match of read(file).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) new vm.Script(match[1]);
  }
  const html = read('produtos.html');
  assert.equal((html.match(/src="js\/catalogo.js"/g) || []).length, 1);
  assert.equal(html.includes('function aplicarFiltros'), false);
  assert.ok(html.includes('value="camisas"'));
});

test('carregamento pendente não exibe cards/preços antigos e publica o remoto ao resolver', async () => {
  let resolveFetch;
  const pending = new Promise(resolve => { resolveFetch = resolve; });
  const h = await pagina({ page: 'catalogo', fetchOverride: () => pending,
    afterDispatch: ({ context, document }) => {
      assert.equal(context.armoireCatalogoEstado.fonte, 'carregando');
      assert.equal(document.getElementById('grade').children.length, 0);
      assert.equal(document.getElementById('contadorProdutos').textContent, 'Carregando produtos...');
      resolveFetch({ ok: true, json: async () => [remoteProduct('chegou', 'Camisas')] });
    }
  });
  assert.deepEqual(cards(h).map(c => c.dataset.produtoId), ['chegou']);
});

test('nova renderização preserva favorito e destaques indisponíveis ficam ocultos por inteiro', async () => {
  let destaque;
  const h = await pagina({ page: 'catalogo', favorites: true, remote: [remoteProduct('camisa', 'Camisas')],
    beforeReady: ({ add }) => {
      const section = add('destacados', 'mais-vendidos');
      destaque = add('destaque', 'produto-mini', 'a');
      destaque.href = 'produto.html?id=black-hat';
      section.append(destaque);
    }
  });
  await new Promise(setImmediate);
  assert.equal((destaque.closest('.ac-favorito-card') || destaque).style.display, 'none');
  const heart = cards(h)[0].querySelector('.ac-favorito-botao');
  heart.click(); await new Promise(setImmediate);
  h.products.camisa.preco = 15; h.context.armoireCatalogoEstado.versao++; notify(h);
  const newHeart = cards(h)[0].querySelector('.ac-favorito-botao');
  assert.notEqual(newHeart, heart);
  assert.equal(newHeart.classList.contains('ativo'), true);
  assert.equal(h.get('grade').querySelectorAll('.ac-favorito-botao').length, 1);
});
