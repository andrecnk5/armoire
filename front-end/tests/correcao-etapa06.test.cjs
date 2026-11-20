// Reproduz a resposta do SDK real sem sessão, sem acessar Auth ou tabelas reais.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { servico, aplicacao, tick } = require('./support/servico.cjs');
const semSessao = () => ({ data: { user: null }, error: Object.assign(
  new Error('Auth session missing!'), { name: 'AuthSessionMissingError' }
) });

test('favoritar sem sessão do SDK abre login sem erro nem operação de tabela', async () => {
  const errors = [];
  const mock = servico({ user: null, auth: { getUser: async () => semSessao() } });
  const h = await aplicacao(mock, { modules: ['js/armoire-favoritos.js'], beforeReady: ({ add, context }) => {
    context.console.error = (...args) => errors.push(args);
    const card = add('card', 'produto', 'article'); card.dataset.produtoId = 'black-hat';
    add('cards', 'grade-produtos').append(card);
  } });
  h.document.dispatchEvent({ type: 'armoire:cards-atualizados' });
  h.document.querySelector('.ac-favorito-botao').click(); await tick();
  assert.equal(h.get('ac-modal').inert, false);
  assert.equal(mock.calls.length, 0);
  assert.deepEqual(errors, []);
});

test('My Armoire sem sessão do SDK oferece login e preserva o estado após sair', async () => {
  const errors = [];
  const mock = servico({ user: null, auth: { getUser: async () => semSessao() } });
  const h = await aplicacao(mock, { builder: true, beforeReady: ({ context }) => {
    context.console.error = (...args) => errors.push(args);
  } });
  assert.match(h.get('ma-status').textContent, /Entre na sua conta/);
  assert.doesNotMatch(h.get('ma-status').textContent, /Auth session missing/);
  const login = h.document.querySelector('.ma-login');
  assert.equal(login.type, 'button');
  login.click(); await tick();
  assert.equal(h.get('ac-modal').inert, false);
  mock.emit('SIGNED_IN', { user: { id: 'u1' } });
  mock.emit('SIGNED_OUT', null);
  assert.ok(h.document.querySelector('.ma-login'));
  assert.equal(h.get('ma-wardrobe').hidden, true);
  assert.equal(mock.calls.length, 0);
  assert.deepEqual(errors, []);
});

test('falha real de Auth não é confundida com ausência de sessão', async () => {
  const mock = servico({ user: null, auth: { getUser: async () => ({ error: new Error('offline') }) } });
  const h = await aplicacao(mock, { builder: true });
  assert.match(h.get('ma-status').textContent, /Não foi possível carregar.*offline/);
  assert.equal(h.document.querySelector('.ma-login'), null);
  assert.equal(mock.calls.length, 0);
});
