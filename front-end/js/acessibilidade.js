/* ARMOIRE — foco dos painéis, sem alterar seus fluxos de negócio. */
(() => {
  "use strict";
  if (window.armoireDialogos) return;
  const pilha = [];
  const fundo = new Map();
  const topo = () => pilha[pilha.length - 1];
  const visivel = el => {
    const estilo = window.getComputedStyle(el);
    return estilo.display !== 'none' && estilo.visibility !== 'hidden' && estilo.visibility !== 'collapse';
  };
  const focaveis = painel => [...painel.querySelectorAll(
    'button, a[href], input, select, textarea, [tabindex]'
  )].filter(el => !el.disabled && el.tabIndex >= 0 &&
    !el.closest('[hidden], [inert]') && el.getClientRects().length && visivel(el));

  function ajustarFundo() {
    fundo.forEach((valor, el) => { el.inert = valor; });
    fundo.clear();
    const atual = topo();
    document.body.classList.toggle('armoire-dialogo-aberto', !!atual);
    if (!atual) return;
    const permitidos = [atual.painel, ...(atual.opcoes.externos || []).filter(Boolean)];
    function aplicar(pai) {
      [...pai.children].forEach(el => {
        if (['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName)) return;
        fundo.set(el, el.inert);
        const caminho = permitidos.some(alvo => el === alvo || el.contains(alvo));
        el.inert = !caminho;
        if (caminho && !permitidos.includes(el)) aplicar(el);
      });
    }
    aplicar(document.body);
    atual.painel.inert = false;
  }

  function focar(atual) {
    const alvo = atual.opcoes.inicial;
    (alvo && !alvo.disabled && !alvo.closest('[hidden], [inert]') && visivel(alvo) ? alvo :
      focaveis(atual.painel)[0] || atual.painel).focus({ preventScroll: true });
  }

  function abrir(painel, opcoes = {}) {
    if (!painel || pilha.some(item => item.painel === painel)) return;
    const entrada = { painel, opcoes, origem: opcoes.origem || document.activeElement };
    painel.setAttribute('role', 'dialog');
    painel.setAttribute('aria-modal', 'true');
    painel.setAttribute('aria-hidden', 'false');
    painel.setAttribute('tabindex', '-1');
    if (!painel.hasAttribute('aria-label') && !painel.hasAttribute('aria-labelledby')) {
      painel.setAttribute('aria-label', opcoes.nome || 'Painel');
    }
    pilha.push(entrada);
    ajustarFundo();
    requestAnimationFrame(() => { if (topo() === entrada) focar(entrada); });
  }

  function fechar(painel) {
    const indice = pilha.findIndex(item => item.painel === painel);
    if (indice < 0) return;
    const eraTopo = indice === pilha.length - 1;
    const [entrada] = pilha.splice(indice, 1);
    ajustarFundo();
    painel.inert = true;
    painel.setAttribute('aria-hidden', 'true');
    if (eraTopo) {
      if (entrada.origem?.isConnected && !entrada.origem.closest('[inert], [hidden]')) entrada.origem.focus({ preventScroll: true });
      else if (topo()) focar(topo());
    }
  }

  document.addEventListener('keydown', evento => {
    const atual = topo();
    if (!atual) return;
    if (evento.key === 'Escape' && atual.opcoes.escape !== false) {
      evento.preventDefault();
      evento.stopImmediatePropagation();
      atual.opcoes.fechar?.();
    } else if (evento.key === 'Tab') {
      // A rotina comum substitui somente a contenção de Tab dos controladores antigos.
      evento.stopImmediatePropagation();
      const itens = focaveis(atual.painel);
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      if (!primeiro) { evento.preventDefault(); atual.painel.focus({ preventScroll: true }); return; }
      if (!atual.painel.contains(document.activeElement) ||
          (evento.shiftKey && document.activeElement === primeiro) ||
          (!evento.shiftKey && document.activeElement === ultimo)) {
        evento.preventDefault();
        (evento.shiftKey ? ultimo : primeiro).focus({ preventScroll: true });
      }
    }
  }, true);
  document.addEventListener('focusin', evento => {
    const atual = topo();
    if (atual && !atual.painel.contains(evento.target)) focar(atual);
  }, true);
  window.armoireDialogos = { abrir, fechar };
})();
