// Integração com páginas/serviço simulados. Não comprova navegador, layout ou backend real.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pagina, read, vm } = require('./support/ambiente.cjs');
const { aplicacao, servico, tick } = require('./support/servico.cjs');
const record = { source_id: 'black-hat', name: 'Black Hat', category: 'Boné', price: 69.99,
  images: ['images/black-hat.png'], sizes: ['M','G'], stock: 2, is_active: true };

function submit(h) {
  const form = h.get('ac-form');
  h.get('ac-name').value = ''; h.get('ac-confirm').value = '';
  h.get('ac-email').value = 'teste@example.invalid'; h.get('ac-password').value = 'senha-simulada';
  form.dispatchEvent({ type: 'submit' });
  return Promise.all(form.pending || []);
}

test('newsletter não envia formulário, não altera armazenamento e não anuncia inscrição', async () => {
  let form;
  const h = await pagina({ page: 'home', beforeReady: ({ add, context }) => {
    form = add('newsletter', 'newsletter-form', 'form');
    const email = add('email-demo', '', 'input'); email.disabled = true;
    const button = add('envio-demo', '', 'button'); button.disabled = true; button.textContent = 'DEMONSTRAÇÃO';
    form.append(email, button);
    vm.runInContext(read('js/demonstracao.js'), context);
  } });
  const before = [...h.storage];
  const event = { type: 'submit', target: form };
  h.document.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.deepEqual([...h.storage], before);
  assert.equal(h.get('envio-demo').textContent, 'DEMONSTRAÇÃO');
  assert.doesNotMatch(read('js/home.js'), /INSCRITO/);
});

test('guardas de demonstração são únicos e preservam links de navegação reais', async () => {
  const h = await pagina();
  vm.runInContext(read('js/demonstracao.js'), h.context);
  const listeners = h.document.listeners.click.length;
  vm.runInContext(read('js/demonstracao.js'), h.context);
  assert.equal(h.document.listeners.click.length, listeners);
  const demo = h.add('placeholder', '', 'a'); demo.href = '#'; demo.dataset.linkDemonstrativo = '';
  const blocked = { type: 'click', target: demo }; h.document.dispatchEvent(blocked);
  assert.equal(blocked.defaultPrevented, true);
  assert.equal(blocked.immediateStopped, true);
  const real = h.add('produto-real', '', 'a'); real.href = 'produto.html?id=black-hat';
  const allowed = { type: 'click', target: real }; h.document.dispatchEvent(allowed);
  assert.equal(allowed.defaultPrevented, undefined);
});

test('HTML identifica e desabilita demonstrações e preserva o link dinâmico do Quick Shop', () => {
  for (const page of ['index.html','produtos.html','produto.html']) {
    const html = read(page);
    const form = html.match(/<form class="newsletter-form"[\s\S]*?<\/form>/)[0];
    assert.match(form, /<input\b[^>]*disabled/);
    assert.match(form, /<button\b[^>]*disabled/);
    assert.match(form, /Nenhum e-mail é enviado ou salvo/);
    assert.match(html, /Demonstração: busca, páginas institucionais e redes sociais indisponíveis/);
    for (const m of html.matchAll(/<a\b[^>]*href="#"[^>]*>/g)) {
      if (m[0].includes('id="quickShopVerProduto"')) {
        assert.doesNotMatch(m[0], /data-link-demonstrativo/);
      } else {
        assert.match(m[0], /aria-disabled="true"/);
        assert.match(m[0], /tabindex="-1"/);
      }
    }
    if (page !== 'index.html') {
      assert.match(html, /<button class="btn-finalizar"[^>]*disabled/);
      assert.match(html, /pagamento e criação de pedidos indisponíveis/);
    }
    assert.equal([...html.matchAll(/src="js\/demonstracao.js"/g)].length, 1);
  }
});

test('carregamento lazy é aplicado somente às cinco imagens editoriais/categorias abaixo da primeira tela', () => {
  const html = read('index.html');
  const hero = html.match(/<section class="hero-home">[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(hero, /loading="lazy"/);
  const header = html.match(/<header\b[\s\S]*?<\/header>/)[0];
  assert.doesNotMatch(header, /loading="lazy"/);
  assert.equal([...html.matchAll(/<img loading="lazy" decoding="async"/g)].length, 5);
});

test('fluxo simulado home → categoria → catálogo → produto → tamanho → carrinho mantém estoque e total', async () => {
  const href = read('index.html').match(/href="(produtos.html\?categoria=acessorios)"/)[1];
  const cat = await pagina({ page: 'catalogo', search: new URL(href, 'http://localhost').search, remote: [record] });
  const card = cat.document.querySelector('.catalogo-card');
  assert.equal(card.style.display, '');
  const destino = card.querySelector('a').href;
  const id = new URL(destino, 'http://localhost').searchParams.get('id');
  const detail = await pagina({ page: 'produto', id, remote: [record] });
  detail.get('btnComprar').click(); assert.equal(detail.cart().length, 0);
  detail.get('tamanhosProduto').children[0].click(); detail.get('btnComprar').click();
  assert.equal(detail.cart().length, 1);
  assert.equal(detail.cart()[0].quantidade, 1);
  assert.equal(detail.cart()[0].tamanho, 'M');
  const cart = await pagina({ saved: detail.cart(), remote: [record] });
  cart.get('abrirCarrinho').click();
  cart.get('listaCarrinho').querySelector('.mais').click();
  cart.get('listaCarrinho').querySelector('.mais').click();
  assert.equal(cart.cart()[0].quantidade, 2);
  assert.equal(cart.get('totalCarrinho').textContent, cart.money(record.price * 2));
});

test('fluxo simulado login → favorito → My Armoire → salvar/recuperar look → carrinho', async () => {
  const mock = servico({ user: null, tables: { favoritos: [], products: [record] } });
  mock.sb.auth.signInWithPassword = async () => {
    const session = { user: { id: 'u1', email: 'teste@example.invalid' } };
    mock.emit('SIGNED_IN', session); return { data: { session } };
  };
  const h = await aplicacao(mock, { modules: ['js/armoire-favoritos.js'], remote: [record], beforeReady: ({ add }) => {
    const grade = add('grade', 'grade-produtos');
    const card = add('card', 'produto', 'article'); card.dataset.produtoId = 'black-hat'; grade.append(card);
  } });
  h.get('conta').click(); await submit(h); await h.flush();
  h.document.dispatchEvent({ type: 'armoire:cards-atualizados' });
  h.document.querySelector('.ac-favorito-botao').click(); await tick();
  assert.equal(mock.tables.favoritos.length, 1);
  await h.secao('favoritos'); assert.match(h.get('ac-detail-content').textContent, /Black Hat/);
  // Contextos distintos representam recargas de página; o serviço simulado conserva sessão/dados.
  const wardrobe = await aplicacao(mock, { builder: true, remote: [record] });
  assert.equal(wardrobe.get('ma-wardrobe').hidden, false);
  wardrobe.get('ma-save-look').click(); await tick(); await wardrobe.flush(40);
  assert.equal(mock.tables.looks_salvos.length, 1);
  assert.match(wardrobe.context.destino, /conta=meu-guarda-roupa/);
  const account = await aplicacao(mock, { modules: ['js/armoire-menu-extra.js'], remote: [record] });
  account.get('conta').click(); await account.secao('guarda-roupa');
  account.document.querySelector('.ac-look-buy').click(); await tick();
  account.document.querySelector('.ac-size-option').click(); account.get('ac-buy-confirm').click();
  assert.equal(account.cart().length, 1);
  assert.equal(account.cart()[0].id, 'black-hat');
  assert.equal(account.cart()[0].tamanho, 'M');
  assert.equal(account.cart()[0].quantidade, 1);
  assert.equal(account.get('totalCarrinho').textContent, account.money(record.price));
});

test('pedidos e configurações identificam demonstração e não executam operações de banco', async () => {
  const mock = servico(); const h = await aplicacao(mock);
  h.get('conta').click();
  for (const name of ['pedidos','configuracoes']) {
    await h.secao(name);
    assert.match(h.get('ac-detail-title').textContent, /demonstração/);
    assert.match(h.get('ac-detail-content').textContent, /demonstrativa/);
  }
  assert.equal(mock.calls.length, 0);
});
