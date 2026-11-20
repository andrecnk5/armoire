
(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const overlay = $("ma-cart-overlay");
  const drawer = $("ma-cart-drawer");
  const itemsContainer = $("ma-cart-items");
  const totalElement = $("ma-cart-total");
  const errorElement = $("ma-cart-error");
  const confirmButton = $("ma-cart-confirm");
  const closeButton = $("ma-cart-close");

  if (!window.armoireServico?.cliente() ||
      !overlay || !drawer || !itemsContainer ||
      !totalElement || !errorElement ||
      !confirmButton || !closeButton) {
    document.addEventListener("armoire:abrir-look", () => {
      if (errorElement) errorElement.textContent = "Serviço indisponível. Tente novamente mais tarde.";
      const aviso = $("ma-status");
      if (aviso) { aviso.hidden = false; aviso.textContent = "Serviço indisponível. Tente novamente mais tarde."; }
      if (confirmButton) confirmButton.disabled = true;
    });
    console.error("MY ARMOIRE CART: dependências ausentes.");
    return;
  }

  const sb = window.armoireServico.cliente();
  const executar = window.armoireServico.executar;

  let produtosSelecionados = [];
  let carregando = false;
  let confirmando = false;
  let ultimoFoco = null;
  let requisicaoAtual = 0;
  let tentativaAtual = 0;
  let timerConfirmacao = null;
  let timerFechamento = null;
  let timerOcultar = null;
  let toastTimer = null;

  const TEMPO_LIMITE_CARRINHO = 4000;

  const moeda = valor =>
    Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  function elemento(tag, classe = "", texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function obterImagem(produto) {
    let imagens = produto.images;

    if (typeof imagens === "string") {
      try { imagens = JSON.parse(imagens); }
      catch { imagens = [imagens]; }
    }

    if (Array.isArray(imagens)) {
      const primeira = imagens.find(Boolean);
      if (typeof primeira === "string") return primeira;
      if (primeira && typeof primeira === "object") {
        return primeira.url || primeira.src || "";
      }
    }

    return produto.image_url || "";
  }

  function normalizarTamanhos(produto) {
    let tamanhos = produto.sizes;

    if (typeof tamanhos === "string") {
      try { tamanhos = JSON.parse(tamanhos); }
      catch { tamanhos = tamanhos.split(","); }
    }

    if (!Array.isArray(tamanhos)) return [];

    return [...new Set(
      tamanhos.map(item => {
        if (typeof item === "string") return item.trim();
        return String(
          item?.name || item?.size || item?.tamanho || ""
        ).trim();
      }).filter(Boolean)
    )];
  }

  function mostrarNotificacao(
    titulo,
    descricao = "",
    tipo = "sucesso"
  ) {
    let toast = $("ma-toast");

    if (!toast) {
      toast = elemento("div", "ma-toast");
      toast.id = "ma-toast";
      document.body.appendChild(toast);
    }

    clearTimeout(toastTimer);
    toast.classList.remove("ma-toast-visible");
    toast.dataset.type = tipo;
    toast.setAttribute(
      "role",
      tipo === "erro" ? "alert" : "status"
    );

    const icones = {
      sucesso: "fa-circle-check",
      erro: "fa-circle-exclamation",
      aviso: "fa-circle-info"
    };

    const icone = elemento("div", "ma-toast-icon");
    icone.appendChild(elemento(
      "i",
      `fa-solid ${icones[tipo] || icones.aviso}`
    ));

    const conteudo = elemento("div", "ma-toast-content");
    conteudo.append(
      elemento("p", "ma-toast-title", titulo),
      elemento("p", "ma-toast-description", descricao)
    );

    const fecharToast = elemento(
      "button", "ma-toast-close", "×"
    );
    fecharToast.type = "button";
    fecharToast.addEventListener("click", () => {
      clearTimeout(toastTimer);
      toast.classList.remove("ma-toast-visible");
    });

    toast.replaceChildren(icone, conteudo, fecharToast);

    requestAnimationFrame(() => {
      toast.classList.add("ma-toast-visible");
    });

    toastTimer = setTimeout(() => {
      toast.classList.remove("ma-toast-visible");
    }, 3500);
  }

  function mensagem(texto, tipo = "aviso") {
    errorElement.textContent = "";

    if (!texto) return;

    if (texto.startsWith("Carregando") ||
        texto.startsWith("Adicionando")) {
      errorElement.textContent = texto;
      return;
    }

    mostrarNotificacao(
      tipo === "erro" ? "Não foi possível concluir" : "MY ARMOIRE",
      texto,
      tipo
    );
  }

  function atualizarBotao() {
    confirmButton.disabled =
      carregando ||
      confirmando ||
      produtosSelecionados.length === 0;
  }

  function abrir() {
    clearTimeout(timerFechamento);
    clearTimeout(timerOcultar);

    if (drawer.hidden) {
      ultimoFoco = document.activeElement;
    }

    overlay.hidden = false;
    drawer.hidden = false;

    document.body.classList.add("ma-cart-open");

    requestAnimationFrame(() => {
      overlay.classList.add("ma-visible");
      drawer.classList.add("ma-visible");
    });

    window.armoireDialogos?.abrir(drawer, {
      nome: "Comprar look", fechar, escape: false, inicial: closeButton,
      origem: ultimoFoco, externos: [overlay]
    });
    closeButton.focus();
  }

  function fecharTodosSeletores(excecao = null) {
    itemsContainer.querySelectorAll(
      ".ma-size-wrapper.open"
    ).forEach(wrapper => {
      if (wrapper === excecao) return;

      wrapper.classList.remove("open");
      wrapper.querySelector(".ma-size-trigger")
        ?.setAttribute("aria-expanded", "false");
    });
  }

  function fechar() {
    if (confirmando) return;

    // Invalida qualquer consulta ainda pendente.
    requisicaoAtual++;
    carregando = false;
    atualizarBotao();

    fecharTodosSeletores();

    overlay.classList.remove("ma-visible");
    drawer.classList.remove("ma-visible");
    document.body.classList.remove("ma-cart-open");

    clearTimeout(timerOcultar);

    timerOcultar = setTimeout(() => {
      if (!drawer.classList.contains("ma-visible")) {
        overlay.hidden = true;
        drawer.hidden = true;
      }
    }, 450);

    window.armoireDialogos?.fechar(drawer);
    if (ultimoFoco?.isConnected) ultimoFoco.focus();
  }

  function criarSeletor(produto, indice) {
    const tamanhos = normalizarTamanhos(produto);

    const wrapper = elemento("div", "ma-size-wrapper");
    wrapper.dataset.indice = String(indice);

    const label = elemento("span", "ma-cart-label", "TAMANHO");
    const trigger = elemento("button", "ma-size-trigger");
    trigger.type = "button";
    trigger.setAttribute("aria-expanded", "false");

    const texto = elemento(
      "span", "ma-size-value", "Selecione o tamanho"
    );

    const seta = elemento(
      "i", "fa-solid fa-chevron-down"
    );

    trigger.append(texto, seta);

    const menu = elemento("div", "ma-size-menu");
    const inner = elemento("div", "ma-size-menu-inner");

    tamanhos.forEach(tamanho => {
      const option = elemento(
        "button", "ma-size-option", tamanho
      );
      option.type = "button";

      option.addEventListener("click", () => {
        wrapper.dataset.tamanho = tamanho;
        texto.textContent = tamanho;

        inner.querySelectorAll(".ma-size-option")
          .forEach(botao => {
            botao.classList.toggle(
              "active", botao === option
            );
          });

        fecharTodosSeletores();
        mensagem("");
        trigger.focus();
      });

      inner.appendChild(option);
    });

    menu.appendChild(inner);

    if (!tamanhos.length) {
      trigger.disabled = true;
      texto.textContent = "Tamanhos indisponíveis";
    }

    if (tamanhos.length === 1) {
      wrapper.dataset.tamanho = tamanhos[0];
      texto.textContent = tamanhos[0];
      inner.firstElementChild?.classList.add("active");
    }

    trigger.addEventListener("click", () => {
      const estavaAberto = wrapper.classList.contains("open");
      fecharTodosSeletores();

      if (!estavaAberto) {
        wrapper.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });

    wrapper.append(label, trigger, menu);
    return wrapper;
  }

  function renderizar() {
    itemsContainer.replaceChildren();

    produtosSelecionados.forEach((produto, indice) => {
      const card = elemento("article", "ma-cart-product");
      card.dataset.produtoId = String(produto.source_id);

      const imagem = elemento("img", "ma-cart-image");
      imagem.src = obterImagem(produto);
      imagem.alt = produto.name || "Produto";
      imagem.loading = "lazy";

      const info = elemento("div", "ma-cart-product-info");
      info.append(
        elemento("h3", "", produto.name || "Produto"),
        elemento("p", "ma-cart-price", moeda(produto.price)),
        criarSeletor(produto, indice)
      );

      card.append(imagem, info);
      itemsContainer.appendChild(card);
    });

    const subtotal = produtosSelecionados.reduce(
      (soma, produto) => soma + Number(produto.price || 0),
      0
    );

    totalElement.textContent = moeda(subtotal);
  }

  async function abrirComSelecao(ids) {
    if (confirmando) return;

    const unicos = [...new Set(
      (Array.isArray(ids) ? ids : [])
        .map(window.armoireServico.idProduto)
        .filter(Boolean)
    )];

    if (!unicos.length) return;

    /*
      Cada nova seleção recebe um número.
      Resultados de consultas anteriores
      não podem sobrescrever o painel.
    */
    const minhaRequisicao = ++requisicaoAtual;

    carregando = true;
    produtosSelecionados = [];

    itemsContainer.replaceChildren();
    totalElement.textContent = moeda(0);
    mensagem("Carregando peças selecionadas...");
    atualizarBotao();
    abrir();

    console.log(
      "MY ARMOIRE CART: IDs recebidos:",
      unicos
    );

    try {
      const { data, error } = await executar(sb
        .from("products")
        .select(
          "source_id,name,price,sizes,images,image_url,is_active"
        )
        .in("source_id", unicos)
        .eq("is_active", true));

      // Uma seleção mais recente tem prioridade.
      if (minhaRequisicao !== requisicaoAtual) return;

      if (error) throw error;

      if (!Array.isArray(data)) throw new Error("Resposta de produtos inválida.");
      const mapa = new Map(
        (data || []).map(produto => [
          String(produto.source_id),
          produto
        ])
      );

      const encontrados = unicos.map(id => mapa.get(id));

      if (encontrados.some(produto => !produto || produto.is_active !== true ||
          !window.armoireServico.idProduto(produto.source_id) || produto.price == null ||
          produto.price === '' || !Number.isFinite(Number(produto.price)) || Number(produto.price) < 0)) {
        throw new Error(
          "Uma ou mais peças selecionadas não estão disponíveis."
        );
      }

      produtosSelecionados = encontrados;

      console.table(produtosSelecionados.map(produto => ({
        nome: produto.name,
        source_id: String(produto.source_id)
      })));

      renderizar();
      mensagem("");

    } catch (erro) {
      if (minhaRequisicao !== requisicaoAtual) return;

      produtosSelecionados = [];
      itemsContainer.replaceChildren();
      totalElement.textContent = moeda(0);

      console.error("MY ARMOIRE CART:", erro);
      mensagem(
        erro.message || "Não foi possível carregar o look.",
        "erro"
      );
    } finally {
      if (minhaRequisicao === requisicaoAtual) {
        carregando = false;
        atualizarBotao();
      }
    }
  }

  function prepararItens() {
    const seletores = [
      ...itemsContainer.querySelectorAll(".ma-size-wrapper")
    ];

    if (!seletores.length) {
      throw new Error("Nenhum produto selecionado.");
    }

    const itens = [];

    for (const wrapper of seletores) {
      const tamanho = wrapper.dataset.tamanho;

      if (!tamanho) {
        wrapper.querySelector(".ma-size-trigger")?.focus();
        throw new Error(
          "Selecione o tamanho de todas as peças."
        );
      }

      const indice = Number(wrapper.dataset.indice);
      const produto = produtosSelecionados[indice];

      if (!produto) {
        throw new Error(
          "Não foi possível identificar uma das peças."
        );
      }

      const preco = Number(produto.price);

      if (!Number.isFinite(preco) || preco < 0) {
        throw new Error(
          `Preço inválido para ${produto.name}.`
        );
      }

      itens.push({
        produto_id: String(produto.source_id),
        nome: produto.name || "Produto",
        preco,
        tamanho: String(tamanho),
        quantidade: 1,
        imagem: obterImagem(produto)
      });
    }

    return itens;
  }

  function falhaConfirmacao(texto) {
    clearTimeout(timerConfirmacao);
    timerConfirmacao = null;
    confirmando = false;
    atualizarBotao();

    mensagem(
      texto || "Não foi possível adicionar o look.",
      "erro"
    );
  }

  function sucessoConfirmacao() {
    clearTimeout(timerConfirmacao);
    timerConfirmacao = null;

    errorElement.textContent = "";

    mostrarNotificacao(
      "Look adicionado ao carrinho!",
      "Suas peças estão disponíveis no carrinho.",
      "sucesso"
    );

    timerFechamento = setTimeout(() => {
      confirmando = false;
      atualizarBotao();
      fechar();
    }, 900);
  }

  confirmButton.addEventListener("click", () => {
    if (carregando || confirmando) return;

    let itens;

    try {
      itens = prepararItens();
    } catch (erro) {
      mensagem(erro.message, "aviso");
      return;
    }

    if (typeof window.adicionarCarrinho !== "function") {
      mensagem(
        "O carrinho principal não está carregado. Verifique js/carrinho.js.",
        "erro"
      );
      return;
    }

    confirmando = true;
    atualizarBotao();
    mensagem("Adicionando peças ao carrinho...");

    const tentativa = ++tentativaAtual;

    clearTimeout(timerConfirmacao);
    timerConfirmacao = setTimeout(() => {
      if (confirmando && tentativa === tentativaAtual) {
        falhaConfirmacao(
          "O carrinho principal não confirmou a operação."
        );
      }
    }, TEMPO_LIMITE_CARRINHO);

    try {
      document.dispatchEvent(
        new CustomEvent("armoire:adicionar-look", {
          detail: { itens, tentativa }
        })
      );
    } catch (erro) {
      falhaConfirmacao(
        "Erro ao comunicar com o carrinho: " + erro.message
      );
    }
  });

  document.addEventListener(
    "armoire:look-adicionado",
    evento => {
      if (!confirmando) return;

      const resultado = evento.detail || {};

      if (resultado.tentativa != null &&
          resultado.tentativa !== tentativaAtual) return;

      if (!resultado.sucesso) {
        falhaConfirmacao(
          resultado.erro ||
          "O carrinho não conseguiu adicionar as peças."
        );
        return;
      }

      sucessoConfirmacao();
    }
  );

  closeButton.addEventListener("click", fechar);
  overlay.addEventListener("click", fechar);

  document.addEventListener("click", evento => {
    if (!drawer.contains(evento.target)) return;

    if (!evento.target.closest(".ma-size-wrapper")) {
      fecharTodosSeletores();
    }
  });

  document.addEventListener("keydown", evento => {
    if (drawer.hidden || evento.key !== "Escape") return;

    if (itemsContainer.querySelector(".ma-size-wrapper.open")) {
      fecharTodosSeletores();
      return;
    }

    fechar();
  });

  document.addEventListener("armoire:abrir-look", evento => {
    abrirComSelecao(evento.detail?.ids || []);
  });

  console.log(
    "MY ARMOIRE: painel de finalização inicializado."
  );
})();
