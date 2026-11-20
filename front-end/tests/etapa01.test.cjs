// Testes de regressão com DOM simulado. Não são testes de navegador nem de Supabase real.
// Executar: node --test front-end/tests/etapa01.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pagina, read, vm, fs, root } = require('./support/ambiente.cjs');
const path = require('node:path');

const itemLook = (id, tamanho = 'Único', quantidade = 1) => ({ produto_id: id, tamanho, quantidade, nome: id, preco: 89.99 });
function look(h, itens, tentativa = 1) {
  let result;
  const receive = e => { result = e.detail; };
  h.document.addEventListener('armoire:look-adicionado', receive);
  h.document.dispatchEvent(new h.context.CustomEvent('armoire:adicionar-look', { detail: { itens, tentativa } }));
  h.document.removeEventListener('armoire:look-adicionado', receive);
  return result;
}

test('IDs inválidos e quantidades inválidas não são persistidos', async () => {
  const h = await pagina();
  for (const id of [undefined, null, '', ' ', 'undefined', 'null', 'nao-existe', {}, false, NaN, 'toString', '__proto__']) {
    assert.equal(h.context.adicionarCarrinho(id), false);
  }
  for (const qty of [0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(h.context.adicionarCarrinho('black-hat', qty), false);
  }
  assert.deepEqual(h.cart(), []);
});

test('saneamento remove somente entradas inválidas, preservando dados e tamanhos válidos', async () => {
  const valid = { id: 'sueterp-frente', quantidade: 2, tamanho: 'M', produto: { nome: 'Minha peça', preco: 199 }, campoLegado: true };
  const h = await pagina({ saved: [null, { id: 'undefined', quantidade: 1 }, valid, { id: 'ausente', quantidade: 1 }, { id: 'black-hat', quantidade: 0 }] });
  assert.deepEqual(h.cart(), [valid]);
  assert.equal(h.get('contador').textContent, '2');
  assert.equal(h.get('totalCarrinho').textContent, h.money(h.products['sueterp-frente'].preco * 2));
  assert.match(h.get('toastCarrinho').textContent, /4 item/);
});

test('produto: um clique adiciona uma única unidade e nenhum ID undefined', async () => {
  const h = await pagina({ page: 'produto' });
  assert.equal(h.get('btnComprar').listeners.click.length, 1);
  h.get('btnComprar').click();
  assert.deepEqual(h.cart().map(({ id, tamanho, quantidade }) => ({ id, tamanho, quantidade })), [
    { id: 'black-hat', tamanho: 'Único', quantidade: 1 }
  ]);
  assert.equal(h.get('contador').textContent, '1');
  assert.equal(h.get('totalCarrinho').textContent, h.money(89.99));
});

test('produto: exige tamanho, separa M/G e acumula a mesma variação', async () => {
  const h = await pagina({ page: 'produto', id: 'sueterp-frente' });
  h.get('btnComprar').click();
  assert.deepEqual(h.cart(), []);
  const choose = size => h.get('tamanhosProduto').children.find(n => n.textContent === size).click();
  choose('M'); h.get('btnComprar').click(); h.get('btnComprar').click();
  choose('G'); h.get('btnComprar').click();
  assert.deepEqual(h.cart().map(({ tamanho, quantidade }) => [tamanho, quantidade]), [['M', 2], ['G', 1]]);
  h.context.removerProduto('sueterp-frente', 'M');
  assert.deepEqual(h.cart().map(i => i.tamanho), ['G']);
  assert.equal(h.get('contador').textContent, '1');
});

for (const page of ['produto', 'quick']) {
  test(`${page}: produto com apenas tamanho M mantém M`, async () => {
    const h = await pagina({ page, sizes: ['M'] });
    if (page === 'quick') h.context.abrirQuickShop('black-hat');
    h.get(page === 'produto' ? 'btnComprar' : 'quickShopAdicionar').click();
    assert.equal(h.cart()[0].tamanho, 'M');
  });
}

test('Quick Shop exige escolha e transmite M/G corretamente', async () => {
  const h = await pagina({ page: 'quick', id: 'sueterp-frente' });
  const open = () => h.context.abrirQuickShop('sueterp-frente');
  open(); h.get('quickShopAdicionar').click();
  assert.deepEqual(h.cart(), []);
  assert.equal(h.get('quickShopErro').classList.contains('mostrar'), true);
  const choose = size => h.get('quickShopTamanhos').children.find(n => n.textContent === size).click();
  choose('M'); h.get('quickShopAdicionar').click();
  open(); choose('G'); h.get('quickShopAdicionar').click();
  assert.deepEqual(h.cart().map(i => [i.tamanho, i.quantidade]), [['M', 1], ['G', 1]]);
});

for (const estoque of [0, 1, 20]) {
  test(`estoque ${estoque}: inclusão, repetição e incremento respeitam o limite`, async () => {
    const h = await pagina({ stock: estoque });
    if (estoque === 0) {
      assert.equal(h.context.adicionarCarrinho('black-hat'), false);
      assert.deepEqual(h.cart(), []);
      return;
    }
    assert.equal(h.context.adicionarCarrinho('black-hat', estoque), true);
    const original = h.storage.get('carrinho');
    assert.equal(h.context.adicionarCarrinho('black-hat'), false);
    h.context.aumentarQuantidade('black-hat', 'Único');
    assert.equal(h.storage.get('carrinho'), original);
    assert.equal(h.get('contador').textContent, String(estoque));
    assert.equal(h.get('totalCarrinho').textContent, h.money(89.99 * estoque));
  });
}

test('1000 black-hat são recusados e estoque é compartilhado entre tamanhos', async () => {
  const h = await pagina({ sizes: ['M', 'G'] });
  assert.equal(h.context.adicionarCarrinho('black-hat', 1000, 'M'), false);
  assert.equal(h.context.adicionarCarrinho('black-hat', 19, 'M'), true);
  assert.equal(h.context.adicionarCarrinho('black-hat', 2, 'G'), false);
  assert.equal(h.context.adicionarCarrinho('black-hat', 1, 'G'), true);
  assert.equal(h.cart().length, 2);
  assert.equal(h.get('contador').textContent, '20');
});

test('estoque desconhecido não impõe teto 99; estoque string zero impede compra', async () => {
  for (const stock of [null, '', ' ', NaN, Infinity, -1, [], {}]) {
    const h = await pagina({ stock });
    assert.equal(h.context.adicionarCarrinho('black-hat', 1000), true, `estoque ${stock}`);
    h.context.aumentarQuantidade('black-hat', 'Único');
    assert.equal(h.cart()[0].quantidade, 1001);
  }
  const h = await pagina({ stock: '0' });
  assert.equal(h.context.adicionarCarrinho('black-hat'), false);
});

test('decremento, remoção, contador e total concordam com localStorage e eventos', async () => {
  const h = await pagina();
  h.context.adicionarCarrinho('black-hat', 2);
  h.get('listaCarrinho').querySelector('.menos').click();
  assert.equal(h.cart()[0].quantidade, 1);
  assert.equal(h.get('totalCarrinho').textContent, h.money(89.99));
  h.get('listaCarrinho').querySelector('.mais').click();
  assert.equal(h.cart()[0].quantidade, 2);
  h.get('listaCarrinho').querySelector('.btn-remover').click();
  assert.deepEqual(h.cart(), []);
  assert.equal(h.get('contador').textContent, '0');
  assert.equal(h.get('totalCarrinho').textContent, h.money(0));
  assert.equal(h.events.at(-1).detail.quantidade, 0);
  h.context.adicionarCarrinho('black-hat');
  h.context.diminuirQuantidade('black-hat', 'Único');
  assert.deepEqual(h.cart(), []);
});

test('carrinho antigo acima do estoque permanece com aviso e permite reduzir', async () => {
  const saved = [{ id: 'black-hat', tamanho: 'Único', quantidade: 1000 }];
  const h = await pagina({ saved });
  assert.deepEqual(h.cart(), saved);
  assert.match(h.get('listaCarrinho').textContent, /quantidade salva foi preservada/);
  h.context.aumentarQuantidade('black-hat', 'Único');
  assert.equal(h.cart()[0].quantidade, 1000);
  h.context.diminuirQuantidade('black-hat', 'Único');
  assert.equal(h.cart()[0].quantidade, 999);
});

test('seletores do detalhe e Quick Shop consideram as unidades já salvas', async () => {
  for (const page of ['produto', 'quick']) {
    const h = await pagina({ page, saved: [{ id: 'black-hat', tamanho: 'Único', quantidade: 19 }] });
    if (page === 'quick') h.context.abrirQuickShop('black-hat');
    h.get(page === 'produto' ? 'aumentarQuantidade' : 'quickShopMais').click();
    assert.equal(h.get(page === 'produto' ? 'quantidadeProduto' : 'quickShopQuantidade').textContent, '1');
    h.get(page === 'produto' ? 'btnComprar' : 'quickShopAdicionar').click();
    assert.equal(h.cart()[0].quantidade, 20);
  }
});

test('Quick Shop permanece aberto ao recusar estoque zero', async () => {
  const h = await pagina({ page: 'quick', stock: 0 });
  h.context.abrirQuickShop('black-hat');
  h.get('quickShopMais').click();
  assert.equal(h.get('quickShopQuantidade').textContent, '1');
  h.get('quickShopAdicionar').click();
  assert.deepEqual(h.cart(), []);
  assert.equal(h.get('quickShopOverlay').classList.contains('ativo'), true);
  assert.match(h.get('toastCarrinho').textContent, /sem estoque/);
});

test('handlers de compra das outras páginas continuam ativos após DOM ready', async () => {
  let button;
  const h = await pagina({ beforeReady: ({ add }) => {
    button = add('outroComprar', 'btn-comprar', 'button');
    button.dataset.id = 'black-hat';
  } });
  button.click();
  assert.equal(h.cart()[0].quantidade, 1);
});

test('look: sucesso e falha são confirmados com tentativa; falha não adiciona parte do look', async () => {
  const h = await pagina();
  assert.equal(look(h, [itemLook('black-hat')], 7).tentativa, 7);
  assert.equal(h.cart()[0].quantidade, 1);
  const before = h.storage.get('carrinho');
  const result = look(h, [itemLook('armoire-hat'), itemLook('black-hat', 'Único', 20)], 8);
  assert.equal(result.sucesso, false);
  assert.equal(result.tentativa, 8);
  assert.equal(h.storage.get('carrinho'), before);
  // Também verifica a memória após rollback, não apenas o armazenamento.
  h.context.adicionarCarrinho('armoire-hat');
  assert.equal(h.cart().find(i => i.id === 'armoire-hat').quantidade, 1);
  for (const itens of [[null], [itemLook('inexistente')], [], undefined]) {
    assert.equal(look(h, itens).sucesso, false);
  }
});

test('saneamento aguarda catálogo remoto e preserva produto remoto válido', async () => {
  const saved = [{ id: 'remoto', tamanho: 'G', quantidade: 2 }];
  const h = await pagina({ saved, remote: [{ source_id: 'remoto', is_active: true, name: 'Peça remota', price: 10, stock: 3, sizes: ['G'] }] });
  assert.deepEqual(h.cart(), saved);
  assert.equal(h.get('totalCarrinho').textContent, h.money(20));
  assert.equal(h.context.adicionarCarrinho('remoto', 1, 'G'), true);
  assert.equal(h.context.adicionarCarrinho('remoto', 1, 'G'), false);
});

test('falha de rede preserva IDs pendentes, informa total a confirmar e bloqueia nova inclusão desconhecida', async () => {
  const saved = [{ id: 'remoto', tamanho: 'G', quantidade: 2 }];
  const h = await pagina({ saved, offline: true });
  assert.deepEqual(h.cart(), saved);
  assert.equal(h.get('contador').textContent, '2');
  assert.equal(h.get('totalCarrinho').textContent, 'A confirmar');
  assert.match(h.get('listaCarrinho').textContent, /foi preservada/);
  assert.equal(h.context.adicionarCarrinho('remoto', 1, 'G'), false);
  assert.equal(h.context.adicionarCarrinho('black-hat'), true);
});

test('My Armoire carrega catálogo antes do carrinho e o painel transmite tamanho e recebe confirmação', async () => {
  const html = read('my-armoire.html');
  assert.ok(html.indexOf('src="./js/produtos-data.js"') < html.indexOf('src="./js/armoire-supabase.js"'));
  assert.ok(html.indexOf('src="./js/armoire-supabase.js"') < html.indexOf('src="./js/carrinho.js"'));
  const h = await pagina({ page: 'my-armoire', remote: [{ source_id: 'remoto', is_active: true, name: 'Peça remota', price: 10, stock: 2, sizes: ['M', 'G'], images: [] }] });
  h.document.dispatchEvent(new h.context.CustomEvent('armoire:abrir-look', { detail: { ids: ['remoto'] } }));
  await new Promise(setImmediate);
  const wrapper = h.get('ma-cart-items').querySelector('.ma-size-wrapper');
  assert.ok(wrapper);
  wrapper.querySelectorAll('.ma-size-option').find(n => n.textContent === 'G').click();
  h.get('ma-cart-confirm').click();
  assert.equal(h.cart()[0].tamanho, 'G');
  assert.equal(h.cart()[0].id, 'remoto');
  assert.equal(h.cart()[0].quantidade, 1);
  assert.match(h.get('ma-toast').textContent, /Look adicionado/);
});

test('sintaxe de todos os JS e blocos inline das páginas alteradas', () => {
  for (const file of fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js'))) {
    new vm.Script(read(`js/${file}`), { filename: file });
  }
  for (const file of ['produtos.html', 'my-armoire.html']) {
    for (const [i, match] of [...read(file).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].entries()) {
      new vm.Script(match[1], { filename: `${file}:script-${i}` });
    }
  }
});
