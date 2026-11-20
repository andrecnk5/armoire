// DOM simulado: não comprova layout, teclado nativo ou overflow em navegador real.
// Executar: node front-end/tests/etapa04.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pagina, read, vm } = require('./support/ambiente.cjs');

function key(h, key, shiftKey = false) {
  const event = { type: 'keydown', key, shiftKey };
  h.document.dispatchEvent(event);
  return event;
}

test('carrinho contém Tab/Shift+Tab, foca o fechamento e devolve foco ao abrir pelo cabeçalho', async () => {
  const h = await pagina();
  h.context.adicionarCarrinho('black-hat');
  const open = h.get('abrirCarrinho'); open.tagName = 'button'; open.focus(); open.click();
  const panel = h.get('carrinho');
  const close = h.get('fecharCarrinho');
  assert.equal(h.document.activeElement, close);
  assert.equal(panel.getAttribute('role'), 'dialog');
  assert.equal(panel.getAttribute('aria-hidden'), 'false');
  assert.equal(open.inert, true);
  assert.equal(h.document.body.classList.contains('armoire-dialogo-aberto'), true);
  const last = panel.querySelector('.btn-remover');
  assert.equal(key(h, 'Tab', true).defaultPrevented, true);
  assert.equal(h.document.activeElement, last);
  key(h, 'Tab');
  assert.equal(h.document.activeElement, close);
  assert.equal(key(h, 'Tab').defaultPrevented, undefined); // Tab intermediário é nativo.
  key(h, 'Escape');
  assert.equal(panel.inert, true);
  assert.equal(h.document.activeElement, open);
  assert.equal(h.document.body.classList.contains('armoire-dialogo-aberto'), false);
  assert.equal(open.getAttribute('aria-expanded'), 'false');
});

test('Quick Shop opera pelo fechamento e Escape, preservando o foco do acionador', async () => {
  const h = await pagina({ page: 'quick' });
  const trigger = h.add('comprar', '', 'button'); trigger.focus();
  h.context.abrirQuickShop('black-hat');
  assert.equal(h.get('quickShopOverlay').inert, false);
  assert.equal(h.document.activeElement, h.get('fecharQuickShop'));
  key(h, 'Escape');
  assert.equal(h.get('quickShopOverlay').classList.contains('ativo'), false);
  assert.equal(h.get('quickShopOverlay').inert, true);
  assert.equal(h.document.activeElement, trigger);
  h.context.abrirQuickShop('black-hat');
  h.get('fecharQuickShop').click();
  assert.equal(h.document.activeElement, trigger);
});

test('alterar quantidade pelo teclado mantém foco no controle recriado do mesmo item', async () => {
  const h = await pagina();
  h.context.adicionarCarrinho('black-hat');
  h.get('abrirCarrinho').click();
  const lista = h.get('listaCarrinho');
  const mais = lista.querySelector('.mais'); mais.focus(); mais.click();
  assert.equal(h.cart()[0].quantidade, 2);
  assert.notEqual(lista.querySelector('.mais'), mais);
  assert.equal(h.document.activeElement, lista.querySelector('.mais'));
  const menos = lista.querySelector('.menos'); menos.focus(); menos.click();
  assert.equal(h.cart()[0].quantidade, 1);
  assert.equal(h.document.activeElement, lista.querySelector('.menos'));
});

test('remover item com foco avança ao item restante e ao fechamento quando esvazia', async () => {
  const h = await pagina();
  h.context.adicionarCarrinho('black-hat');
  h.context.adicionarCarrinho('fleece-frente', 1, 'M');
  assert.equal(h.cart().length, 2);
  h.get('abrirCarrinho').click();
  const lista = h.get('listaCarrinho');
  const remover = lista.querySelector('.btn-remover'); remover.focus(); remover.click();
  assert.equal(h.cart().length, 1);
  assert.equal(h.document.activeElement, lista.querySelector('.btn-remover'));
  h.document.activeElement.click();
  assert.equal(h.cart().length, 0);
  assert.equal(h.document.activeElement, h.get('fecharCarrinho'));
});

test('compra pelo Quick Shop mantém o carrinho e encerra o painel com foco devolvido', async () => {
  const h = await pagina({ page: 'quick' });
  const trigger = h.add('comprar', '', 'button'); trigger.focus();
  h.context.abrirQuickShop('black-hat'); h.get('quickShopAdicionar').click();
  assert.equal(h.cart()[0].quantidade, 1);
  assert.equal(h.document.activeElement, trigger);
  assert.equal(h.get('quickShopOverlay').inert, true);
});

test('conta usa um único handler no botão nativo e login recebe foco no e-mail', async () => {
  const h = await pagina({ page: 'auth' });
  await new Promise(setImmediate);
  const trigger = h.get('conta'); trigger.focus(); trigger.click();
  assert.equal(trigger.listeners.click.length, 1);
  assert.equal(trigger.listeners.keydown, undefined); // Enter/Espaço pertencem ao botão nativo.
  assert.equal(h.document.activeElement, h.get('ac-email'));
  assert.equal(h.get('ac-modal').inert, false);
  assert.equal(h.get('ac-drawer').inert, true);
  assert.equal(trigger.inert, true);
  const close = h.get('ac-modal').querySelector('[data-ac-close]');
  close.focus(); key(h, 'Tab', true);
  assert.equal(h.document.activeElement, h.get('ac-switch'));
  key(h, 'Tab'); assert.equal(h.document.activeElement, close);
  key(h, 'Escape');
  assert.equal(h.document.activeElement, trigger);
  assert.equal(h.get('ac-modal').inert, true);
  assert.equal(h.document.body.classList.contains('armoire-dialogo-aberto'), false);
});

test('conta autenticada abre o drawer e fecha sem mudar a sessão', async () => {
  const session = { user: { id: 'usuario', email: 'teste@example.invalid', user_metadata: { name: 'Teste' } } };
  const h = await pagina({ page: 'auth', authSession: session });
  await new Promise(setImmediate);
  h.get('conta').focus(); h.get('conta').click();
  assert.equal(h.get('ac-drawer').classList.contains('open'), true);
  assert.equal(h.get('ac-drawer').getAttribute('role'), 'dialog');
  key(h, 'Escape');
  assert.equal(h.get('ac-drawer').inert, true);
  assert.equal(h.document.activeElement, h.get('conta'));
});

test('modais empilhados restauram o painel anterior e os estados inert preexistentes', async () => {
  const h = await pagina();
  const original = h.add('inativo'); original.inert = true;
  const trigger = h.add('origem', '', 'button'); trigger.focus();
  const parent = h.add('pai'); parent.inert = true;
  const child = h.add('filho'); child.inert = true;
  const first = h.add('primeiro', '', 'button'); parent.append(first);
  const second = h.add('segundo', '', 'button'); child.append(second);
  h.context.armoireDialogos.abrir(parent, { fechar: () => h.context.armoireDialogos.fechar(parent) });
  h.context.armoireDialogos.abrir(child, { fechar: () => h.context.armoireDialogos.fechar(child) });
  assert.equal(parent.inert, true);
  assert.equal(h.document.activeElement, second);
  key(h, 'Escape');
  assert.equal(parent.inert, false);
  assert.equal(h.document.activeElement, first);
  assert.equal(original.inert, true);
  key(h, 'Escape');
  assert.equal(h.document.activeElement, trigger);
  assert.equal(original.inert, true);
});

test('Escape delegado preserva seletores internos e guarda de operações existentes', async () => {
  const h = await pagina();
  const dialog = h.add('painel');
  const button = h.add('interno', '', 'button'); dialog.append(button);
  let closes = 0;
  h.context.armoireDialogos.abrir(dialog, { escape: false, fechar: () => closes++ });
  assert.equal(key(h, 'Escape').defaultPrevented, undefined);
  assert.equal(closes, 0);
  assert.equal(h.document.activeElement, button);
  h.context.armoireDialogos.fechar(dialog);
});

test('abertura repetida não duplica pilha; painel sem controles recebe foco e contém Tab', async () => {
  const h = await pagina();
  const trigger = h.add('origem', '', 'button'); trigger.focus();
  const panel = h.add('vazio');
  h.context.armoireDialogos.abrir(panel);
  h.context.armoireDialogos.abrir(panel);
  assert.equal(h.document.activeElement, panel);
  assert.equal(key(h, 'Tab').defaultPrevented, true);
  h.context.armoireDialogos.fechar(panel);
  assert.equal(h.document.activeElement, trigger);
  assert.equal(h.document.body.classList.contains('armoire-dialogo-aberto'), false);
});

test('tentativa de foco fora do modal volta ao painel ativo', async () => {
  const h = await pagina();
  const panel = h.add('painel');
  const inside = h.add('dentro', '', 'button'); panel.append(inside);
  const outside = h.add('fora', '', 'button');
  h.context.armoireDialogos.abrir(panel);
  h.document.activeElement = outside;
  h.document.dispatchEvent({ type: 'focusin', target: outside });
  assert.equal(h.document.activeElement, inside);
});

test('miniaturas são botões rotulados com estado selecionado e composição usa li em ul', async () => {
  const h = await pagina({ page: 'produto', id: 'fleece-frente', beforeReady: ({ add }) => add('composicaoProduto', '', 'ul') });
  const buttons = h.get('miniaturas').children;
  assert.ok(buttons.length > 1);
  buttons.forEach(b => { assert.equal(b.tagName, 'button'); assert.equal(b.type, 'button'); assert.ok(b.getAttribute('aria-label')); });
  assert.equal(buttons[0].getAttribute('aria-pressed'), 'true');
  buttons[1].click();
  assert.equal(buttons[1].getAttribute('aria-pressed'), 'true');
  assert.equal(buttons[0].getAttribute('aria-pressed'), 'false');
  assert.equal(h.get('composicaoProduto').tagName, 'ul');
  assert.ok(h.get('composicaoProduto').children.every(n => n.tagName === 'li'));
});

test('menu do catálogo abre, contém foco, fecha por Escape e restaura o botão', async () => {
  let menu, open, close;
  const h = await pagina({ beforeReady: ({ add, context }) => {
    open = add('abrirMenuCatalogo', '', 'button');
    close = add('fecharMenuCatalogo', '', 'button');
    menu = add('menuCatalogo'); menu.inert = true; menu.append(close);
    add('overlayMenuCatalogo');
    vm.runInContext(read('js/menu-catalogo.js'), context);
  } });
  open.focus(); open.click();
  assert.equal(h.document.activeElement, close);
  assert.equal(menu.inert, false);
  key(h, 'Escape');
  assert.equal(menu.inert, true);
  assert.equal(h.document.activeElement, open);
  assert.equal(open.getAttribute('aria-expanded'), 'false');
});

for (const page of ['home', 'produto']) {
  test(`menu de ${page} preserva foco e permite fechar ao seguir um link ou por Escape`, async () => {
    let menu, open, close, link;
    const h = await pagina({ page, beforeReady: ({ add, context }) => {
      open = add('abrirMenu', '', 'button');
      close = add('fecharMenu', '', 'button');
      menu = add('menuLateral'); menu.inert = true;
      const links = add('links', 'menu-links');
      link = add('destino', '', 'a'); link.href = 'produtos.html';
      links.append(link); menu.append(close, links);
      add(page === 'home' ? 'menuOverlay' : 'overlayMenu');
      if (page === 'home') {
        const inline = [...read('index.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
          .map(m => m[1]).find(s => s.includes('function abrirMenuLateral'));
        vm.runInContext(inline, context);
      }
    } });
    open.focus(); open.click();
    assert.equal(h.document.activeElement, close);
    assert.equal(menu.inert, false);
    link.click();
    assert.equal(menu.inert, true);
    assert.equal(h.document.activeElement, open);
    open.click(); key(h, 'Escape');
    assert.equal(menu.inert, true);
    assert.equal(h.document.activeElement, open);
  });
}

test('HTML das quatro páginas tem composição válida, campos rotulados e nenhum botão dentro de link', () => {
  const voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  for (const file of ['index.html', 'produtos.html', 'produto.html', 'my-armoire.html']) {
    const html = read(file).replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
    const stack = [];
    for (const m of html.matchAll(/<(\/?)([a-z][\w-]*)\b([^>]*)>/gi)) {
      const tag = m[2].toLowerCase();
      if (m[1]) { assert.equal(stack.pop(), tag, `${file}: fechamento ${tag}`); continue; }
      const attrs = Object.fromEntries([...m[3].matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g)].map(a => [a[1], a[2] ?? a[3] ?? '']));
      if (['button','input','select','textarea'].includes(tag)) assert.equal(stack.includes('a'), false, `${file}: ${tag} dentro de link`);
      if (tag === 'li') assert.ok(['ul','ol','menu'].includes(stack.at(-1)));
      if (tag === 'input' && attrs.type === 'email') {
        assert.ok(attrs.id);
        assert.ok(html.includes(`for="${attrs.id}"`), `${file}: email sem label`);
      }
      if (!voids.has(tag)) stack.push(tag);
    }
    assert.deepEqual(stack, []);
    assert.ok(html.includes('css/acessibilidade.css'));
  }
});

test('conta móvel usa botão nativo fora do seletor que ocultava ícones diretos', () => {
  for (const file of ['index.html','produtos.html','produto.html']) {
    const header = read(file).match(/<header\b[\s\S]*?<\/header>/)[0];
    assert.match(header, /<button[^>]*class="[^"]*botao-conta[^>]*aria-label="Abrir minha conta"/);
  }
  const css = read('css/acessibilidade.css');
  assert.ok(css.includes('body header .botao-conta'));
  assert.ok(css.includes('min-width: 0'));
  assert.ok(css.includes(':focus-visible'));
  assert.equal(/overflow-x:\s*hidden/.test(css), false); // Não mascara overflow cortando a página.
});

test('Tab ignora controles invisíveis por CSS e desabilitados', async () => {
  const h = await pagina();
  const panel = h.add('painel');
  const first = h.add('primeiro', '', 'button');
  const invisible = h.add('invisivel', '', 'button'); invisible.style.visibility = 'hidden';
  const disabled = h.add('desabilitado', '', 'button'); disabled.disabled = true;
  const last = h.add('ultimo', '', 'button');
  panel.append(first, invisible, disabled, last);
  h.context.armoireDialogos.abrir(panel);
  first.focus(); key(h, 'Tab', true);
  assert.equal(h.document.activeElement, last);
  key(h, 'Tab'); assert.equal(h.document.activeElement, first);
});

test('regras do catálogo desktop não ficam presas à media query de 500px', () => {
  const css = read('css/produtos.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const stack = [];
  let start = 0;
  let checked = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') {
      const selector = css.slice(start, i).trim();
      if (selector === '.grade-produtos') {
        // A regra de três colunas deve existir no escopo geral, além das variantes responsivas.
        if (stack.length === 0) checked++;
      }
      stack.push(selector); start = i + 1;
    } else if (css[i] === '}') { assert.ok(stack.length); stack.pop(); start = i + 1; }
  }
  assert.deepEqual(stack, []);
  assert.ok(checked >= 2);
});
