// Mocks de Auth, tabelas e rede: nenhuma operação em serviço real.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { read, vm } = require('./support/ambiente.cjs');
const { servico, aplicacao, tick } = require('./support/servico.cjs');
const favorito = { usuario_id: 'u1', produto_id: 'black-hat' };
const produto = { source_id: 'black-hat', name: 'Black Hat', category: 'Boné', price: 69.99, images: ['images/black-hat.png'], sizes: ['Único'], is_active: true };
const favorites = ['js/armoire-favoritos.js'];
const addresses = ['js/armoire-enderecos.js'];
const looks = ['js/armoire-menu-extra.js'];
async function submit(h) {
  const f = h.get('ac-form');
  h.get('ac-email').value = 'teste@example.invalid'; h.get('ac-password').value = 'senha-simulada';
  h.get('ac-name').value = ''; h.get('ac-confirm').value = '';
  f.dispatchEvent({ type: 'submit' }); await Promise.all(f.pending || []); await tick();
}

test('cliente único preserva a interface global e todos os módulos compartilham a sessão', async () => {
  const mock = servico(); const h = await aplicacao(mock, { modules: [...favorites, ...addresses, ...looks], builder: true });
  let creations = 0; h.context.supabase.createClient = () => { creations++; return {}; };
  h.run('js/armoire-client.js'); h.run('js/armoire-auth-ui.js');
  h.run('js/armoire-favoritos.js'); h.run('js/armoire-enderecos.js');
  assert.equal(h.context.armoireServico.cliente(), mock.sb);
  assert.equal(h.context.armoireSupabase, mock.sb);
  assert.equal(creations, 0);
  assert.equal(h.get('conta').listeners.click.length, 1);
});

test('login e logout confirmados atualizam a conta; resposta sem sessão não anuncia sucesso', async () => {
  const mock = servico({ user: null });
  mock.sb.auth.signInWithPassword = async () => ({ data: { session: null } });
  const h = await aplicacao(mock); h.get('conta').click(); await submit(h);
  assert.match(h.get('ac-message').textContent, /não confirmou/);
  assert.equal(h.get('ac-drawer').classList.contains('open'), false);
  const user = { id: 'u1', email: 'cliente@example.invalid' };
  mock.sb.auth.signInWithPassword = async () => { mock.emit('SIGNED_IN', { user }); return { data: { session: { user } } }; };
  await submit(h);
  assert.equal(h.get('ac-drawer').classList.contains('open'), true);
  assert.equal(h.get('ac-user-email').textContent, user.email);
  h.get('ac-logout').click(); await Promise.all(h.get('ac-logout').pending || []);
  assert.equal(h.get('ac-drawer').inert, true);
  h.get('conta').click(); assert.equal(h.get('ac-modal').inert, false);
});

test('falha no logout preserva sessão e mostra erro', async () => {
  const mock = servico({ auth: { signOut: async () => ({ error: new Error('offline') }) } });
  const h = await aplicacao(mock); h.get('conta').click(); h.get('ac-logout').click();
  await Promise.all(h.get('ac-logout').pending || []);
  assert.match(h.get('ac-toast').textContent, /Não foi possível sair/);
  assert.equal(h.get('ac-drawer').classList.contains('open'), true);
});

test('SDK ausente mantém acesso à mensagem de conta, bloqueia envio e encerra loading My Armoire', async () => {
  const h = await aplicacao(servico(), { sdkUnavailable: true, builder: true, modules: [...favorites, ...addresses, ...looks] });
  h.get('conta').click();
  assert.match(h.get('ac-message').textContent, /indisponível/);
  assert.equal(h.get('ac-submit').disabled, true);
  assert.match(h.get('ma-status').textContent, /indisponível/);
  assert.equal(h.get('ma-wardrobe').hidden, true);
});

test('sessão que expira durante recuperação não é restaurada por resposta antiga', async () => {
  let resolve;
  const mock = servico({ auth: { getSession: () => new Promise(r => resolve = r) } });
  const h = await aplicacao(mock);
  mock.emit('SIGNED_OUT', null);
  resolve({ data: { session: { user: { id: 'antigo' } } } }); await tick();
  h.get('conta').click();
  assert.equal(h.get('ac-modal').inert, false);
  assert.equal(h.get('ac-user-email').textContent, '');
});

test('favoritos sem cards recuperam nome, imagem e preço pelo modelo; indisponível tem estado explícito', async () => {
  const mock = servico({ tables: { favoritos: [favorito, { usuario_id: 'u1', produto_id: 'ausente' }] } });
  const h = await aplicacao(mock, { modules: favorites });
  assert.equal(h.document.querySelectorAll('.produto').length, 0);
  await h.secao('favoritos');
  const content = h.get('ac-detail-content');
  assert.match(content.textContent, /BLACK HAT/i);
  assert.match(content.textContent, /Produto indisponível \(ausente\)/);
  assert.ok(content.querySelector('img').src);
  assert.ok(content.querySelector('a').href.includes('black-hat'));
  assert.match(content.textContent, /R\$/);
});

test('favoritos não autenticados solicitam login; erro de leitura não aparece como lista vazia', async () => {
  const mock = servico({ user: null }); const h = await aplicacao(mock, { modules: favorites });
  await h.secao('favoritos');
  assert.equal(h.get('ac-modal').inert, false);
  assert.equal(mock.calls.filter(c => c.op !== 'select').length, 0);
  const err = servico({ handle: () => ({ error: new Error('offline') }) });
  const broken = await aplicacao(err, { modules: favorites }); await broken.secao('favoritos');
  assert.match(broken.get('ac-detail-content').textContent, /Não foi possível carregar/);
  assert.doesNotMatch(broken.get('ac-detail-content').textContent, /ainda não adicionou/);
});

test('favorito só é removido após confirmação; falha preserva a lista e libera nova tentativa', async () => {
  let fail = true;
  const mock = servico({ tables: { favoritos: [favorito] }, handle: call => call.op === 'delete' && fail ? { error: new Error('RLS simulada') } : undefined });
  const h = await aplicacao(mock, { modules: favorites }); await h.secao('favoritos');
  h.document.querySelector('.ac-remover-favorito').click(); await tick();
  assert.equal(mock.tables.favoritos.length, 1);
  assert.match(h.get('ac-toast').textContent, /Não foi possível atualizar/);
  fail = false; h.document.querySelector('.ac-remover-favorito').click(); await tick();
  assert.equal(mock.tables.favoritos.length, 0);
  assert.match(h.get('ac-detail-content').textContent, /ainda não adicionou/);
});

test('favoritos e endereço descartam dados privados após logout, inclusive respostas tardias', async () => {
  let resolve;
  const mock = servico({ handle: call => call.table === 'favoritos' ? new Promise(r => resolve = r) : undefined });
  const h = await aplicacao(mock, { modules: [...favorites, ...addresses] });
  mock.emit('SIGNED_OUT', null);
  resolve({ data: [favorito] }); await h.flush();
  await h.secao('favoritos');
  assert.doesNotMatch(h.get('ac-detail-content').textContent, /BLACK HAT/i);
  assert.equal(h.document.querySelectorAll('.ac-favorito-item').length, 0);
});

test('endereços carregam vazio, salvam e excluem somente com usuário confirmado (mocks)', async () => {
  const mock = servico(); const h = await aplicacao(mock, { modules: addresses });
  await h.secao('enderecos');
  assert.match(h.get('ac-detail-content').textContent, /Nenhum endereço/);
  h.document.querySelector('.ac-endereco-adicionar').click();
  const values = { destinatario: 'Cliente', cep: '01001000', logradouro: 'Praça', numero: '1', complemento: '', bairro: 'Sé', cidade: 'São Paulo', estado: 'sp' };
  for (const [name, value] of Object.entries(values)) h.document.querySelector(`input[name="${name}"]`).value = value;
  const form = h.document.querySelector('.ac-endereco-form'); form.dispatchEvent({ type: 'submit' });
  await Promise.all(form.pending || []);
  assert.equal(mock.tables.enderecos.length, 1);
  assert.equal(mock.tables.enderecos[0].usuario_id, 'u1');
  assert.equal(mock.tables.enderecos[0].estado, 'SP');
  h.document.querySelector('.ac-endereco-acoes .excluir').click(); await tick();
  assert.equal(mock.tables.enderecos.length, 0);
});

test('falha rejeitada de endereços termina o carregamento e não inventa cadastro', async () => {
  const mock = servico({ handle: () => Promise.reject(new Error('offline')) });
  const h = await aplicacao(mock, { modules: addresses }); await h.secao('enderecos');
  assert.match(h.get('ac-detail-content').textContent, /Não foi possível carregar/);
  assert.doesNotMatch(h.get('ac-detail-content').textContent, /Carregando|Nenhum endereço/);
});

test('ViaCEP indisponível permite preenchimento manual sem anunciar endereço salvo', async () => {
  const h = await aplicacao(servico(), { modules: addresses }); await h.secao('enderecos');
  h.document.querySelector('.ac-endereco-adicionar').click();
  h.context.fetch = async () => { throw new Error('offline'); };
  const cep = h.document.querySelector('input[name="cep"]'); cep.value = '01001000'; cep.dispatchEvent({ type: 'input' });
  await Promise.all(cep.pending || []);
  assert.match(h.document.querySelector('.ac-endereco-status').textContent, /Preencha os campos manualmente/);
  assert.equal(h.document.querySelector('input[name="logradouro"]').disabled, undefined);
});

for (const kind of ['vazio', 'sem usuário', 'offline']) test(`My Armoire apresenta estado ${kind} sem roletas fictícias`, async () => {
  const mock = servico({ user: kind === 'sem usuário' ? null : undefined,
    handle: kind === 'offline' ? () => Promise.reject(new Error('offline')) : undefined });
  const h = await aplicacao(mock, { builder: true });
  assert.equal(h.get('ma-wardrobe').hidden, true);
  assert.match(h.get('ma-status').textContent, kind === 'vazio' ? /vazio/ : kind === 'sem usuário' ? /Entre na sua conta/ : /Não foi possível carregar/);
  assert.equal(h.get('ma-rows').children.length, 0);
});

test('My Armoire monta e salva composição existente e recupera looks com contrato preservado', async () => {
  const mock = servico({ tables: { favoritos: [favorito], products: [produto] } });
  const h = await aplicacao(mock, { builder: true, modules: looks });
  assert.equal(h.get('ma-wardrobe').hidden, false);
  assert.equal(h.document.querySelectorAll('.ma-roulette-card').length, 1);
  h.get('ma-save-look').click(); await tick(); await h.flush(40);
  assert.equal(mock.tables.looks_salvos.length, 1);
  const saved = mock.tables.looks_salvos[0];
  assert.equal(saved.user_id, 'u1'); assert.equal(saved.composicao.versao, 1);
  assert.equal(saved.composicao.pecas[0].produto_id, 'black-hat');
  assert.match(h.context.destino, /conta=meu-guarda-roupa/);
  await h.secao('guarda-roupa');
  assert.match(h.get('ac-detail-content').textContent, /Meu Look/);
  assert.equal(h.document.querySelectorAll('.ac-look-card').length, 1);
});

test('erro ao salvar look não redireciona nem anuncia sucesso', async () => {
  const mock = servico({ tables: { favoritos: [favorito], products: [produto] }, handle: c => c.op === 'insert' ? { error: new Error('Gravação recusada') } : undefined });
  const h = await aplicacao(mock, { builder: true });
  h.get('ma-save-look').click(); await tick(); await h.flush(40);
  assert.equal(h.context.destino, undefined);
  assert.match(h.get('ma-save-feedback').textContent, /Gravação recusada/);
  assert.equal(h.get('ma-save-look').disabled, false);
});

test('My Armoire invalida consulta antiga ao sair e volta a carregar ao entrar', async () => {
  let resolve;
  let pending = true;
  const mock = servico({ tables: { favoritos: [favorito], products: [produto] }, handle: c => pending && c.table === 'favoritos' ? new Promise(r => resolve = r) : undefined });
  const h = await aplicacao(mock, { builder: true });
  mock.emit('SIGNED_OUT', null); resolve({ data: [favorito] }); await tick();
  assert.match(h.get('ma-status').textContent, /Entre na sua conta/);
  assert.equal(h.get('ma-rows').children.length, 0);
  pending = false; mock.emit('SIGNED_IN', { user: { id: 'u1' } }); await h.flush();
  assert.equal(h.get('ma-wardrobe').hidden, false);
});

test('tempo excedido encerra loading e respostas tardias não publicam sucesso', async () => {
  let resolve;
  const mock = servico({ auth: { getUser: () => new Promise(r => resolve = r) } });
  const h = await aplicacao(mock, { builder: true });
  await h.flush(8000);
  assert.match(h.get('ma-status').textContent, /demorou/);
  resolve({ data: { user: { id: 'u1' } } }); await tick();
  assert.equal(h.get('ma-wardrobe').hidden, true);
  const request = h.context.armoireServico.executar(new Promise(() => {}), true);
  const error = assert.rejects(request, /Sem confirmação.*antes de repetir/);
  await h.flush(8000); await error;
});

test('todas as páginas carregam uma única configuração e os módulos oferecidos pela conta', () => {
  for (const page of ['index.html','produtos.html','produto.html','my-armoire.html']) {
    const html = read(page);
    for (const file of ['armoire-client','armoire-auth-ui','armoire-favoritos','armoire-enderecos','armoire-menu-extra','produtos-data','armoire-supabase']) {
      assert.equal([...html.matchAll(new RegExp(`src="(?:\\./)?js/${file}\\.js"`, 'g'))].length, 1, `${page}: ${file}`);
    }
    assert.ok(html.indexOf('js/armoire-client.js') < html.indexOf('js/armoire-auth-ui.js'));
  }
});

test('favoritar por botão confirma a gravação e visitante recebe login, sem gravar', async () => {
  for (const logged of [false, true]) {
    const mock = servico({ user: logged ? { id: 'u1' } : null });
    const h = await aplicacao(mock, { modules: favorites, beforeReady: ({ add }) => {
      const grade = add('cards', 'grade-produtos');
      const card = add('card', 'produto', 'article'); card.dataset.produtoId = 'black-hat';
      grade.append(card);
    } });
    // O módulo prepara os cards ao receber o evento normal do catálogo.
    h.document.dispatchEvent({ type: 'armoire:cards-atualizados' });
    h.document.querySelector('.ac-favorito-botao').click(); await tick();
    assert.equal(mock.calls.filter(c => c.op === 'upsert').length, logged ? 1 : 0);
    if (logged) assert.equal(mock.tables.favoritos[0].produto_id, 'black-hat');
    else assert.equal(h.get('ac-modal').inert, false);
  }
});

test('formulário de endereço antigo não grava dados na conta que acabou de entrar', async () => {
  const mock = servico(); const h = await aplicacao(mock, { modules: addresses });
  await h.secao('enderecos'); h.document.querySelector('.ac-endereco-adicionar').click();
  const form = h.document.querySelector('.ac-endereco-form');
  for (const field of form.querySelectorAll('input')) field.value = field.name === 'cep' ? '01001000' : field.name === 'estado' ? 'SP' : 'Teste';
  mock.emit('SIGNED_IN', { user: { id: 'u2' } });
  form.dispatchEvent({ type: 'submit' }); await Promise.all(form.pending || []);
  assert.equal(mock.calls.filter(c => c.op === 'upsert').length, 0);
});

for (const available of [true, false]) test(`look salvo: compra ${available ? 'válida' : 'indisponível'} mantém o contrato do carrinho`, async () => {
  const mock = servico({ tables: {
    looks_salvos: [{ id: 'look', user_id: 'u1', nome: 'Look teste', composicao: { versao: 1, pecas: [{ produto_id: 'black-hat' }] } }],
    products: available ? [produto] : []
  } });
  const h = await aplicacao(mock, { modules: looks }); await h.secao('guarda-roupa');
  h.document.querySelector('.ac-look-buy').click(); await tick();
  if (available) {
    h.get('ac-buy-confirm').click(); await tick();
    assert.equal(h.cart()[0].id, 'black-hat');
    assert.equal(h.cart()[0].quantidade, 1);
    assert.match(h.document.querySelector('.ac-looks-toast').textContent, /adicionado/);
  } else {
    assert.equal(h.get('ac-buy-confirm').disabled, true);
    assert.match(h.get('ac-buy-error').textContent, /não estão disponíveis/);
    assert.equal(h.cart().length, 0);
  }
});

test('looks rejeitados por rede mostram erro, e resposta de outra seção não sobrescreve endereços', async () => {
  let resolve;
  const mock = servico({ handle: c => c.table === 'looks_salvos' ? new Promise(r => resolve = r) : undefined });
  const h = await aplicacao(mock, { modules: [...addresses, ...looks] });
  await h.secao('guarda-roupa'); await h.secao('enderecos');
  resolve({ data: [{ id: 'antigo', nome: 'Não mostrar' }] }); await tick();
  assert.doesNotMatch(h.get('ac-detail-content').textContent, /Não mostrar/);
  mock.sb.from = () => ({ select() { return this; }, eq() { return this; }, order() { return Promise.reject(new Error('offline')); } });
  await h.secao('guarda-roupa');
  assert.match(h.get('ac-detail-content').textContent, /Não foi possível carregar seus looks/);
});

test('renovação da mesma sessão preserva formulário de endereço e modal de compra aberto', async () => {
  const mock = servico({ tables: { looks_salvos: [{ id: 'look', user_id: 'u1', nome: 'Look', composicao: { pecas: [{ produto_id: 'black-hat' }] } }], products: [produto] } });
  const h = await aplicacao(mock, { modules: [...addresses, ...looks] });
  h.get('conta').click();
  await h.secao('enderecos'); h.document.querySelector('.ac-endereco-adicionar').click();
  const form = h.document.querySelector('.ac-endereco-form');
  mock.emit('TOKEN_REFRESHED', { user: { id: 'u1' } }); await h.flush();
  assert.equal(h.document.querySelector('.ac-endereco-form'), form);
  await h.secao('guarda-roupa'); h.document.querySelector('.ac-look-buy').click(); await tick();
  mock.emit('TOKEN_REFRESHED', { user: { id: 'u1' } });
  assert.equal(h.get('ac-buy-overlay').classList.contains('open'), true);
  mock.emit('SIGNED_OUT', null);
  assert.equal(h.get('ac-buy-overlay').classList.contains('open'), false);
  assert.equal(h.get('ac-drawer').inert, true);
});

test('salvamento sem confirmação deixa aviso explícito e não redireciona mesmo após resposta tardia', async () => {
  let resolve;
  const mock = servico({ tables: { favoritos: [favorito], products: [produto] }, handle: c => c.op === 'insert' ? new Promise(r => resolve = r) : undefined });
  const h = await aplicacao(mock, { builder: true });
  h.get('ma-save-look').click(); await tick(); await h.flush(40); await h.flush(8000);
  assert.match(h.get('ma-save-feedback').textContent, /Sem confirmação.*antes de repetir/);
  assert.equal(h.context.destino, undefined);
  resolve({ error: null }); await tick();
  assert.equal(h.context.destino, undefined);
  assert.equal(h.get('ma-save-feedback').dataset.type, 'erro');
});

test('cadastro simulado sem sessão pede confirmação de e-mail; resposta inválida não anuncia cadastro', async () => {
  const mock = servico({ user: null });
  mock.sb.auth.signUp = async () => ({ data: { user: { id: 'pendente' }, session: null } });
  const h = await aplicacao(mock); h.get('conta').click(); h.get('ac-switch').click();
  const form = h.get('ac-form');
  h.get('ac-email').value = 'teste@example.invalid'; h.get('ac-name').value = 'Cliente Teste';
  h.get('ac-password').value = h.get('ac-confirm').value = 'senha-simulada';
  form.dispatchEvent({ type: 'submit' }); await Promise.all(form.pending || []);
  assert.match(h.get('ac-message').textContent, /e-mail de confirmação/);
  assert.equal(h.get('ac-drawer').classList.contains('open'), false);
  mock.sb.auth.signUp = async () => ({ data: null });
  form.dispatchEvent({ type: 'submit' }); await Promise.all(form.pending || []);
  assert.match(h.get('ac-message').textContent, /não confirmou/);
});
