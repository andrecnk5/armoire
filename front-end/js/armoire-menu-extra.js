
(() => {
  "use strict";

  /* ==========================================
     ARMOIRE CENTRAL
     MENU EXTRA + MEU GUARDA-ROUPA
     LOOKS SALVOS / EXCLUSÃO / CARRINHO
     SELETOR DE TAMANHOS PERSONALIZADO
  ========================================== */

  const SUPABASE_URL =
    "https://wcuutgmwlipshdpqxbim.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_sbX0g8RVoczkFCE4rRtrzQ_n7xvWHL1";

  const PARAMETRO_CONTA = "meu-guarda-roupa";

  const $ = id => document.getElementById(id);

  let sb = null;
  let carregamentoAtual = 0;

  let excluindo = false;
  let comprando = false;
  let carregandoCompra = false;

  let modalAberto = null;
  let focoAnterior = null;
  let acaoExclusao = null;

  let produtosCompra = [];
  let requisicaoCompra = 0;
  let tentativaCompra = 0;

  let timerToast = null;
  let timerCompra = null;

  let seletorAberto = null;

  const moeda = valor =>
    Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  /* ==========================================
     1. ELEMENTOS AUXILIARES
  ========================================== */

  function elemento(tag, classe = "", texto = null) {
    const el = document.createElement(tag);

    if (classe) {
      el.className = classe;
    }

    if (texto !== null) {
      el.textContent = texto;
    }

    return el;
  }

  function criarIcone(classe) {
    const icone = elemento("i");

    icone.className = classe;
    icone.setAttribute("aria-hidden", "true");

    return icone;
  }

  function mensagem(texto, erro = false) {
    const el = elemento(
      "p",
      "ac-looks-message",
      texto
    );

    if (erro) {
      el.dataset.error = "true";
    }

    return el;
  }

  function moedaSegura(valor) {
    const numero = Number(valor);

    return Number.isFinite(numero) && numero >= 0
      ? numero
      : 0;
  }

  function formatarData(data) {
    if (!data) return "";

    const valor = new Date(data);

    if (Number.isNaN(valor.getTime())) {
      return "";
    }

    return valor.toLocaleDateString("pt-BR");
  }

  function imagemSegura(valor) {
    if (
      typeof valor !== "string" ||
      !valor.trim()
    ) {
      return "";
    }

    try {
      const url = new URL(
        valor.trim(),
        window.location.href
      );

      if (
        url.protocol === "http:" ||
        url.protocol === "https:"
      ) {
        return url.href;
      }

    } catch {
      return "";
    }

    return "";
  }

  /* ==========================================
     2. SUPABASE
  ========================================== */

  function obterSupabase() {
    if (sb) return sb;

    if (window.armoireSupabase) {
      sb = window.armoireSupabase;
      return sb;
    }

    if (!window.supabase?.createClient) {
      throw new Error(
        "A biblioteca do Supabase não está disponível."
      );
    }

    sb = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    window.armoireSupabase = sb;

    return sb;
  }

  async function obterUsuario() {
    const { data, error } =
      await obterSupabase().auth.getUser();

    if (error) throw error;

    return data?.user || null;
  }

  /* ==========================================
     3. DADOS DOS LOOKS E PRODUTOS
  ========================================== */

  function obterPecas(look) {
    const pecas = look?.composicao?.pecas;

    if (!Array.isArray(pecas)) {
      return [];
    }

    return pecas.filter(
      peca =>
        peca &&
        typeof peca === "object"
    );
  }

  function obterImagemProduto(produto) {
    let imagens = produto.images;

    if (typeof imagens === "string") {
      try {
        imagens = JSON.parse(imagens);
      } catch {
        imagens = [imagens];
      }
    }

    if (Array.isArray(imagens)) {
      const primeira = imagens.find(Boolean);

      if (typeof primeira === "string") {
        return primeira;
      }

      if (
        primeira &&
        typeof primeira === "object"
      ) {
        return (
          primeira.url ||
          primeira.src ||
          ""
        );
      }
    }

    return produto.image_url || "";
  }

  function normalizarTamanhos(produto) {
    let tamanhos = produto.sizes;

    if (typeof tamanhos === "string") {
      try {
        tamanhos = JSON.parse(tamanhos);
      } catch {
        tamanhos = tamanhos.split(",");
      }
    }

    if (!Array.isArray(tamanhos)) {
      return [];
    }

    return [
      ...new Set(
        tamanhos.map(item => {
          if (typeof item === "string") {
            return item.trim();
          }

          return String(
            item?.name ||
            item?.size ||
            item?.tamanho ||
            ""
          ).trim();

        }).filter(Boolean)
      )
    ];
  }

  /* ==========================================
     4. LINK MY ARMOIRE
  ========================================== */

  function adicionarMyArmoire() {
    const menus = document.querySelectorAll(
      ".menu-catalogo-links, " +
      ".menu-links, " +
      ".menu-mobile nav"
    );

    menus.forEach(menu => {
      if (
        menu.querySelector(
          'a[href="my-armoire.html"]'
        )
      ) {
        return;
      }

      const link = elemento(
        "a",
        "link-my-armoire",
        "MY ARMOIRE"
      );

      link.href = "my-armoire.html";

      menu.appendChild(link);
    });
  }

  /* ==========================================
     5. ESTILOS
  ========================================== */

  function instalarEstilos() {
    if ($("ac-looks-styles")) {
      return;
    }

    const style = elemento("style");

    style.id = "ac-looks-styles";

    style.textContent = `

      /* ======================================
         LOOKS SALVOS
      ====================================== */

      .ac-looks-intro {
        margin: 0 0 24px;
        color: #687184;
        font-size: 12px;
        line-height: 1.8;
      }

      .ac-looks-grid {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 15px;
        width: 100%;
      }

      .ac-look-card {
        position: relative;
        min-width: 0;
        padding: 12px;
        background: #fff;
        border: 1px solid #e6e9ef;
        transition:
          border-color .25s ease,
          box-shadow .25s ease;
      }

      .ac-look-card:hover,
      .ac-look-card:focus-within {
        border-color: #031638;
        box-shadow:
          0 7px 20px rgba(3,22,56,.07);
      }

      .ac-look-preview {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 5px;
        min-height: 130px;
        padding: 6px;
        background: #f6f7f9;
      }

      .ac-look-preview img {
        display: block;
        width: 100%;
        height: 100px;
        object-fit: contain;
        background: #fff;
      }

      .ac-look-preview img:only-child {
        grid-column: 1 / -1;
        height: 205px;
      }

      .ac-look-preview-empty {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #8b93a0;
        font-size: 11px;
      }

      .ac-look-name {
        margin: 13px 0 5px;
        color: #031638;
        font-size: 11px;
        font-weight: 600;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .ac-look-meta {
        margin: 0;
        color: #818895;
        font-size: 10px;
        line-height: 1.7;
      }

      .ac-looks-message {
        padding: 22px 10px;
        text-align: center;
        color: #687184;
        font-size: 12px;
        line-height: 1.8;
      }

      .ac-looks-message[data-error="true"] {
        color: #a32b37;
      }

      .ac-looks-new {
        display: block;
        margin-top: 20px;
        padding: 14px 16px;
        background: #031638;
        color: #fff;
        text-align: center;
        text-decoration: none;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 1px;
        transition: background .2s ease;
      }

      .ac-looks-new:hover {
        background: #102b55;
      }

      /* ======================================
         BOTÕES DOS CARDS
      ====================================== */

      .ac-look-actions {
        position: absolute;
        top: 18px;
        right: 18px;
        z-index: 5;
        width: 32px;
        height: 32px;
      }

      .ac-look-action {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: 1px solid #e4e6eb;
        border-radius: 0;
        box-sizing: border-box;
        background: #fff;
        color: #031638;
        cursor: pointer;
        transition:
          transform .35s cubic-bezier(.22,1,.36,1),
          background .25s ease,
          color .25s ease,
          opacity .25s ease;
      }

      .ac-look-action i {
        font-size: 13px;
      }

      .ac-look-delete {
        z-index: 2;
      }

      .ac-look-delete:hover {
        background: #a32b37;
        color: #fff;
      }

      .ac-look-buy {
        z-index: 1;
        opacity: 0;
        transform: translateY(0);
        pointer-events: none;
      }

      .ac-look-card:hover .ac-look-buy,
      .ac-look-card:focus-within .ac-look-buy {
        opacity: 1;
        transform: translateY(39px);
        pointer-events: auto;
      }

      .ac-look-buy:hover {
        background: #031638;
        color: #fff;
      }

      .ac-look-action:disabled {
        opacity: .5;
        cursor: wait;
      }

      /* ======================================
         MODAIS
      ====================================== */

      .ac-looks-modal-overlay[hidden] {
        display: none !important;
      }

      .ac-looks-modal-overlay {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483000 !important;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100vw;
        height: 100vh;
        padding: 22px;
        margin: 0;
        box-sizing: border-box;
        background: rgba(2,9,23,.72);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition:
          opacity .3s ease,
          visibility .3s ease;
      }

      .ac-looks-modal-overlay.open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }

      .ac-looks-modal {
        position: relative;
        z-index: 1;
        display: block;
        width: 100%;
        max-width: 420px;
        max-height: calc(100dvh - 44px);
        overflow-y: auto;
        box-sizing: border-box;
        padding: 30px;
        margin: 0;
        background: #fff;
        color: #031638;
        border: 1px solid #e8eaf0;
        box-shadow:
          0 24px 70px rgba(0,0,0,.2);
        opacity: 0;
        visibility: visible;
        transform: translateY(18px) scale(.97);
        transition:
          opacity .35s ease,
          transform .4s cubic-bezier(.22,1,.36,1);
      }

      .ac-looks-modal-overlay.open
      .ac-looks-modal {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .ac-looks-modal-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e8eaf0;
      }

      .ac-looks-modal-brand {
        color: #031638;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 2px;
      }

      .ac-looks-modal-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        border: none;
        background: transparent;
        color: #687184;
        font-size: 20px;
        cursor: pointer;
      }

      .ac-looks-modal-close:hover {
        color: #031638;
      }

      .ac-looks-modal-title {
        margin: 0 0 12px;
        color: #031638;
        font-family: Montserrat, sans-serif;
        font-size: 19px;
        font-weight: 600;
        letter-spacing: 1px;
        line-height: 1.4;
      }

      .ac-looks-modal-description {
        margin: 0;
        color: #687184;
        font-size: 12px;
        line-height: 1.9;
      }

      .ac-looks-modal-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .ac-looks-modal-actions button {
        min-height: 47px;
        padding: 12px 10px;
        border: 1px solid #031638;
        border-radius: 0;
        font-family: Montserrat, sans-serif;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: .7px;
        cursor: pointer;
        transition:
          background .25s ease,
          color .25s ease;
      }

      .ac-looks-modal-cancel {
        background: #fff;
        color: #031638;
      }

      .ac-looks-modal-cancel:hover {
        background: #f2f4f7;
      }

      .ac-looks-modal-primary {
        background: #031638;
        color: #fff;
      }

      .ac-looks-modal-primary:hover:not(:disabled) {
        background: #122e59;
      }

      .ac-looks-modal-actions button:disabled {
        opacity: .55;
        cursor: wait;
      }

      .ac-looks-modal-overlay button:focus-visible {
        outline: 2px solid #031638;
        outline-offset: 3px;
      }

      /* ======================================
         MODAL DE EXCLUSÃO
      ====================================== */

      .ac-looks-confirm-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 29px 0 26px;
        text-align: center;
      }

      .ac-looks-confirm-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        margin-bottom: 20px;
        color: #031638;
        font-size: 24px;
      }

      .ac-looks-confirm-name {
        margin: 12px 0 0;
        color: #031638;
        font-size: 11px;
        font-weight: 600;
        overflow-wrap: anywhere;
      }

      /* ======================================
         MODAL DE COMPRA
      ====================================== */

      .ac-looks-buy-modal {
        max-width: 490px;
      }

      .ac-looks-buy-body {
        padding: 26px 0 12px;
      }

      .ac-looks-buy-list {
        display: flex;
        flex-direction: column;
        gap: 0;
        margin-top: 18px;
        max-height: 42vh;
        overflow-y: auto;
        scrollbar-width: thin;
      }

      .ac-looks-buy-item {
        display: grid;
        grid-template-columns:
          82px minmax(0,1fr);
        gap: 15px;
        padding: 16px 0;
        border-bottom: 1px solid #e8eaf0;
      }

      .ac-looks-buy-image {
        display: block;
        width: 82px;
        height: 105px;
        object-fit: contain;
        background: #f6f7f9;
      }

      .ac-looks-buy-info {
        min-width: 0;
      }

      .ac-looks-buy-name {
        margin: 0 0 6px;
        color: #031638;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.5;
      }

      .ac-looks-buy-price {
        margin: 0 0 12px;
        color: #687184;
        font-size: 12px;
      }

      .ac-looks-buy-label {
        display: block;
        margin-bottom: 6px;
        color: #031638;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: .8px;
      }

      /* ======================================
         NOVO SELETOR PERSONALIZADO
      ====================================== */

      .ac-size-picker {
        position: relative;
        width: 100%;
        font-family: Montserrat, sans-serif;
      }

      .ac-size-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
        min-height: 40px;
        padding: 10px 13px;
        border: 1px solid #dfe2e8;
        border-radius: 0;
        background: #fff;
        color: #031638;
        text-align: left;
        font-family: inherit;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: .2px;
        cursor: pointer;
        transition:
          border-color .25s ease,
          background .25s ease;
      }

      .ac-size-trigger:hover,
      .ac-size-picker.open .ac-size-trigger {
        border-color: #031638;
      }

      .ac-size-trigger i {
        flex-shrink: 0;
        font-size: 10px;
        color: #031638;
        transition:
          transform .3s cubic-bezier(.22,1,.36,1);
      }

      .ac-size-picker.open .ac-size-trigger i {
        transform: rotate(180deg);
      }

      .ac-size-trigger:disabled {
        opacity: .55;
        cursor: not-allowed;
      }

      .ac-size-dropdown {
        position: absolute;
        top: calc(100% + 5px);
        left: 0;
        right: 0;
        z-index: 30;
        padding: 5px;
        background: #fff;
        border: 1px solid #dfe2e8;
        box-shadow:
          0 12px 28px rgba(3,22,56,.12);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-7px);
        pointer-events: none;
        transition:
          opacity .22s ease,
          transform .25s cubic-bezier(.22,1,.36,1),
          visibility .22s ease;
      }

      .ac-size-picker.open .ac-size-dropdown {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        pointer-events: auto;
      }

      .ac-size-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
        min-height: 37px;
        padding: 9px 11px;
        border: none;
        border-radius: 0;
        background: #fff;
        color: #031638;
        text-align: left;
        font-family: inherit;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition:
          background .2s ease,
          color .2s ease;
      }

      .ac-size-option:hover,
      .ac-size-option:focus-visible {
        background: #f0f3f8;
        color: #031638;
        outline: none;
      }

      .ac-size-option.selected {
        background: #031638;
        color: #fff;
      }

      .ac-size-option i {
        font-size: 10px;
      }

      .ac-size-picker.invalid .ac-size-trigger {
        border-color: #a32b37;
      }

      /* ======================================
         SUBTOTAL E ERROS
      ====================================== */

      .ac-looks-buy-total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 0;
        border-top: 1px solid #e8eaf0;
        color: #031638;
      }

      .ac-looks-buy-total span {
        font-size: 11px;
        letter-spacing: 1px;
      }

      .ac-looks-buy-total strong {
        font-size: 17px;
      }

      .ac-looks-buy-error {
        min-height: 16px;
        margin: 0 0 12px;
        color: #a32b37;
        font-size: 11px;
        line-height: 1.6;
      }

      .ac-looks-buy-loading {
        padding: 35px 0;
        text-align: center;
        color: #687184;
        font-size: 12px;
      }

      /* ======================================
         TOAST
      ====================================== */

      .ac-looks-toast {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 2147483001;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: min(370px, calc(100vw - 40px));
        box-sizing: border-box;
        padding: 16px 20px;
        background: #031638;
        color: #fff;
        border-left: 3px solid #c6d0e1;
        box-shadow:
          0 12px 35px rgba(3,22,56,.2);
        font-size: 12px;
        line-height: 1.6;
        opacity: 0;
        visibility: hidden;
        transform: translateY(15px);
        pointer-events: none;
        transition:
          opacity .3s ease,
          transform .3s ease,
          visibility .3s ease;
      }

      .ac-looks-toast.show {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .ac-looks-toast[data-type="erro"] {
        border-left-color: #d95a66;
      }

      /* ======================================
         RESPONSIVIDADE
      ====================================== */

      @media (hover: none) {
        .ac-look-buy {
          opacity: 1;
          transform: translateY(39px);
          pointer-events: auto;
        }
      }

      @media (max-width: 420px) {
        .ac-looks-grid {
          gap: 9px;
        }

        .ac-look-card {
          padding: 8px;
        }

        .ac-look-preview img {
          height: 80px;
        }

        .ac-look-preview img:only-child {
          height: 165px;
        }

        .ac-look-actions {
          top: 13px;
          right: 13px;
        }

        .ac-looks-modal {
          padding: 23px 18px;
        }

        .ac-looks-modal-title {
          font-size: 17px;
        }

        .ac-looks-modal-actions {
          gap: 9px;
        }

        .ac-looks-toast {
          left: 20px;
          right: 20px;
          bottom: 20px;
          max-width: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .ac-looks-modal-overlay,
        .ac-looks-modal,
        .ac-look-action,
        .ac-looks-toast,
        .ac-size-dropdown,
        .ac-size-trigger i {
          transition-duration: .01ms;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* ==========================================
     6. SISTEMA DE MODAIS
  ========================================== */

  function criarModal(id, classeExtra = "") {
    const overlay = elemento(
      "div",
      "ac-looks-modal-overlay"
    );

    overlay.id = id;
    overlay.hidden = true;
    overlay.inert = true;

    const modal = elemento(
      "section",
      `ac-looks-modal ${classeExtra}`
    );

    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    const topo = elemento(
      "div",
      "ac-looks-modal-top"
    );

    const marca = elemento(
      "span",
      "ac-looks-modal-brand",
      "ARMOIRE CENTRAL"
    );

    const fechar = elemento(
      "button",
      "ac-looks-modal-close"
    );

    fechar.type = "button";
    fechar.setAttribute(
      "aria-label",
      "Fechar janela"
    );

    fechar.appendChild(
      criarIcone("fa-solid fa-xmark")
    );

    topo.append(marca, fechar);
    modal.appendChild(topo);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    fechar.addEventListener(
      "click",
      fecharModal
    );

    overlay.addEventListener(
      "click",
      evento => {
        if (evento.target === overlay) {
          fecharModal();
        }
      }
    );

    return {
      overlay,
      modal,
      fechar
    };
  }

  function abrirModal(id) {
    if (modalAberto) {
      return false;
    }

    const overlay = $(id);

    if (!overlay) {
      return false;
    }

    focoAnterior = document.activeElement;
    modalAberto = id;

    overlay.hidden = false;
    overlay.inert = false;

    overlay.style.display = "flex";
    overlay.style.zIndex = "2147483000";

    requestAnimationFrame(() => {
      if (modalAberto !== id) return;

      overlay.classList.add("open");
      window.armoireDialogos?.abrir(overlay.querySelector(".ac-looks-modal"), {
        fechar: fecharModal, escape: false, origem: focoAnterior, externos: [overlay]
      });

      overlay.querySelector(
        ".ac-looks-modal-close"
      )?.focus();
    });

    return true;
  }

  function fecharModal() {
    if (
      !modalAberto ||
      excluindo ||
      comprando
    ) {
      return;
    }

    fecharSeletorTamanho();

    const id = modalAberto;
    const overlay = $(id);

    modalAberto = null;
    acaoExclusao = null;

    requisicaoCompra++;
    carregandoCompra = false;
    produtosCompra = [];

    if (overlay) {
      overlay.classList.remove("open");
      window.armoireDialogos?.fechar(overlay.querySelector(".ac-looks-modal"));

      setTimeout(() => {
        if (modalAberto !== id) {
          overlay.hidden = true;
          overlay.inert = true;
          overlay.style.display = "none";
        }
      }, 320);
    }

    if (
      focoAnterior &&
      focoAnterior.isConnected
    ) {
      focoAnterior.focus();
    }

    focoAnterior = null;
  }

  /* ==========================================
     7. TECLADO DOS MODAIS
  ========================================== */

  document.addEventListener(
    "keydown",
    evento => {
      if (!modalAberto) return;

      if (evento.key === "Escape") {
        if (seletorAberto) {
          evento.preventDefault();
          evento.stopImmediatePropagation();

          fecharSeletorTamanho();
          return;
        }

        evento.preventDefault();
        evento.stopImmediatePropagation();

        fecharModal();
        return;
      }

      if (evento.key !== "Tab") {
        return;
      }

      const overlay = $(modalAberto);

      if (!overlay) return;

      const controles = [
        ...overlay.querySelectorAll(
          'button:not(:disabled), ' +
          'a[href]'
        )
      ].filter(el => el.getClientRects().length);

      if (!controles.length) return;

      const primeiro = controles[0];
      const ultimo = controles[controles.length - 1];

      if (
        evento.shiftKey &&
        document.activeElement === primeiro
      ) {
        evento.preventDefault();
        ultimo.focus();

      } else if (
        !evento.shiftKey &&
        document.activeElement === ultimo
      ) {
        evento.preventDefault();
        primeiro.focus();
      }
    },
    true
  );

  /* ==========================================
     8. NOTIFICAÇÕES
  ========================================== */

  function notificar(
    texto,
    tipo = "sucesso"
  ) {
    let toast = $("ac-looks-toast");

    if (!toast) {
      toast = elemento(
        "div",
        "ac-looks-toast"
      );

      toast.id = "ac-looks-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");

      document.body.appendChild(toast);
    }

    toast.replaceChildren(
      criarIcone(
        tipo === "erro"
          ? "fa-solid fa-circle-exclamation"
          : "fa-regular fa-circle-check"
      ),
      elemento("span", "", texto)
    );

    toast.dataset.type = tipo;

    clearTimeout(timerToast);

    toast.classList.remove("show");

    void toast.offsetWidth;

    toast.classList.add("show");

    timerToast = setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }

  /* ==========================================
     9. MODAL DE EXCLUSÃO
  ========================================== */

  function criarModalExclusao() {
    if ($("ac-confirm-overlay")) {
      return;
    }

    const { modal } = criarModal(
      "ac-confirm-overlay"
    );

    const corpo = elemento(
      "div",
      "ac-looks-confirm-body"
    );

    const icone = elemento(
      "div",
      "ac-looks-confirm-icon"
    );

    icone.appendChild(
      criarIcone("fa-regular fa-trash-can")
    );

    const titulo = elemento(
      "h2",
      "ac-looks-modal-title",
      "EXCLUIR LOOK?"
    );

    titulo.id = "ac-confirm-title";

    const descricao = elemento(
      "p",
      "ac-looks-modal-description",
      "Deseja realmente excluir este look do seu guarda-roupa? Esta ação não poderá ser desfeita."
    );

    const nome = elemento(
      "p",
      "ac-looks-confirm-name"
    );

    nome.id = "ac-confirm-name";

    corpo.append(
      icone,
      titulo,
      descricao,
      nome
    );

    const acoes = elemento(
      "div",
      "ac-looks-modal-actions"
    );

    const cancelar = elemento(
      "button",
      "ac-looks-modal-cancel",
      "CANCELAR"
    );

    cancelar.type = "button";

    cancelar.addEventListener(
      "click",
      fecharModal
    );

    const excluir = elemento(
      "button",
      "ac-looks-modal-primary",
      "EXCLUIR LOOK"
    );

    excluir.type = "button";
    excluir.id = "ac-confirm-delete";

    excluir.addEventListener(
      "click",
      () => {
        if (
          !excluindo &&
          typeof acaoExclusao === "function"
        ) {
          acaoExclusao();
        }
      }
    );

    acoes.append(cancelar, excluir);
    modal.append(corpo, acoes);

    modal.setAttribute(
      "aria-labelledby",
      "ac-confirm-title"
    );
  }

  function confirmarExclusao(look, botao) {
    if (modalAberto) return;

    $("ac-confirm-name").textContent =
      look.nome || "Meu Look";

    acaoExclusao = () =>
      excluirLook(look, botao);

    abrirModal("ac-confirm-overlay");
  }

  /* ==========================================
     10. EXCLUIR LOOK DO SUPABASE
  ========================================== */

  async function excluirLook(look, botao) {
    if (excluindo) return;

    excluindo = true;
    botao.disabled = true;

    const confirmar = $("ac-confirm-delete");

    confirmar.disabled = true;
    confirmar.textContent = "EXCLUINDO...";

    try {
      const usuario = await obterUsuario();

      if (!usuario) {
        throw new Error(
          "Sua sessão expirou. Entre novamente."
        );
      }

      const { data, error } = await obterSupabase()
        .from("looks_salvos")
        .delete()
        .eq("id", look.id)
        .eq("user_id", usuario.id)
        .select("id");

      if (error) throw error;

      if (!data?.length) {
        throw new Error(
          "O look não foi encontrado ou não pôde ser excluído."
        );
      }

      excluindo = false;
      fecharModal();

      await carregarLooks();

      notificar(
        "Look excluído com sucesso."
      );

    } catch (erro) {
      console.error(
        "Erro ao excluir look:",
        erro
      );

      excluindo = false;
      fecharModal();

      notificar(
        "Não foi possível excluir o look: " +
        (erro.message || "Tente novamente."),
        "erro"
      );

    } finally {
      excluindo = false;
      botao.disabled = false;
      confirmar.disabled = false;
      confirmar.textContent = "EXCLUIR LOOK";
    }
  }

  /* ==========================================
     11. MODAL DE COMPRA
  ========================================== */

  function criarModalCompra() {
    if ($("ac-buy-overlay")) {
      return;
    }

    const { modal } = criarModal(
      "ac-buy-overlay",
      "ac-looks-buy-modal"
    );

    const corpo = elemento(
      "div",
      "ac-looks-buy-body"
    );

    const titulo = elemento(
      "h2",
      "ac-looks-modal-title",
      "FINALIZAR SEU LOOK"
    );

    titulo.id = "ac-buy-title";

    const descricao = elemento(
      "p",
      "ac-looks-modal-description",
      "Escolha o tamanho de cada peça antes de adicionar sua combinação ao carrinho."
    );

    const lista = elemento(
      "div",
      "ac-looks-buy-list"
    );

    lista.id = "ac-buy-list";

    corpo.append(
      titulo,
      descricao,
      lista
    );

    const subtotal = elemento(
      "div",
      "ac-looks-buy-total"
    );

    subtotal.appendChild(
      elemento(
        "span",
        "",
        "SUBTOTAL"
      )
    );

    const total = elemento(
      "strong",
      "",
      moeda(0)
    );

    total.id = "ac-buy-total";

    subtotal.appendChild(total);

    const erro = elemento(
      "p",
      "ac-looks-buy-error"
    );

    erro.id = "ac-buy-error";
    erro.setAttribute("role", "status");

    const acoes = elemento(
      "div",
      "ac-looks-modal-actions"
    );

    const cancelar = elemento(
      "button",
      "ac-looks-modal-cancel",
      "CANCELAR"
    );

    cancelar.type = "button";
    cancelar.addEventListener(
      "click",
      fecharModal
    );

    const confirmar = elemento(
      "button",
      "ac-looks-modal-primary",
      "ADICIONAR AO CARRINHO"
    );

    confirmar.id = "ac-buy-confirm";
    confirmar.type = "button";

    confirmar.addEventListener(
      "click",
      confirmarCompra
    );

    acoes.append(
      cancelar,
      confirmar
    );

    modal.append(
      corpo,
      subtotal,
      erro,
      acoes
    );

    modal.setAttribute(
      "aria-labelledby",
      "ac-buy-title"
    );
  }

  /* ==========================================
     12. SELETOR DE TAMANHOS PERSONALIZADO
  ========================================== */

  function fecharSeletorTamanho() {
    if (!seletorAberto) return;

    const seletor = seletorAberto;

    seletor.classList.remove("open");

    const trigger = seletor.querySelector(
      ".ac-size-trigger"
    );

    trigger?.setAttribute(
      "aria-expanded",
      "false"
    );

    seletorAberto = null;
  }

  function abrirSeletorTamanho(seletor) {
    if (seletorAberto === seletor) {
      fecharSeletorTamanho();
      return;
    }

    fecharSeletorTamanho();

    seletor.classList.add("open");

    const trigger = seletor.querySelector(
      ".ac-size-trigger"
    );

    trigger?.setAttribute(
      "aria-expanded",
      "true"
    );

    seletorAberto = seletor;
  }

  function criarSeletorTamanho(tamanhos, indice) {
    const seletor = elemento(
      "div",
      "ac-size-picker"
    );

    seletor.dataset.indice = String(indice);
    seletor.dataset.value = "";

    const trigger = elemento(
      "button",
      "ac-size-trigger"
    );

    trigger.type = "button";

    trigger.setAttribute(
      "aria-label",
      "Selecionar tamanho"
    );

    trigger.setAttribute(
      "aria-expanded",
      "false"
    );

    const texto = elemento(
      "span",
      "ac-size-value",
      "Selecione o tamanho"
    );

    const seta = criarIcone(
      "fa-solid fa-chevron-down"
    );

    trigger.append(texto, seta);

    const dropdown = elemento(
      "div",
      "ac-size-dropdown"
    );

    dropdown.id = `ac-size-options-${indice}`;

    trigger.setAttribute(
      "aria-controls",
      dropdown.id
    );

    tamanhos.forEach(tamanho => {
      const option = elemento(
        "button",
        "ac-size-option",
        tamanho
      );

      option.type = "button";
      option.dataset.value = tamanho;

      option.addEventListener("click", () => {
        seletor.dataset.value = tamanho;

        texto.textContent = tamanho;

        seletor.classList.remove("invalid");

        dropdown.querySelectorAll(
          ".ac-size-option"
        ).forEach(botao => {
          botao.classList.remove("selected");

          botao.querySelector("i")?.remove();
        });

        option.classList.add("selected");

        option.appendChild(
          criarIcone("fa-solid fa-check")
        );

        $("ac-buy-error").textContent = "";

        fecharSeletorTamanho();

        trigger.focus();
      });

      dropdown.appendChild(option);
    });

    if (!tamanhos.length) {
      texto.textContent = "Tamanhos indisponíveis";
      trigger.disabled = true;
    }

    if (tamanhos.length === 1) {
      const tamanho = tamanhos[0];

      seletor.dataset.value = tamanho;
      texto.textContent = tamanho;

      const option = dropdown.querySelector(
        ".ac-size-option"
      );

      if (option) {
        option.classList.add("selected");

        option.appendChild(
          criarIcone("fa-solid fa-check")
        );
      }
    }

    trigger.addEventListener("click", () => {
      abrirSeletorTamanho(seletor);
    });

    seletor.append(trigger, dropdown);

    return seletor;
  }

  /* FECHAR DROPDOWN AO CLICAR FORA */

  document.addEventListener("click", evento => {
    if (
      seletorAberto &&
      !seletorAberto.contains(evento.target)
    ) {
      fecharSeletorTamanho();
    }
  });

  /* ==========================================
     13. CARD DE PRODUTO NO MODAL
  ========================================== */

  function criarItemCompra(produto, indice) {
    const card = elemento(
      "article",
      "ac-looks-buy-item"
    );

    const imagem = elemento(
      "img",
      "ac-looks-buy-image"
    );

    imagem.src = imagemSegura(
      obterImagemProduto(produto)
    );

    imagem.alt = produto.name || "Produto";
    imagem.loading = "lazy";

    const info = elemento(
      "div",
      "ac-looks-buy-info"
    );

    const nome = elemento(
      "h3",
      "ac-looks-buy-name",
      produto.name || "Produto"
    );

    const preco = elemento(
      "p",
      "ac-looks-buy-price",
      moeda(produto.price)
    );

    const label = elemento(
      "span",
      "ac-looks-buy-label",
      "TAMANHO"
    );

    const tamanhos =
      normalizarTamanhos(produto);

    const seletor = criarSeletorTamanho(
      tamanhos,
      indice
    );

    info.append(
      nome,
      preco,
      label,
      seletor
    );

    card.append(
      imagem,
      info
    );

    return card;
  }

  /* ==========================================
     14. ABRIR COMPRA DE LOOK SALVO
  ========================================== */

  async function abrirCompraLook(look) {
    if (
      modalAberto ||
      carregandoCompra
    ) {
      return;
    }

    const pecas = obterPecas(look);

    const ids = [
      ...new Set(
        pecas.map(peca =>
          String(peca.produto_id || "").trim()
        ).filter(Boolean)
      )
    ];

    if (!ids.length) {
      notificar(
        "Este look não possui produtos disponíveis.",
        "erro"
      );

      return;
    }

    if (!abrirModal("ac-buy-overlay")) {
      return;
    }

    const requisicao = ++requisicaoCompra;

    carregandoCompra = true;
    produtosCompra = [];

    const lista = $("ac-buy-list");
    const confirmar = $("ac-buy-confirm");

    lista.replaceChildren(
      elemento(
        "p",
        "ac-looks-buy-loading",
        "Carregando peças do look..."
      )
    );

    $("ac-buy-error").textContent = "";
    $("ac-buy-total").textContent = moeda(0);

    confirmar.disabled = true;

    try {
      const { data, error } =
        await obterSupabase()
          .from("products")
          .select(
            "source_id,name,price,sizes,images,image_url,is_active"
          )
          .in("source_id", ids)
          .eq("is_active", true);

      if (
        requisicao !== requisicaoCompra
      ) {
        return;
      }

      if (error) throw error;

      const mapa = new Map(
        (data || []).map(produto => [
          String(produto.source_id),
          produto
        ])
      );

      const encontrados = ids.map(id =>
        mapa.get(id)
      );

      if (
        encontrados.some(
          produto => !produto
        )
      ) {
        throw new Error(
          "Uma ou mais peças deste look não estão disponíveis."
        );
      }

      if (
        modalAberto !== "ac-buy-overlay"
      ) {
        return;
      }

      produtosCompra = encontrados;

      lista.replaceChildren();

      encontrados.forEach(
        (produto, indice) => {
          lista.appendChild(
            criarItemCompra(
              produto,
              indice
            )
          );
        }
      );

      const subtotal = encontrados.reduce(
        (soma, produto) =>
          soma + moedaSegura(produto.price),
        0
      );

      $("ac-buy-total").textContent =
        moeda(subtotal);

      confirmar.disabled = false;

    } catch (erro) {
      if (
        requisicao !== requisicaoCompra
      ) {
        return;
      }

      console.error(
        "Erro ao carregar look:",
        erro
      );

      lista.replaceChildren(
        elemento(
          "p",
          "ac-looks-buy-loading",
          "Não foi possível carregar este look."
        )
      );

      $("ac-buy-error").textContent =
        erro.message || "Tente novamente.";

    } finally {
      if (
        requisicao === requisicaoCompra
      ) {
        carregandoCompra = false;
      }
    }
  }

  /* ==========================================
     15. PREPARAR ITENS PARA CARRINHO
  ========================================== */

  function prepararItensCompra() {
    const seletores = [
      ...$("ac-buy-list").querySelectorAll(
        ".ac-size-picker"
      )
    ];

    if (
      !produtosCompra.length ||
      seletores.length !== produtosCompra.length
    ) {
      throw new Error(
        "Nenhum produto disponível para compra."
      );
    }

    const itens = [];

    for (const seletor of seletores) {
      const tamanho = seletor.dataset.value;

      if (!tamanho) {
        seletor.classList.add("invalid");

        seletor.querySelector(
          ".ac-size-trigger"
        )?.focus();

        throw new Error(
          "Selecione o tamanho de todas as peças."
        );
      }

      const indice =
        Number(seletor.dataset.indice);

      const produto =
        produtosCompra[indice];

      if (!produto) {
        throw new Error(
          "Não foi possível identificar uma das peças."
        );
      }

      const preco = Number(produto.price);

      if (
        !Number.isFinite(preco) ||
        preco < 0
      ) {
        throw new Error(
          `Preço inválido para ${produto.name}.`
        );
      }

      itens.push({
        produto_id: String(
          produto.source_id
        ),
        nome: produto.name || "Produto",
        preco,
        tamanho: String(tamanho),
        quantidade: 1,
        imagem: obterImagemProduto(produto)
      });
    }

    return itens;
  }

  /* ==========================================
     16. ADICIONAR LOOK AO CARRINHO
  ========================================== */

  function confirmarCompra() {
    if (
      comprando ||
      carregandoCompra
    ) {
      return;
    }

    fecharSeletorTamanho();

    const erroEl = $("ac-buy-error");
    const botao = $("ac-buy-confirm");

    erroEl.textContent = "";

    let itens;

    try {
      itens = prepararItensCompra();

    } catch (erro) {
      erroEl.textContent = erro.message;
      return;
    }

    if (
      typeof window.adicionarCarrinho !==
      "function"
    ) {
      erroEl.textContent =
        "O carrinho principal não está carregado.";

      return;
    }

    comprando = true;

    botao.disabled = true;
    botao.textContent = "ADICIONANDO...";

    const tentativa = ++tentativaCompra;

    clearTimeout(timerCompra);

    const concluir = resultado => {
      if (
        !comprando ||
        tentativa !== tentativaCompra
      ) {
        return;
      }

      clearTimeout(timerCompra);

      document.removeEventListener(
        "armoire:look-adicionado",
        receberResultado
      );

      comprando = false;

      botao.disabled = false;
      botao.textContent =
        "ADICIONAR AO CARRINHO";

      if (!resultado.sucesso) {
        erroEl.textContent =
          resultado.erro ||
          "Não foi possível adicionar o look.";

        return;
      }

      fecharModal();

      notificar(
        "Look adicionado ao carrinho com sucesso!"
      );
    };

    const receberResultado = evento => {
      const resultado = evento.detail || {};

      if (
        resultado.tentativa !== tentativa
      ) {
        return;
      }

      concluir(resultado);
    };

    document.addEventListener(
      "armoire:look-adicionado",
      receberResultado
    );

    timerCompra = setTimeout(() => {
      concluir({
        sucesso: false,
        erro:
          "O carrinho não confirmou a operação."
      });
    }, 4000);

    try {
      document.dispatchEvent(
        new CustomEvent(
          "armoire:adicionar-look",
          {
            detail: {
              itens,
              tentativa
            }
          }
        )
      );

    } catch (erro) {
      concluir({
        sucesso: false,
        erro: erro.message
      });
    }
  }

  /* ==========================================
     17. CARD DE LOOK SALVO
  ========================================== */

  function criarCardLook(look) {
    const card = elemento(
      "article",
      "ac-look-card"
    );

    const preview = elemento(
      "div",
      "ac-look-preview"
    );

    const pecas = obterPecas(look);

    pecas.forEach(peca => {
      const endereco = imagemSegura(
        peca.imagem
      );

      if (!endereco) return;

      const imagem = elemento("img");

      imagem.src = endereco;
      imagem.alt =
        peca.nome || "Peça do look";

      imagem.loading = "lazy";

      preview.appendChild(imagem);
    });

    if (!preview.children.length) {
      preview.appendChild(
        elemento(
          "div",
          "ac-look-preview-empty",
          "Prévia indisponível"
        )
      );
    }

    /* BOTÕES */

    const acoes = elemento(
      "div",
      "ac-look-actions"
    );

    const excluir = elemento(
      "button",
      "ac-look-action ac-look-delete"
    );

    excluir.type = "button";
    excluir.title = "Excluir look";

    excluir.setAttribute(
      "aria-label",
      `Excluir ${look.nome || "look"}`
    );

    excluir.appendChild(
      criarIcone(
        "fa-solid fa-trash-can"
      )
    );

    excluir.addEventListener(
      "click",
      () => {
        confirmarExclusao(
          look,
          excluir
        );
      }
    );

    const comprar = elemento(
      "button",
      "ac-look-action ac-look-buy"
    );

    comprar.type = "button";
    comprar.title =
      "Adicionar look ao carrinho";

    comprar.setAttribute(
      "aria-label",
      `Adicionar ${look.nome || "look"} ao carrinho`
    );

    comprar.appendChild(
      criarIcone(
        "fa-solid fa-bag-shopping"
      )
    );

    comprar.addEventListener(
      "click",
      () => {
        abrirCompraLook(look);
      }
    );

    acoes.append(
      comprar,
      excluir
    );

    /* INFORMAÇÕES */

    const nome = elemento(
      "h3",
      "ac-look-name",
      look.nome || "Meu Look"
    );

    const quantidade = pecas.length;

    const detalhes = elemento(
      "p",
      "ac-look-meta",
      `${quantidade} ${
        quantidade === 1
          ? "peça"
          : "peças"
      }`
    );

    const data = formatarData(
      look.created_at
    );

    if (data) {
      detalhes.textContent +=
        ` · ${data}`;
    }

    card.append(
      preview,
      acoes,
      nome,
      detalhes
    );

    return card;
  }

  /* ==========================================
     18. CARREGAR LOOKS SALVOS
  ========================================== */

  async function carregarLooks() {
    const conteudo = $("ac-detail-content");

    if (!conteudo) return;

    const requisicao =
      ++carregamentoAtual;

    conteudo.replaceChildren(
      mensagem(
        "Carregando seus looks..."
      )
    );

    try {
      const usuario =
        await obterUsuario();

      if (
        requisicao !== carregamentoAtual
      ) {
        return;
      }

      if (!usuario) {
        conteudo.replaceChildren(
          mensagem(
            "Entre na sua conta para visualizar seus looks."
          )
        );

        return;
      }

      const { data, error } =
        await obterSupabase()
          .from("looks_salvos")
          .select(
            "id,nome,composicao,created_at"
          )
          .eq(
            "user_id",
            usuario.id
          )
          .order(
            "created_at",
            { ascending: false }
          );

      if (error) throw error;

      if (
        requisicao !== carregamentoAtual
      ) {
        return;
      }

      if (
        $("ac-account-detail")?.hidden ||
        $("ac-detail-title")
          ?.textContent
          ?.trim()
          .toLowerCase() !==
          "meu guarda-roupa"
      ) {
        return;
      }

      conteudo.replaceChildren();

      conteudo.appendChild(
        elemento(
          "p",
          "ac-looks-intro",
          "Suas combinações exclusivas, reunidas em um só lugar."
        )
      );

      const looks = data || [];

      if (!looks.length) {
        conteudo.appendChild(
          mensagem(
            "Você ainda não possui looks salvos. Explore o MY ARMOIRE e crie sua primeira combinação."
          )
        );

      } else {
        const grade = elemento(
          "div",
          "ac-looks-grid"
        );

        looks.forEach(look => {
          grade.appendChild(
            criarCardLook(look)
          );
        });

        conteudo.appendChild(grade);
      }

      const novoLook = elemento(
        "a",
        "ac-looks-new",
        "CRIAR NOVO LOOK"
      );

      novoLook.href =
        "my-armoire.html";

      conteudo.appendChild(
        novoLook
      );

    } catch (erro) {
      console.error(
        "Erro ao carregar looks:",
        erro
      );

      if (
        requisicao !== carregamentoAtual
      ) {
        return;
      }

      conteudo.replaceChildren(
        mensagem(
          "Não foi possível carregar seus looks: " +
          (erro.message || "Tente novamente."),
          true
        )
      );
    }
  }

  /* ==========================================
     19. ABRIR MEU GUARDA-ROUPA
  ========================================== */

  function abrirGuardaRoupa() {
    const botao =
      document.querySelector(
        '[data-ac-section="guarda-roupa"]'
      );

    if (!botao) {
      console.error(
        "Seção Meu Guarda-Roupa não encontrada."
      );

      return;
    }

    botao.click();
  }

  function instalarNavegacao() {
    const botao =
      document.querySelector(
        '[data-ac-section="guarda-roupa"]'
      );

    if (
      !botao ||
      botao.dataset.looksBound
    ) {
      return;
    }

    botao.dataset.looksBound = "1";

    botao.addEventListener(
      "click",
      carregarLooks
    );
  }

  /* ==========================================
     20. REDIRECIONAMENTO AUTOMÁTICO
  ========================================== */

  async function verificarRedirecionamento() {
    const url = new URL(
      window.location.href
    );

    if (
      url.searchParams.get("conta") !==
      PARAMETRO_CONTA
    ) {
      return;
    }

    try {
      const usuario =
        await obterUsuario();

      if (!usuario) return;

      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      const drawer = $("ac-drawer");

      if (!drawer) {
        throw new Error(
          "Painel Minha Conta não encontrado."
        );
      }

      const iconeUsuario =
        document.querySelector(
          "header .fa-user"
        );

      if (
        !drawer.classList.contains("open")
      ) {
        if (!iconeUsuario) {
          throw new Error(
            "Ícone de usuário não encontrado."
          );
        }

        iconeUsuario.click();
      }

      await new Promise(resolve => {
        requestAnimationFrame(resolve);
      });

      if (
        !drawer.classList.contains("open")
      ) {
        throw new Error(
          "Não foi possível abrir Minha Conta."
        );
      }

      abrirGuardaRoupa();

      url.searchParams.delete("conta");

      window.history.replaceState(
        window.history.state,
        "",
        url.pathname +
        url.search +
        url.hash
      );

    } catch (erro) {
      console.error(
        "Erro no redirecionamento:",
        erro
      );
    }
  }

  /* ==========================================
     21. INICIALIZAÇÃO
  ========================================== */

  function inicializar() {
    adicionarMyArmoire();

    instalarEstilos();

    criarModalExclusao();
    criarModalCompra();

    instalarNavegacao();

    verificarRedirecionamento();
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      inicializar,
      { once: true }
    );

  } else {
    inicializar();
  }

})();
