// Testes de regressão com DOM simulado. Não são testes de navegador nem de Supabase real.
// Executar: node --test front-end/tests/etapa01.test.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..', '..');
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
  append(...nodes) {
    nodes.forEach(n => {
      if (n.parent) n.parent.children = n.parent.children.filter(c => c !== n);
      this.children.push(n); n.parent = this;
    });
  }
  insertBefore(node, reference) {
    if (node.parent) node.parent.children = node.parent.children.filter(c => c !== node);
    this.children.splice(this.children.indexOf(reference), 0, node); node.parent = this;
  }
  appendChild(node) { this.append(node); return node; }
  replaceChildren(...nodes) { this.children = []; this.text = ''; this.append(...nodes); }
  get firstElementChild() { return this.children[0] || null; }
  get parentNode() { return this.parent; }
  closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector) || null; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? this[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; delete this[name]; }
  get tabIndex() {
    if (this.attributes.tabindex != null) return Number(this.attributes.tabindex);
    return ['button', 'input', 'select', 'textarea'].includes(this.tagName) ||
      (this.tagName === 'a' && this.href) ? 0 : -1;
  }
  get isConnected() { let n = this; while (n.parent) n = n.parent; return n.tagName === 'document'; }
  hasAttribute(name) { return Object.hasOwn(this.attributes, name); }
  getClientRects() { return this.isConnected && !this.closest('[inert], [hidden]') ? [{}] : []; }
  focus() {
    if (this.closest('[inert], [hidden]')) return;
    let doc = this; while (doc.parent) doc = doc.parent;
    if (doc.tagName === 'document') {
      doc.activeElement = this;
      doc.dispatchEvent({ type: 'focusin', target: this });
    }
  }
  reset() {}
  insertAdjacentHTML(_, markup) {
    const stack = [this];
    const voids = new Set(['input', 'img', 'br', 'meta', 'link', 'hr']);
    const clean = markup.replace(/<!--[\s\S]*?-->/g, '');
    for (const token of clean.match(/<[^>]+>|[^<]+/g) || []) {
      if (token.startsWith('</')) { stack.pop(); continue; }
      if (token.startsWith('<')) {
        const tag = token.match(/^<([\w-]+)/)?.[1];
        if (!tag) continue;
        const el = new Elemento(tag);
        for (const match of token.slice(tag.length + 1, -1).matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
          const name = match[1], value = match[2] ?? match[3] ?? match[4] ?? '';
          el.setAttribute(name, value);
          if (name === 'class') el.className = value;
          else if (name.startsWith('data-')) el.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
          else el[name] = ['hidden', 'inert', 'disabled', 'required'].includes(name) ? true : value;
        }
        stack.at(-1).append(el);
        if (!voids.has(tag)) stack.push(el);
      } else if (token.trim()) stack.at(-1).text = (stack.at(-1).text || '') + token.trim();
    }
  }
  contains(node) { return this === node || this.children.some(c => c.contains(node)); }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  removeEventListener(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter(f => f !== fn); }
  dispatchEvent(event) {
    event.target ||= this;
    event.preventDefault ||= () => {};
    event.stopPropagation ||= () => {};
    const originalPrevent = event.preventDefault;
    event.preventDefault = () => { event.defaultPrevented = true; originalPrevent(); };
    event.stopImmediatePropagation ||= () => { event.immediateStopped = true; };
    for (const fn of [...(this.listeners[event.type] || [])]) {
      if (event.immediateStopped) break;
      const result = fn(event);
      if (result?.then) (this.pending ||= []).push(result);
    }
    return true;
  }
  click() { if (!this.disabled) this.dispatchEvent({ type: 'click' }); }
  matches(selector) {
    if (selector.includes(',')) return selector.split(',').some(s => this.matches(s.trim()));
    const not = selector.match(/:not\(([^)]+)\)/);
    if (not && this.matches(not[1])) return false;
    selector = selector.replace(/:not\([^)]+\)/g, '');
    for (const match of selector.matchAll(/\[([\w-]+)(?:=["']?([^\]"']*)["']?)?\]/g)) {
      const name = match[1];
      const value = ['inert', 'hidden', 'disabled'].includes(name) ? (this[name] ? '' : null) : name.startsWith('data-')
        ? this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())]
        : this[name] ?? this.attributes[name];
      if (value == null || (match[2] != null && String(value) !== match[2])) return false;
    }
    selector = selector.replace(/\[[^\]]*\]/g, '');
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

async function pagina({ page = 'cart', id = 'black-hat', saved = [], stock, sizes, remote, offline = false, slow = false, malformed = false, beforeReady, afterDispatch, fetchOverride, favorites = false, search, withoutAbort = false, authSession = null, serviceClient, sdkUnavailable = false } = {}) {
  const document = new Elemento('document');
  document.readyState = 'loading';
  document.head = new Elemento('head');
  document.body = new Elemento('body');
  document.append(document.head, document.body);
  document.activeElement = document.body;
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
    const panel = document.getElementById('carrinho'); panel.inert = true;
    const closeCart = document.getElementById('fecharCarrinho'); closeCart.tagName = 'button';
    panel.append(closeCart, document.getElementById('listaCarrinho'));
    add('contador', 'contador-carrinho');
    add('toastCarrinho').append(new Elemento('span'));
  }
  if (page === 'produto') {
    ['tamanhosProduto', 'tamanhoSelecionado', 'quantidadeProduto', 'diminuirQuantidade', 'aumentarQuantidade', 'miniaturas', 'imagemPrincipal', 'estadoImagem', 'estadoProduto', 'tituloEstadoProduto', 'descricaoEstadoProduto', 'avisoCatalogoProduto'].forEach(id => add(id));
    add('conteudoProduto', 'produto-container').hidden = true;
    add('relacionados', 'produtos-relacionados').hidden = true;
    add('btnComprar', 'btn-comprar', 'button');
  }
  if (page === 'quick') {
    ['quickShopOverlay', 'fecharQuickShop', 'quickShopImagem', 'quickShopMarca', 'quickShopNome', 'quickShopPreco', 'quickShopTamanhoSelecionado', 'quickShopTamanhoSecao', 'quickShopErro', 'quickShopQuantidade', 'quickShopMenos', 'quickShopMais', 'quickShopAdicionar', 'quickShopVerProduto'].forEach(id => add(id));
    add('quickShopTamanhos', 'quick-shop-tamanhos');
    const quick = document.getElementById('quickShopOverlay'); quick.inert = true;
    for (const id of ['fecharQuickShop', 'quickShopAdicionar', 'quickShopMenos', 'quickShopMais']) {
      const node = document.getElementById(id); node.tagName = 'button'; quick.append(node);
    }
    quick.append(document.getElementById('quickShopTamanhos'));
  }
  if (page === 'my-armoire') {
    ['ma-cart-overlay', 'ma-cart-drawer', 'ma-cart-items', 'ma-cart-total', 'ma-cart-error', 'ma-cart-confirm', 'ma-cart-close'].forEach(id => add(id));
  }
  if (page === 'catalogo') {
    add('grade', 'grade-produtos');
    ['contadorProdutos', 'nenhumResultado', 'estadoCatalogo', 'limparFiltros', 'limparFiltrosResultado'].forEach(id => add(id));
    for (const value of ['camisetas', 'polos', 'camisas', 'baby tee', 'agasalhos', 'calcas', 'bermudas', 'acessorios']) {
      add('cat-' + value, 'filtro-categoria', 'input').value = value;
    }
    for (const value of ['M', 'G']) add('size-' + value, 'filtro-tamanho', 'input').value = value;
    add('cor-preto', 'filtro-cor', 'button').dataset.cor = 'Preto';
  }
  if (page === 'home') {
    add('header', 'header-home'); add('topbar', 'top-bar');
    add('hero', 'hero-imagem').append(add('heroImg', '', 'img'));
  }
  if (page === 'auth') {
    const button = add('conta', 'botao-conta', 'button');
    const icon = new Elemento('i'); icon.className = 'fa-user'; button.append(icon);
  }
  const windowEvents = new Elemento('window');
  const timers = new Map();
  let timerId = 0;
  const storage = new Map([['carrinho', JSON.stringify(saved)]]);
  const events = [];
  const context = vm.createContext({
    document, URLSearchParams, URL, AbortController,
    IntersectionObserver: class { observe() {} unobserve() {} },
    scrollY: 0, innerHeight: 900,
    getComputedStyle: el => ({ display: el.style.display || 'block', visibility: el.style.visibility || 'visible' }),
    addEventListener: (...args) => windowEvents.addEventListener(...args),
    console: { log() {}, warn() {}, error() {}, table() {}, info() {} },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    location: { search: search ?? `?id=${id}`, href: 'http://localhost/produtos.html' + (search ?? `?id=${id}`) },
    history: { replaceState: (_, __, url) => { context.location.href = String(url); context.location.search = new URL(url).search; } },
    CustomEvent: class { constructor(type, opts = {}) { this.type = type; this.detail = opts.detail; } },
    setTimeout: (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; },
    clearTimeout: id => timers.delete(id), requestAnimationFrame: fn => fn(),
    alert: message => { throw new Error('Alerta inesperado: ' + message); },
    dispatchEvent: event => { events.push(event); return windowEvents.dispatchEvent(event); },
    fetch: fetchOverride || (async () => {
      if (offline) throw new Error('Rede indisponível (simulada)');
      if (slow) return new Promise(() => {});
      return { ok: true, json: async () => malformed ? {} : response };
    })
  });
  context.window = context;
  const run = file => vm.runInContext(read(file), context, { filename: file });
  run('js/acessibilidade.js');
  run('js/armoire-client.js');
  run('js/produtos-data.js');
  const products = vm.runInContext('produtos', context);
  if (stock !== undefined) products[id].estoque = stock;
  if (sizes !== undefined) products[id].tamanhos = sizes;
  const response = remote ?? Object.values(products).map(p => ({
    source_id: p.id, name: p.nome, price: p.preco, category: p.categoria,
    stock: p.estoque, sizes: p.tamanhos, images: p.imagens, colors: p.cores,
    is_active: true
  }));
  if (withoutAbort) context.AbortController = undefined;
  run('js/armoire-supabase.js');
  run('js/carrinho.js');
  if (page === 'catalogo') {
    run('js/catalogo.js');
    if (favorites) {
      context.supabase = { createClient: () => ({
        auth: { getUser: async () => ({ data: { user: { id: 'teste' } } }), onAuthStateChange() {} },
        from: () => ({
          select() { return this; }, eq() { return this; }, delete() { return this; },
          upsert: async () => ({ error: null }),
          then: resolve => resolve({ data: [], error: null })
        })
      }) };
      run('js/armoire-favoritos.js');
    }
  }
  if (page === 'auth') {
    if (!sdkUnavailable) context.supabase = { createClient: () => serviceClient || ({ auth: {
      getSession: async () => ({ data: { session: authSession } }), onAuthStateChange() {}
    } }) };
    run('js/armoire-auth-ui.js');
  }
  if (page === 'home') run('js/home.js');
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
  if (beforeReady) beforeReady({ context, document, add, timers });
  document.readyState = 'interactive';
  document.dispatchEvent({ type: 'DOMContentLoaded' });
  if (afterDispatch) afterDispatch({ context, document, timers });
  await Promise.all(document.pending || []);
  return {
    context, document, products, storage, events, add, timers, windowEvents,
    get: id => document.getElementById(id),
    cart: () => JSON.parse(storage.get('carrinho')),
    money: value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  };
}

module.exports = { pagina, Elemento, read, vm, fs, root };
