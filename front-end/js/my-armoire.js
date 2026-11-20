
(() => {
  "use strict";

  /* ==========================================
     ARMOIRE CENTRAL — MY ARMOIRE
     CONFIGURAÇÕES E SUPABASE
  ========================================== */

  const $ = id => document.getElementById(id);

  const status = $("ma-status");
  const wardrobe = $("ma-wardrobe");
  const rows = $("ma-rows");
  const feedback = $("ma-feedback");
  const resetButton = $("ma-reset");
  const saveButton = $("ma-save");
  const saveLookButton = $("ma-save-look");
  const saveFeedback = $("ma-save-feedback");

  if (
    !window.armoireServico?.cliente() ||
    !status || !wardrobe || !rows ||
    !feedback || !resetButton || !saveButton
  ) {
    if (status) {
      status.hidden = false;
      status.textContent = "Serviço indisponível. Não foi possível carregar o MY ARMOIRE.";
    }
    if (wardrobe) wardrobe.hidden = true;
    console.error("MY ARMOIRE: dependências ausentes.");
    return;
  }

  const sb = window.armoireServico.cliente();
  const executar = window.armoireServico.executar;

  /* ==========================================
     CATEGORIAS
  ========================================== */

  const categorias = [
    {
      id: "acessorios",
      titulo: "ACESSÓRIOS — CABEÇA",
      descricao: "Escolha um boné, touca ou chapéu para seu look."
    },
    {
      id: "tronco",
      titulo: "TRONCO",
      descricao: "Escolha a peça superior do seu look."
    },
    {
      id: "inferiores",
      titulo: "PARTE INFERIOR",
      descricao: "Escolha a peça inferior do seu look."
    }
  ];

  const roletas = new Map();
  const selecoes = new Map();

  let carregando = false;
  let requisicaoCarregamento = 0;
  let usuarioId = null;
  let finalizando = false;
  let salvandoLook = false;

  /* ==========================================
     FUNÇÕES AUXILIARES
  ========================================== */

  const elemento = (tag, classe = "", texto = null) => {
    const el = document.createElement(tag);

    if (classe) el.className = classe;
    if (texto !== null) el.textContent = texto;

    return el;
  };

  const obterId = produto =>
    String(produto.source_id ?? produto.id ?? "");

  const moeda = valor =>
    Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const normalizar = valor =>
    String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  function obterImagem(produto) {
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

      if (primeira && typeof primeira === "object") {
        return primeira.url || primeira.src || "";
      }
    }

    return produto.image_url || "";
  }

  function mensagem(texto, erro = false) {
    feedback.textContent = texto || "";
    feedback.hidden = !texto;
    feedback.style.color = erro ? "#a02b2b" : "";
  }

  function mensagemSalvamento(texto, tipo = "") {
    if (!saveFeedback) {
      mensagem(texto, tipo === "erro");
      return;
    }

    saveFeedback.textContent = texto || "";

    if (tipo) {
      saveFeedback.dataset.type = tipo;
    } else {
      delete saveFeedback.dataset.type;
    }
  }

  function exibirErro(texto) {
    wardrobe.hidden = true;
    status.hidden = false;
    status.textContent = texto;
  }

  function solicitarSessao() {
    usuarioId = null;
    exibirErro("Entre na sua conta para acessar o MY ARMOIRE.");
    const login = elemento("button", "ma-login", "Entrar na minha conta");
    login.type = "button";
    login.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("armoire:solicitar-login"));
    });
    status.appendChild(login);
  }

  /* ==========================================
     IDENTIFICAÇÃO DE CATEGORIAS
  ========================================== */

  function identificarCategoria(produto) {
    const categoria = normalizar(produto.category);
    const nome = normalizar(produto.name);

    const contem = (texto, termos) =>
      termos.some(termo => texto.includes(termo));

    const acessorios = [
      "acessorio", "bone", "touca", "gorro",
      "chapeu", "beanie", "headwear",
      "baseball cap", "bucket hat"
    ];

    const inferiores = [
      "inferior", "calca", "bermuda",
      "short", "saia", "jogger",
      "legging", "trousers", "pants", "bottom"
    ];

    const superiores = [
      "tronco", "superior", "camiseta",
      "camisa", "blusa", "moletom",
      "sueter", "agasalho", "jaqueta",
      "casaco", "hoodie", "sweatshirt",
      "sweater", "shirt", "tee",
      "jacket", "fleece", "top"
    ];

    if (contem(nome, acessorios)) return "acessorios";
    if (contem(nome, inferiores)) return "inferiores";

    if (contem(categoria, acessorios)) return "acessorios";
    if (contem(categoria, inferiores)) return "inferiores";

    if (
      contem(categoria, superiores) ||
      contem(nome, superiores)
    ) {
      return "tronco";
    }

    console.warn("Categoria desconhecida:", produto);
    return null;
  }

  /* ==========================================
     ESTILOS DA ROLETA
  ========================================== */

  function instalarEstilos() {
    if (document.getElementById("ma-roulette-styles")) {
      return;
    }

    const style = elemento("style");
    style.id = "ma-roulette-styles";

    style.textContent = `
      .ma-roulette-section {
        width: 100%;
        margin: 0 auto 46px;
      }

      .ma-roulette-heading {
        text-align: center;
        margin-bottom: 20px;
      }

      .ma-roulette-heading h2 {
        margin: 0 0 7px;
        color: #031638;
        font-size: 15px;
        font-weight: 600;
        letter-spacing: .22em;
      }

      .ma-roulette-heading p {
        margin: 0;
        color: #777;
        font-size: 12px;
      }

      .ma-roulette-layout {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        max-width: 1080px;
        margin: 0 auto;
      }

      .ma-roulette-track {
        display: flex;
        gap: 18px;
        overflow-x: auto;
        overflow-y: hidden;
        width: 100%;
        padding: 14px max(0px, calc((100% - 260px)/2)) 22px;
        scroll-snap-type: x mandatory;
        scroll-behavior: smooth;
        scrollbar-width: none;
        overscroll-behavior-x: contain;
        cursor: grab;
        touch-action: pan-x pan-y;
        user-select: none;
        -webkit-user-select: none;
      }

      .ma-roulette-track::-webkit-scrollbar {
        display: none;
      }

      .ma-roulette-track.ma-dragging {
        cursor: grabbing;
        scroll-snap-type: none;
        scroll-behavior: auto;
      }

      .ma-roulette-card {
        flex: 0 0 260px;
        width: 260px;
        scroll-snap-align: center;
        background: #fff;
        border: 1px solid #e7e9ee;
        padding: 13px;
        opacity: .53;
        transform: scale(.94);
        transition:
          opacity .3s ease,
          transform .3s ease,
          border-color .3s ease,
          box-shadow .3s ease;
        text-align: center;
        box-sizing: border-box;
        cursor: pointer;
      }

      .ma-roulette-card.ma-selected {
        opacity: 1;
        transform: scale(1);
        border-color: #031638;
        box-shadow: 0 8px 28px rgba(3,22,56,.09);
      }

      .ma-roulette-image {
        display: block;
        width: 100%;
        height: 235px;
        object-fit: contain;
        background: #f7f7f7;
        pointer-events: none;
      }

      .ma-roulette-name {
        margin: 14px 0 7px;
        color: #031638;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.5;
        min-height: 36px;
      }

      .ma-roulette-price {
        margin: 0;
        color: #555;
        font-size: 12px;
      }

      .ma-roulette-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 36px;
        width: 36px;
        height: 36px;
        border: 1px solid #d9dce3;
        background: white;
        color: #031638;
        cursor: pointer;
        transition:
          background .25s ease,
          color .25s ease;
      }

      .ma-roulette-arrow:hover:not(:disabled) {
        background: #031638;
        color: white;
      }

      .ma-roulette-arrow:disabled {
        opacity: .3;
        cursor: default;
      }

      .ma-roulette-empty {
        width: 100%;
        padding: 36px 20px;
        text-align: center;
        color: #777;
        font-size: 13px;
        border: 1px solid #ececec;
      }

      @media (max-width: 700px) {
        .ma-roulette-layout {
          gap: 5px;
        }

        .ma-roulette-arrow {
          flex-basis: 27px;
          width: 27px;
          height: 32px;
        }

        .ma-roulette-track {
          gap: 12px;
          padding-left: max(0px, calc((100% - 190px)/2));
          padding-right: max(0px, calc((100% - 190px)/2));
        }

        .ma-roulette-card {
          flex-basis: 190px;
          width: 190px;
          padding: 9px;
        }

        .ma-roulette-image {
          height: 180px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .ma-roulette-track {
          scroll-behavior: auto;
        }

        .ma-roulette-card {
          transition: none;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* ==========================================
     CRIAÇÃO DOS CARDS
  ========================================== */

  function criarCard(produto, categoriaId) {
    const card = elemento("article", "ma-roulette-card");

    card.dataset.produtoId = obterId(produto);
    card.dataset.categoria = categoriaId;

    const imagem = elemento("img", "ma-roulette-image");

    imagem.src = obterImagem(produto);
    imagem.alt = produto.name || "Produto";
    imagem.loading = "lazy";
    imagem.draggable = false;

    card.append(
      imagem,
      elemento(
        "h3",
        "ma-roulette-name",
        produto.name || "Produto"
      ),
      elemento(
        "p",
        "ma-roulette-price",
        moeda(produto.price)
      )
    );

    return card;
  }

  /* ==========================================
     IDENTIFICAÇÃO DO CARD CENTRAL
  ========================================== */

  function cardCentral(track) {
    const cards = [
      ...track.querySelectorAll(".ma-roulette-card")
    ];

    if (!cards.length) return null;

    const rect = track.getBoundingClientRect();
    const centro = rect.left + rect.width / 2;

    return cards.reduce((melhor, card) => {
      const r = card.getBoundingClientRect();

      const distancia = Math.abs(
        r.left + r.width / 2 - centro
      );

      if (!melhor || distancia < melhor.distancia) {
        return { card, distancia };
      }

      return melhor;
    }, null)?.card || null;
  }

  function distanciaCentro(track, card) {
    const a = track.getBoundingClientRect();
    const b = card.getBoundingClientRect();

    return (
      b.left + b.width / 2 -
      (a.left + a.width / 2)
    );
  }

  function posicaoCard(track, card) {
    const destino =
      track.scrollLeft + distanciaCentro(track, card);

    return Math.max(
      0,
      Math.min(
        track.scrollWidth - track.clientWidth,
        destino
      )
    );
  }

  /* ==========================================
     CONFIRMAÇÃO DA SELEÇÃO
  ========================================== */

  function confirmarSelecao(categoriaId, card) {
    const roleta = roletas.get(categoriaId);

    if (!roleta || !card) return false;

    const id = card.dataset.produtoId;

    const produto = roleta.produtos.find(
      p => obterId(p) === id
    );

    if (!produto) return false;

    roleta.cards.forEach(c => {
      c.classList.toggle(
        "ma-selected",
        c === card
      );
    });

    roleta.indiceConfirmado =
      roleta.cards.indexOf(card);

    roleta.indiceDestino =
      roleta.indiceConfirmado;

    selecoes.set(categoriaId, produto);

    return true;
  }

  function destacarDestino(categoriaId, card) {
    const roleta = roletas.get(categoriaId);

    if (!roleta || !card) return;

    roleta.cards.forEach(c => {
      c.classList.toggle(
        "ma-selected",
        c === card
      );
    });

    roleta.indiceDestino =
      roleta.cards.indexOf(card);

    roleta.movendo = true;
  }

  /* ==========================================
     CENTRALIZAÇÃO DA ROLETA
  ========================================== */

  function centralizar(categoriaId, card, suave = true) {
    const roleta = roletas.get(categoriaId);

    if (!roleta || !card) return;

    destacarDestino(categoriaId, card);

    roleta.programatico = true;
    roleta.versao++;

    const versao = roleta.versao;
    const destino = posicaoCard(roleta.track, card);

    roleta.track.scrollTo({
      left: destino,
      behavior: suave ? "smooth" : "auto"
    });

    iniciarMonitor(categoriaId, versao);
  }

  /* ==========================================
     MONITORAMENTO DE MOVIMENTO
  ========================================== */

  function iniciarMonitor(categoriaId, versao) {
    const roleta = roletas.get(categoriaId);

    if (!roleta) return;

    cancelAnimationFrame(roleta.raf);
    clearTimeout(roleta.timer);

    let ultimaPosicao = roleta.track.scrollLeft;
    let paradoDesde = performance.now();

    function verificar() {
      if (
        !roletas.has(categoriaId) ||
        roleta.versao !== versao
      ) {
        return;
      }

      if (roleta.arrastando) {
        roleta.raf = requestAnimationFrame(verificar);
        return;
      }

      const atual = roleta.track.scrollLeft;

      if (Math.abs(atual - ultimaPosicao) > 0.5) {
        ultimaPosicao = atual;
        paradoDesde = performance.now();
      }

      const card = cardCentral(roleta.track);

      const parado =
        performance.now() - paradoDesde > 150;

      if (parado && card) {
        const distancia = Math.abs(
          distanciaCentro(roleta.track, card)
        );

        if (distancia <= 2) {
          confirmarSelecao(categoriaId, card);

          roleta.movendo = false;
          roleta.programatico = false;

          return;
        }

        roleta.track.scrollTo({
          left: posicaoCard(roleta.track, card),
          behavior: "auto"
        });

        paradoDesde = performance.now();
      }

      roleta.raf = requestAnimationFrame(verificar);
    }

    roleta.raf = requestAnimationFrame(verificar);
  }

  /* ==========================================
     NAVEGAÇÃO PELAS SETAS
  ========================================== */

  function mover(categoriaId, direcao) {
    const roleta = roletas.get(categoriaId);

    if (!roleta) return;

    const indiceBase = roleta.programatico
      ? roleta.indiceDestino
      : roleta.cards.indexOf(
          cardCentral(roleta.track)
        );

    const indice = Math.max(
      0,
      Math.min(
        roleta.cards.length - 1,
        indiceBase + direcao
      )
    );

    centralizar(
      categoriaId,
      roleta.cards[indice]
    );
  }

  /* ==========================================
     ARRASTE COM MOUSE
  ========================================== */

  function ativarArraste(categoriaId) {
    const roleta = roletas.get(categoriaId);
    const track = roleta.track;

    let inicioX = 0;
    let inicioScroll = 0;
    let arrastou = false;
    let bloquearClick = false;

    track.addEventListener(
      "pointerdown",
      evento => {
        if (
          evento.pointerType === "touch" ||
          evento.button !== 0
        ) {
          return;
        }

        roleta.arrastando = true;
        roleta.movendo = true;
        roleta.programatico = false;
        roleta.versao++;

        inicioX = evento.clientX;
        inicioScroll = track.scrollLeft;
        arrastou = false;

        track.classList.add("ma-dragging");

        try {
          track.setPointerCapture(evento.pointerId);
        } catch {}
      }
    );

    track.addEventListener(
      "pointermove",
      evento => {
        if (!roleta.arrastando) return;

        const deslocamento =
          evento.clientX - inicioX;

        if (Math.abs(deslocamento) > 5) {
          arrastou = true;
        }

        track.scrollLeft =
          inicioScroll - deslocamento;
      }
    );

    function terminar() {
      if (!roleta.arrastando) return;

      roleta.arrastando = false;

      track.classList.remove("ma-dragging");

      bloquearClick = arrastou;

      const central = cardCentral(track);

      if (central) {
        centralizar(categoriaId, central);
      }
    }

    track.addEventListener("pointerup", terminar);
    track.addEventListener("pointercancel", terminar);
    track.addEventListener(
      "lostpointercapture",
      terminar
    );

    track.addEventListener(
      "click",
      evento => {
        if (!bloquearClick) return;

        evento.preventDefault();
        evento.stopPropagation();

        bloquearClick = false;
      },
      true
    );
  }

  /* ==========================================
     CRIAÇÃO DAS ROLETAS
  ========================================== */

  function criarRoleta(categoria, produtos) {
    const section = elemento(
      "section",
      "ma-roulette-section"
    );

    section.dataset.categoria = categoria.id;

    const heading = elemento(
      "div",
      "ma-roulette-heading"
    );

    heading.append(
      elemento("h2", "", categoria.titulo),
      elemento("p", "", categoria.descricao)
    );

    section.appendChild(heading);

    if (!produtos.length) {
      section.appendChild(
        elemento(
          "div",
          "ma-roulette-empty",
          "Nenhuma peça favorita nesta categoria."
        )
      );

      return section;
    }

    const layout = elemento(
      "div",
      "ma-roulette-layout"
    );

    const anterior = elemento(
      "button",
      "ma-roulette-arrow",
      "‹"
    );

    const proximo = elemento(
      "button",
      "ma-roulette-arrow",
      "›"
    );

    const track = elemento(
      "div",
      "ma-roulette-track"
    );

    anterior.type = "button";
    proximo.type = "button";

    anterior.disabled = produtos.length <= 1;
    proximo.disabled = produtos.length <= 1;

    anterior.setAttribute(
      "aria-label",
      "Peça anterior"
    );

    proximo.setAttribute(
      "aria-label",
      "Próxima peça"
    );

    const cards = produtos.map(produto => {
      const card = criarCard(
        produto,
        categoria.id
      );

      track.appendChild(card);

      card.addEventListener("click", () => {
        centralizar(categoria.id, card);
      });

      return card;
    });

    layout.append(
      anterior,
      track,
      proximo
    );

    section.appendChild(layout);

    roletas.set(categoria.id, {
      track,
      cards,
      produtos,
      indiceConfirmado: 0,
      indiceDestino: 0,
      programatico: false,
      arrastando: false,
      movendo: false,
      versao: 0,
      raf: null,
      timer: null
    });

    selecoes.set(
      categoria.id,
      produtos[0]
    );

    cards[0].classList.add("ma-selected");

    anterior.addEventListener(
      "click",
      () => mover(categoria.id, -1)
    );

    proximo.addEventListener(
      "click",
      () => mover(categoria.id, 1)
    );

    track.addEventListener(
      "scroll",
      () => {
        const roleta = roletas.get(
          categoria.id
        );

        if (
          !roleta ||
          roleta.arrastando ||
          roleta.programatico
        ) {
          return;
        }

        roleta.movendo = true;
        roleta.versao++;

        iniciarMonitor(
          categoria.id,
          roleta.versao
        );
      },
      { passive: true }
    );

    ativarArraste(categoria.id);

    return section;
  }

  /* ==========================================
     RENDERIZAÇÃO DO GUARDA-ROUPA
  ========================================== */

  function renderizar(produtos) {
    instalarEstilos();

    roletas.forEach(roleta => {
      cancelAnimationFrame(roleta.raf);
      clearTimeout(roleta.timer);
    });

    roletas.clear();
    selecoes.clear();

    rows.replaceChildren();

    const grupos = {
      acessorios: [],
      tronco: [],
      inferiores: []
    };

    produtos.forEach(produto => {
      const categoria =
        identificarCategoria(produto);

      if (categoria) {
        grupos[categoria].push(produto);
      }
    });

    categorias.forEach(categoria => {
      rows.appendChild(
        criarRoleta(
          categoria,
          grupos[categoria.id]
        )
      );
    });

    status.hidden = true;
    wardrobe.hidden = false;

    requestAnimationFrame(() => {
      roletas.forEach(
        (roleta, categoriaId) => {
          centralizar(
            categoriaId,
            roleta.cards[0],
            false
          );
        }
      );
    });
  }

  /* ==========================================
     CARREGAMENTO DOS FAVORITOS
  ========================================== */

  async function carregar() {
    const atual = ++requisicaoCarregamento;
    carregando = true;
    roletas.forEach(roleta => {
      cancelAnimationFrame(roleta.raf);
      clearTimeout(roleta.timer);
    });
    roletas.clear(); selecoes.clear(); rows.replaceChildren();

    wardrobe.hidden = true;
    status.hidden = false;

    status.textContent =
      "Carregando seu guarda-roupa...";

    try {
      const {
        data: auth,
        error: erroAuth
      } = await executar(sb.auth.getUser());

      if (atual !== requisicaoCarregamento) return;
      if (erroAuth && erroAuth.name !== "AuthSessionMissingError") throw erroAuth;
      usuarioId = auth?.user?.id || null;

      if (erroAuth || !auth?.user) {
        solicitarSessao();
        return;
      }

      const {
        data: favoritos,
        error: erroFavoritos
      } = await executar(sb
        .from("favoritos")
        .select("produto_id")
        .eq("usuario_id", auth.user.id));

      if (atual !== requisicaoCarregamento) return;
      if (erroFavoritos) {
        throw erroFavoritos;
      }

      if (!Array.isArray(favoritos)) throw new Error("Resposta de favoritos inválida.");
      const ids = [
        ...new Set(
          (favoritos || [])
            .map(f =>
              String(f.produto_id || "")
            )
            .filter(Boolean)
        )
      ];

      if (!ids.length) {
        exibirErro(
          "Seu guarda-roupa está vazio. Favorite peças do catálogo."
        );

        return;
      }

      const {
        data: produtos,
        error: erroProdutos
      } = await executar(sb
        .from("products")
        .select(
          "source_id,name,category,price,images,image_url,is_active"
        )
        .in("source_id", ids)
        .eq("is_active", true));

      if (atual !== requisicaoCarregamento) return;
      if (erroProdutos) {
        throw erroProdutos;
      }

      if (!Array.isArray(produtos)) throw new Error("Resposta de produtos inválida.");
      const mapa = new Map(
        (produtos || []).map(p => [
          obterId(p),
          p
        ])
      );

      const ordenados = ids
        .map(id => mapa.get(id))
        .filter(Boolean);

      if (!ordenados.length) {
        exibirErro(
          "Nenhuma peça favorita está disponível."
        );

        return;
      }

      if (ordenados.some(p => !window.armoireServico.idProduto(p.source_id) ||
          p.is_active !== true || typeof p.name !== 'string' || !p.name.trim() ||
          p.price == null || p.price === '' || !Number.isFinite(Number(p.price)) || Number(p.price) < 0)) {
        throw new Error("Há uma peça com dados inválidos no guarda-roupa.");
      }
      renderizar(ordenados);

    } catch (erro) {
      if (atual !== requisicaoCarregamento) return;
      console.error(
        "MY ARMOIRE:",
        erro
      );

      exibirErro(
        "Não foi possível carregar o guarda-roupa: " +
        erro.message
      );

    } finally {
      if (atual === requisicaoCarregamento) carregando = false;
    }
  }

  /* ==========================================
     REINICIAR SELEÇÕES
  ========================================== */

  resetButton.addEventListener(
    "click",
    () => {
      if (finalizando || salvandoLook) {
        return;
      }

      roletas.forEach(
        (roleta, categoriaId) => {
          centralizar(
            categoriaId,
            roleta.cards[0]
          );
        }
      );

      mensagem("Seleções redefinidas.");
    }
  );

  /* ==========================================
     ESTABILIZAÇÃO DAS ROLETAS

     Garante que a peça registrada seja
     aquela realmente centralizada.
  ========================================== */

  function esperar(ms) {
    return new Promise(
      resolve => setTimeout(resolve, ms)
    );
  }

  async function estabilizar(categoriaId) {
    const roleta = roletas.get(categoriaId);

    if (!roleta) return null;

    const inicio = performance.now();

    let anterior = roleta.track.scrollLeft;
    let paradoDesde = performance.now();

    while (
      performance.now() - inicio < 6000
    ) {
      if (roleta.arrastando) {
        return null;
      }

      await esperar(40);

      const atual = roleta.track.scrollLeft;

      if (
        Math.abs(atual - anterior) > 0.5
      ) {
        anterior = atual;
        paradoDesde = performance.now();

        continue;
      }

      if (
        performance.now() - paradoDesde < 180
      ) {
        continue;
      }

      const central = cardCentral(
        roleta.track
      );

      if (!central) return null;

      const distancia = Math.abs(
        distanciaCentro(
          roleta.track,
          central
        )
      );

      if (distancia > 2) {
        roleta.track.scrollTo({
          left: posicaoCard(
            roleta.track,
            central
          ),
          behavior: "auto"
        });

        anterior = roleta.track.scrollLeft;
        paradoDesde = performance.now();

        continue;
      }

      confirmarSelecao(
        categoriaId,
        central
      );

      roleta.programatico = false;
      roleta.movendo = false;

      return selecoes.get(categoriaId);
    }

    return null;
  }

  /* ==========================================
     ADICIONAR LOOK AO CARRINHO

     Mantém a integração existente com
     my-armoire-cart.js.
  ========================================== */

  saveButton.addEventListener(
    "click",
    async () => {
      if (finalizando || salvandoLook) {
        return;
      }

      finalizando = true;
      saveButton.disabled = true;

      mensagem("");

      try {
        const resultados = await Promise.all(
          categorias
            .filter(c =>
              roletas.has(c.id)
            )
            .map(async c => ({
              categoria: c.id,
              produto: await estabilizar(c.id)
            }))
        );

        if (
          resultados.some(
            r => !r.produto
          )
        ) {
          mensagem(
            "Aguarde as peças pararem e tente finalizar novamente.",
            true
          );

          return;
        }

        if (!Array.isArray(favoritos)) throw new Error("Resposta de favoritos inválida.");
      const ids = [
          ...new Set(
            resultados.map(
              r => obterId(r.produto)
            )
          )
        ];

        console.table(
          resultados.map(r => ({
            categoria: r.categoria,
            nome: r.produto.name,
            source_id: obterId(r.produto)
          }))
        );

        if (!ids.length) {
          mensagem(
            "Selecione pelo menos uma peça.",
            true
          );

          return;
        }

        document.dispatchEvent(
          new CustomEvent(
            "armoire:abrir-look",
            {
              detail: { ids }
            }
          )
        );

      } catch (erro) {
        console.error(
          "Erro ao finalizar look:",
          erro
        );

        mensagem(
          "Não foi possível finalizar o look.",
          true
        );

      } finally {
        finalizando = false;
        saveButton.disabled = false;
      }
    }
  );

  /* ==========================================
     SALVAR LOOK NO SUPABASE

     TABELA: public.looks_salvos

     CAMPOS:
     - user_id
     - nome
     - composicao

     A composição será armazenada como JSONB.
  ========================================== */

  async function obterComposicaoAtual() {
    const categoriasAtivas = categorias.filter(
      categoria => roletas.has(categoria.id)
    );

    if (!categoriasAtivas.length) {
      throw new Error(
        "Favorite peças no catálogo antes de salvar um look."
      );
    }

    const resultados = await Promise.all(
      categoriasAtivas.map(
        async categoria => ({
          categoria: categoria.id,
          produto: await estabilizar(
            categoria.id
          )
        })
      )
    );

    if (
      resultados.some(
        resultado => !resultado.produto
      )
    ) {
      throw new Error(
        "Aguarde as peças pararem e tente salvar novamente."
      );
    }

    if (resultados.some(({ produto }) => !window.armoireServico.idProduto(produto.source_id) ||
        produto.price == null || produto.price === '' || !Number.isFinite(Number(produto.price)) || Number(produto.price) < 0)) {
      throw new Error("Uma peça selecionada tem dados inválidos. Recarregue o guarda-roupa.");
    }
    const pecas = resultados.map(
      ({ categoria, produto }) => ({
        categoria: categoria,
        produto_id: obterId(produto),
        nome: produto.name || "Produto",
        imagem: obterImagem(produto),
        preco: Number(produto.price || 0),
        categoria_original:
          produto.category || ""
      })
    );

    return {
      versao: 1,
      pecas
    };
  }

  /* ==========================================
     EXECUTAR SALVAMENTO
  ========================================== */

  async function salvarLook() {
    if (
      carregando || salvandoLook ||
      finalizando
    ) {
      return;
    }

    const atual = requisicaoCarregamento;
    salvandoLook = true;

    if (saveLookButton) {
      saveLookButton.disabled = true;
    }

    mensagemSalvamento(
      "Preparando seu look..."
    );

    try {
      /* IDENTIFICAR CLIENTE */

      const {
        data: auth,
        error: erroAuth
      } = await executar(sb.auth.getUser());

      if (erroAuth) {
        throw erroAuth;
      }

      if (!auth?.user) {
        throw new Error(
          "Entre na sua conta para salvar seus looks."
        );
      }

      /* OBTER PEÇAS SELECIONADAS */

      const composicao =
        await obterComposicaoAtual();

      if (atual !== requisicaoCarregamento || usuarioId !== auth.user.id) {
        throw new Error("Sua conta mudou. Confira o guarda-roupa antes de salvar.");
      }
      const total =
        composicao.pecas.length;

      if (!total) {
        throw new Error(
          "Selecione pelo menos uma peça antes de salvar."
        );
      }

      /* DEFINIR NOME DO LOOK */

      const dataAtual =
        new Date().toLocaleDateString(
          "pt-BR"
        );

      const nome =
        `Meu Look — ${dataAtual}`;

      /* ENVIAR AO SUPABASE */

      mensagemSalvamento(
        "Salvando seu look..."
      );

      const {
        error: erroSalvar
      } = await executar(sb
        .from("looks_salvos")
        .insert({
          user_id: auth.user.id,
          nome: nome,
          composicao: composicao
        }), true);

      if (erroSalvar) {
        throw erroSalvar;
      }

      if (atual !== requisicaoCarregamento) return;
      /* CONFIRMAÇÃO */

      mensagemSalvamento(
        `Look salvo com sucesso (${total} ${
          total === 1 ? "peça" : "peças"
        })!`,
        "sucesso"
      );

      /* REDIRECIONAMENTO

         Endereço provisório.
         Será ajustado conforme a estrutura
         real da página Minha Conta.
      */

     window.location.assign(
  "./produtos.html?conta=meu-guarda-roupa"
);

    } catch (erro) {
      console.error(
        "MY ARMOIRE: erro ao salvar look:",
        erro
      );

      mensagemSalvamento(
        erro?.message ||
        "Não foi possível salvar seu look. Tente novamente.",
        "erro"
      );

    } finally {
      salvandoLook = false;

      if (saveLookButton) {
        saveLookButton.disabled = false;
      }
    }
  }

  /* ==========================================
     ATIVAR BOTÃO SALVAR LOOK
  ========================================== */

  if (saveLookButton) {
    saveLookButton.addEventListener(
      "click",
      salvarLook
    );
  }

  /* ==========================================
     INICIALIZAÇÃO
  ========================================== */

  sb.auth.onAuthStateChange((_evento, sessao) => {
    if (usuarioId === (sessao?.user?.id || null)) return;
    usuarioId = sessao?.user?.id || null;
    requisicaoCarregamento++;
    carregando = false;
    roletas.forEach(roleta => { cancelAnimationFrame(roleta.raf); clearTimeout(roleta.timer); });
    roletas.clear(); selecoes.clear(); rows.replaceChildren();
    mensagemSalvamento('');
    if (usuarioId) {
      exibirErro("Carregando seu guarda-roupa...");
      setTimeout(carregar, 0);
    } else solicitarSessao();
  });
  carregar();

})();
