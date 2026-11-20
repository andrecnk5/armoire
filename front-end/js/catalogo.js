/* ARMOIRE — listagem e filtros. Sem alterações no catálogo remoto. */
(() => {
  "use strict";
  function normalizar(texto) {
    return String(texto || "").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }
  const grupos = {
    "camisetas-polos": ["camisetas", "polos"], camisas: ["camisas"],
    "calcas-bermudas": ["calcas", "bermudas"], acessorios: ["acessorios"]
  };

  function iniciar() {
    const grade = document.querySelector(".grade-produtos");
    if (!grade || grade.dataset.catalogoInicializado === "1") return;
    grade.dataset.catalogoInicializado = "1";
    const categorias = [...document.querySelectorAll(".filtro-categoria")];
    const tamanhos = [...document.querySelectorAll(".filtro-tamanho")];
    const cores = [...document.querySelectorAll(".filtro-cor")];
    const contador = document.getElementById("contadorProdutos");
    const vazio = document.getElementById("nenhumResultado");
    const estado = document.getElementById("estadoCatalogo");
    const selecionadas = new URLSearchParams(location.search).getAll("categoria")
      .flatMap(c => grupos[c] || [normalizar(c)]);
    categorias.forEach(c => { c.checked = selecionadas.includes(c.value); });
    let versaoRenderizada = -1;

    const criar = (tag, classe, texto) => {
      const node = document.createElement(tag);
      if (classe) node.className = classe;
      if (texto != null) node.textContent = texto;
      return node;
    };
    const moeda = n => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    function filtrar() {
      const cats = categorias.filter(c => c.checked).map(c => normalizar(c.value));
      const sizes = tamanhos.filter(c => c.checked).map(c => normalizar(c.value));
      const colors = cores.filter(c => c.classList.contains("ativo")).map(c => normalizar(c.dataset.cor));
      let visiveis = 0;
      grade.querySelectorAll(".catalogo-card").forEach(card => {
        const p = produtos[card.dataset.produtoId];
        const mostrar = p &&
          (!cats.length || cats.includes(normalizar(p.tipo || p.categoria))) &&
          (!sizes.length || (p.tamanhos || []).some(s => sizes.includes(normalizar(s)))) &&
          (!colors.length || (p.cores || []).some(c => colors.includes(normalizar(c.nome || c))));
        // O card inteiro inclui o coração, sem deixar uma célula vazia na grade.
        card.style.display = mostrar ? "" : "none";
        if (mostrar) visiveis++;
      });
      if (contador) contador.textContent = `${visiveis} produto${visiveis === 1 ? " encontrado" : "s encontrados"}`;
      if (vazio) vazio.style.display = visiveis ? "none" : "flex";
    }

    function atualizarDestaques() {
      document.querySelectorAll(".mais-vendidos .produto-mini").forEach(card => {
        const id = card.dataset.produtoId || new URL(card.href, location.href).searchParams.get("id");
        const p = produtos[id];
        const unidade = card.closest(".ac-favorito-card") || card;
        unidade.style.display = p ? "" : "none";
        if (!p) return;
        const img = card.querySelector("img");
        if (img) { img.src = p.imagens?.[0] || ""; img.alt = p.nome; }
        const nome = card.querySelector("p");
        if (nome) nome.textContent = p.nome;
      });
    }

    function atualizar() {
      const info = window.armoireCatalogoEstado;
      if (!info || info.fonte === "carregando") return;
      if (versaoRenderizada !== info.versao) {
        const cards = Object.values(produtos).filter(p => p.ativo !== false).map(p => {
          const unidade = criar("div", "catalogo-card");
          unidade.dataset.produtoId = p.id;
          const card = criar("article", "produto");
          card.dataset.produtoId = p.id;
          const link = criar("a");
          link.href = `produto.html?id=${encodeURIComponent(p.id)}`;
          const img = criar("img");
          img.src = p.imagens?.[0] || ""; img.alt = p.nome; img.loading = "lazy";
          link.append(img, criar("h4", "", p.nome), criar("p", "preco", moeda(p.preco)));
          const comprar = criar("button", "", "Comprar");
          comprar.type = "button";
          comprar.addEventListener("click", () => window.abrirQuickShop?.(p.id));
          card.append(link, comprar);
          unidade.appendChild(card);
          return unidade;
        });
        grade.replaceChildren(...cards);
        versaoRenderizada = info.versao;
      }
      if (estado) estado.textContent = info.fonte === "local"
        ? "Exibindo o catálogo local. Não foi possível atualizar a coleção agora."
        : "Catálogo atualizado.";
      atualizarDestaques();
      filtrar();
      document.dispatchEvent(new CustomEvent("armoire:cards-atualizados"));
    }

    function limpar() {
      [...categorias, ...tamanhos].forEach(c => { c.checked = false; });
      cores.forEach(c => c.classList.remove("ativo"));
      const url = new URL(location.href);
      url.searchParams.delete("categoria");
      history.replaceState({}, "", url);
      filtrar();
    }
    [...categorias, ...tamanhos].forEach(c => c.addEventListener("change", filtrar));
    cores.forEach(c => c.addEventListener("click", () => { c.classList.toggle("ativo"); filtrar(); }));
    ["limparFiltros", "limparFiltrosResultado"].forEach(id => document.getElementById(id)?.addEventListener("click", limpar));
    document.getElementById("verColecaoCompleta")?.addEventListener("click", () => {
      limpar();
      document.querySelector(".catalogo")?.scrollIntoView({ behavior: "smooth" });
    });
    // Evita mostrar os cards estáticos enquanto os dados operacionais estão pendentes.
    grade.replaceChildren();
    if (contador) contador.textContent = "Carregando produtos...";
    if (vazio) vazio.style.display = "none";
    document.addEventListener("armoire:catalogo-atualizado", atualizar);
    if (window.armoireCatalogoReady) window.armoireCatalogoReady.then(atualizar);
    atualizar();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  else iniciar();
})();
