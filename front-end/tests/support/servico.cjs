// Serviço e geometria inteiramente simulados; não comprova Supabase ou layout real.
const { pagina, read, vm } = require('./ambiente.cjs');
const tick = () => new Promise(setImmediate);
function servico({ user = { id: 'u1', email: 'teste@example.invalid' }, tables = {}, handle, auth = {} } = {}) {
  const calls = [], listeners = [];
  let current = user;
  const emit = (event, session) => { current = session?.user || null; listeners.forEach(fn => fn(event, session)); };
  const sb = {
    auth: {
      getSession: async () => ({ data: { session: current ? { user: current } : null } }),
      getUser: async () => ({ data: { user: current } }),
      onAuthStateChange: fn => { listeners.push(fn); },
      signInWithPassword: async () => { emit('SIGNED_IN', { user }); return { data: { session: { user } } }; },
      signOut: async () => { emit('SIGNED_OUT', null); return { error: null }; },
      ...auth
    },
    from(table) {
      const call = { table, op: 'select', filters: [] };
      const q = {
        select(columns) { call.columns = columns; return q; },
        eq(key, value) { call.filters.push([key, value]); return q; },
        in(key, value) { call.filters.push([key, value]); return q; },
        order() { return q; },
        insert(payload) { call.op = 'insert'; call.payload = payload; return q; },
        upsert(payload) { call.op = 'upsert'; call.payload = payload; return q; },
        delete() { call.op = 'delete'; return q; },
        then(resolve, reject) {
          calls.push(call);
          const custom = handle?.(call);
          if (custom !== undefined) return Promise.resolve(custom).then(resolve, reject);
          const collection = tables[table] ||= [];
          const matches = row => call.filters.every(([key, v]) => Array.isArray(v) ? v.includes(row[key]) : row[key] === v);
          let data = collection.filter(matches);
          if (call.op === 'insert') { data = [{ id: 'novo', ...call.payload }]; collection.push(...data); }
          if (call.op === 'upsert') {
            const p = call.payload;
            const old = collection.find(r => r.usuario_id === p.usuario_id &&
              (table === 'favoritos' ? r.produto_id === p.produto_id : r.tipo === p.tipo));
            if (old) Object.assign(old, p); else collection.push({ id: 'novo', ...p });
            data = [p];
          }
          if (call.op === 'delete') tables[table] = collection.filter(r => !matches(r));
          return Promise.resolve({ data, error: null }).then(resolve, reject);
        }
      };
      return q;
    }
  };
  return { sb, calls, tables, emit };
}
async function aplicacao(mock, { modules = [], builder = false, sdkUnavailable = false, beforeReady } = {}) {
  const h = await pagina({ page: 'auth', serviceClient: mock.sb, sdkUnavailable,
    beforeReady(info) {
      const { context, document, add } = info;
      context.confirm = () => true;
      context.location.assign = url => { context.destino = url; };
      context.history.state = null;
      const create = document.createElement;
      document.createElement = tag => Object.assign(create(tag), {
        scrollLeft: 0, clientWidth: 100, scrollWidth: 100,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
        scrollTo({ left }) { this.scrollLeft = left; }
      });
      let time = 0;
      context.performance = { now: () => time += 200 };
      context.cancelAnimationFrame = () => {};
      if (builder) {
        for (const id of ['ma-status','ma-wardrobe','ma-rows','ma-feedback','ma-save-feedback']) add(id);
        for (const id of ['ma-reset','ma-save','ma-save-look']) add(id, '', 'button');
        vm.runInContext(read('js/my-armoire.js'), context);
      }
      for (const file of modules) vm.runInContext(read(file), context);
      beforeReady?.(info);
    }
  });
  h.run = file => vm.runInContext(read(file), h.context);
  h.flush = async (ms = 0) => {
    for (const [id, t] of [...h.timers]) if (t.ms === ms) { h.timers.delete(id); t.fn(); }
    await tick();
  };
  h.secao = async name => {
    const button = h.document.querySelector(`[data-ac-section="${name}"]`);
    button.click();
    h.document.dispatchEvent({ type: 'click', target: button });
    await h.flush();
  };
  await tick();
  return h;
}
module.exports = { servico, aplicacao, tick };
