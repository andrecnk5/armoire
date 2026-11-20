// Testes de regressão com DOM simulado. Não são testes de navegador nem de Supabase real.
// Executar: node --test front-end/tests/etapa01.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

class Elemento {
  constructor(tag = 'div') {
    this.tagName = tag;
    this.children = [];
    this.dataset = {};
    this.className = '';
    this.listeners = {};
    this.attributes = {};
    this.style = { setProperty() {} };
    this.classList = {
      contains: c => this.className.split(/\s+/).includes(c),
      add: (...cs) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...cs])].join(' '); },
      remove: (...cs) => { this.className = this.className.split(/\s+/).filter(c => !cs.includes(c)).join(' '); },
      toggle: (c, force) => {
        const add = force ?? !this.classList.contains(c);
        this.classList[add ? 'add' : 'remove'](c);
        return add;
      }
    };
  }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return (this.text || '') + this.children.map(n => n.textContent).join(''); }
  set innerHTML(value) { this.html = value; this.text = ''; this.children = []; }
  append(...nodes) { this.children.push(...nodes); nodes.forEach(n => { n.parent = this; }); }
  appendChild(node) { this.append(node); return node; }
  replaceChildren(...nodes) { this.children = []; this.text = ''; this.append(...nodes); }
  get firstElementChild() { return this.children[0] || null; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  removeAttribute(name) { delete this.attributes[name]; }
  focus() {}
  contains(node) { return this === node || this.children.some(c => c.contains(node)); }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  removeEventListener(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter(f => f !== fn); }
  dispatchEvent(event) {
    event.target ||= this;
    event.preventDefault ||= () => {};
    event.stopPropagation ||= () => {};
    for (const fn of [...(this.listeners[event.type] || [])]) {
      const result = fn(event);
      if (result?.then) (this.pending ||= []).push(result);
    }
    return true;
  }
  click() { if (!this.disabled) this.dispatchEvent({ type: 'click' }); }
  matches(selector) {
    const not = selector.match(/:not\(([^)]+)\)/);
    if (not && this.matches(not[1])) return false;
    selector = selector.replace(/:not\([^)]+\)/g, '');
    const id = selector.match(/#([\w-]+)/);
    if (id && this.id !== id[1]) return false;
    const tag = selector.match(/^[\w-]+/);
    if (tag && this.tagName !== tag[0]) return false;
    return [...selector.matchAll(/\.([\w-]+)/g)].every(m => this.classList.contains(m[1]));
  }
  querySelectorAll(selector) {
    const all = this.children.flatMap(c => [c, ...c.querySelectorAll('*')]);
    if (selector === '*') return all;
    return all.filter(n => selector.split(',').some(part => {
      const pieces = part.trim().split(/\s+/);
      if (!n.matches(pieces.pop())) return false;
      let ancestor = n.parent;
      while (pieces.length) {
        const expected = pieces.pop();
        while (ancestor && !ancestor.matches(expected)) ancestor = ancestor.parent;
        if (!ancestor) return false;
        ancestor = ancestor.parent;
      }
      return true;
    }));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}

async function pagina({ page = 'cart', id = 'black-hat', saved = [], stock, sizes, remote = [], offline = false, beforeReady } = {}) {
  const document = new Elemento('document');
  document.readyState = 'loading';
  document.head = new Elemento('head');
  document.body = new Elemento('body');
  document.append(document.head, document.body);
  document.createElement = tag => new Elemento(tag);
  document.getElementById = id => document.querySelector(`#${id}`);
  const add = (id, cls = '', tag = 'div') => {
    const node = new Elemento(tag);
    node.id = id;
    node.className = cls;
    document.body.append(node);
    return node;
  };
  if (page !== 'my-armoire') {
    ['carrinho', 'overlayCarrinho', 'abrirCarrinho', 'fecharCarrinho', 'listaCarrinho', 'totalCarrinho'].forEach(id => add(id));
    add('contador', 'contador-carrinho');
    add('toastCarrinho').append(new Elemento('span'));
  }
  if (page === 'produto') {
    ['tamanhosProduto', 'tamanhoSelecionado', 'quantidadeProduto', 'diminuirQuantidade', 'aumentarQuantidade'].forEach(id => add(id));
    add('btnComprar', 'btn-comprar', 'button');
  }
  if (page === 'quick') {
    ['quickShopOverlay', 'fecharQuickShop', 'quickShopImagem', 'quickShopMarca', 'quickShopNome', 'quickShopPreco', 'quickShopTamanhoSelecionado', 'quickShopTamanhoSecao', 'quickShopErro', 'quickShopQuantidade', 'quickShopMenos', 'quickShopMais', 'quickShopAdicionar', 'quickShopVerProduto'].forEach(id => add(id));
    add('quickShopTamanhos', 'quick-shop-tamanhos');
  }
  if (page === 'my-armoire') {
    ['ma-cart-overlay', 'ma-cart-drawer', 'ma-cart-items', 'ma-cart-total', 'ma-cart-error', 'ma-cart-confirm', 'ma-cart-close'].forEach(id => add(id));
  }
  const storage = new Map([['carrinho', JSON.stringify(saved)]]);
  const events = [];
  const context = vm.createContext({
    document, URLSearchParams, console: { log() {}, warn() {}, error() {}, table() {} },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    location: { search: `?id=${id}` },
    CustomEvent: class { constructor(type, opts = {}) { this.type = type; this.detail = opts.detail; } },
    setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame: fn => fn(),
    alert: message => { throw new Error('Alerta inesperado: ' + message); },
    dispatchEvent: event => { events.push(event); return true; },
    fetch: async () => {
      if (offline) throw new Error('Rede indisponível (simulada)');
      return { ok: true, json: async () => remote };
    }
  });
  context.window = context;
  const run = file => vm.runInContext(read(file), context, { filename: file });
  run('js/produtos-data.js');
  const products = vm.runInContext('produtos', context);
  if (stock !== undefined) products[id].estoque = stock;
  if (sizes !== undefined) products[id].tamanhos = sizes;
  run('js/armoire-supabase.js');
  run('js/carrinho.js');
  if (page === 'produto') run('js/produto.js');
  if (page === 'quick') {
    const inline = [...read('produtos.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
      .map(m => m[1]).find(s => s.includes('function selecionarTamanho'));
    vm.runInContext(inline, context, { filename: 'produtos.html:quick-shop' });
  }
  if (page === 'my-armoire') {
    // Somente respostas de leitura simuladas; nenhuma conexão externa.
    context.armoireSupabase = { from: () => ({
      select() { return this; }, in() { return this; },
      eq: async () => ({ data: remote, error: null })
    }) };
    context.supabase = { createClient: () => context.armoireSupabase };
    run('js/my-armoire-cart.js');
  }
  if (beforeReady) beforeReady({ context, document, add });
  document.readyState = 'interactive';
  document.dispatchEvent({ type: 'DOMContentLoaded' });
  await Promise.all(document.pending || []);
  return {
    context, document, products, storage, events, add,
    get: id => document.getElementById(id),
    cart: () => JSON.parse(storage.get('carrinho')),
    money: value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  };
}

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
  const h = await pagina({ saved, remote: [{ source_id: 'remoto', name: 'Peça remota', price: 10, stock: 3, sizes: ['G'] }] });
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
  const h = await pagina({ page: 'my-armoire', remote: [{ source_id: 'remoto', name: 'Peça remota', price: 10, stock: 2, sizes: ['M', 'G'], images: [] }] });
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
