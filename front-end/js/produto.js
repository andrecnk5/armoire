
/* =========================================================
   ARMOIRE CENTRAL — PRODUTO.JS
   Página individual + menu padrão da home
========================================================= */

/* MENU HAMBÚRGUER
   Independente do carregamento do catálogo.
*/
document.addEventListener("DOMContentLoaded", () => {
  const abrir = document.getElementById("abrirMenu");
  const fechar = document.getElementById("fecharMenu");
  const menu = document.getElementById("menuLateral");
  const overlay = document.getElementById("overlayMenu");

  if (!abrir || !fechar || !menu || !overlay) return;

  function alternarMenu(aberto) {
    menu.classList.toggle("aberto", aberto);
    overlay.classList.toggle("ativo", aberto);
    document.body.classList.toggle("menu-aberto", aberto);

    menu.setAttribute("aria-hidden", String(!aberto));
    overlay.setAttribute("aria-hidden", String(!aberto));
    abrir.setAttribute("aria-expanded", String(aberto));
    if (aberto) window.armoireDialogos?.abrir(menu, {
      nome: "Menu principal", fechar: () => alternarMenu(false), inicial: fechar,
      origem: abrir, externos: [overlay]
    });
    else window.armoireDialogos?.fechar(menu);
  }

  abrir.addEventListener("click", () => alternarMenu(true));
  fechar.addEventListener("click", () => alternarMenu(false));
  overlay.addEventListener("click", () => alternarMenu(false));

  document.addEventListener("keydown", evento => {
    if (
      evento.key === "Escape" &&
      menu.classList.contains("aberto")
    ) {
      alternarMenu(false);
      abrir.focus();
    }
  });

  menu.querySelectorAll(".menu-links a").forEach(link => {
    link.addEventListener("click", () => alternarMenu(false));
  });
});

/* =========================================================
   DADOS DO PRODUTO
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const painelEstado = document.getElementById("estadoProduto");
  const tituloEstado = document.getElementById("tituloEstadoProduto");
  const descricaoEstado = document.getElementById("descricaoEstadoProduto");
  const conteudoProduto = document.querySelector(".produto-container");
  const relacionados = document.querySelector(".produtos-relacionados");
  const parametros = new URLSearchParams(window.location.search);
  const idProduto = parametros.get("id")?.trim();

  function produtoNaoEncontrado() {
    document.title = "Produto não encontrado | Armoire Central";
    if (tituloEstado) tituloEstado.textContent = "Produto não encontrado";
    if (descricaoEstado) descricaoEstado.textContent = window.armoireCatalogoEstado?.fonte === "local" && idProduto
      ? "Não foi possível confirmar esta peça no catálogo local. Tente novamente ou explore os produtos disponíveis."
      : "Esta peça não está disponível na coleção atual. Explore os produtos do catálogo.";
    if (painelEstado) painelEstado.hidden = false;
    if (conteudoProduto) conteudoProduto.hidden = true;
    if (relacionados) relacionados.hidden = true;
    const comprar = document.getElementById("btnComprar");
    if (comprar) comprar.disabled = true;
  }

  // Sem ID, o retorno ao catálogo aparece imediatamente, mesmo com rede lenta.
  if (!idProduto) { produtoNaoEncontrado(); return; }
  if (window.armoireCatalogoReady) await window.armoireCatalogoReady;
  if (typeof produtos === "undefined" ||
      !Object.prototype.hasOwnProperty.call(produtos, idProduto) ||
      !produtos[idProduto] || produtos[idProduto].ativo === false) {
    produtoNaoEncontrado();
    return;
  }
  const avisoCatalogo = document.getElementById("avisoCatalogoProduto");
  if (avisoCatalogo) avisoCatalogo.hidden = window.armoireCatalogoEstado?.fonte !== "local";
  if (painelEstado) painelEstado.hidden = true;
  if (conteudoProduto) conteudoProduto.hidden = false;
  if (relacionados) relacionados.hidden = false;

  const produto = produtos[idProduto];

  const $ = id => document.getElementById(id);

  const marcaProduto = $("marcaProduto");
  const nomeProduto = $("nomeProduto");
  const breadcrumbProduto = $("breadcrumbProduto");
  const precoProduto = $("precoProduto");
  const parcelamentoProduto = $("parcelamentoProduto");
  const imagemPrincipal = $("imagemPrincipal");
  const miniaturas = $("miniaturas");
  const coresProduto = $("coresProduto");
  const corSelecionada = $("corSelecionada");
  const tamanhosProduto = $("tamanhosProduto");
  const tamanhoSelecionado = $("tamanhoSelecionado");
  const quantidadeProduto = $("quantidadeProduto");
  const descricaoProduto = $("descricaoProduto");
  const composicaoProduto = $("composicaoProduto");
  const produtosRelacionados = $("produtosRelacionados");
  const btnComprar = $("btnComprar");
  const diminuirQuantidade = $("diminuirQuantidade");
  const aumentarQuantidade = $("aumentarQuantidade");

  function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  /* INFORMAÇÕES */

  function carregarInformacoes() {
    if (marcaProduto) {
      marcaProduto.textContent =
        produto.marca || "ARMOIRE CENTRAL";
    }

    if (nomeProduto) {
      nomeProduto.textContent = produto.nome || "Produto";
    }

    if (breadcrumbProduto) {
      breadcrumbProduto.textContent = produto.nome || "Produto";
    }

    if (precoProduto) {
      precoProduto.textContent = formatarPreco(produto.preco);
    }

    if (parcelamentoProduto) {
      parcelamentoProduto.textContent = produto.parcelamento || "";
    }

    if (descricaoProduto) {
      descricaoProduto.textContent = produto.descricao || "";
    }

    document.title = `${produto.nome} | Armoire Central`;
  }

  carregarInformacoes();

  /* GALERIA */

  function carregarGaleria() {
    if (!imagemPrincipal || !miniaturas) return;
    const aviso = $("estadoImagem");
    // O fallback pertence ao mesmo produto e usa a galeria local já verificada.
    const locais = window.armoireCatalogoLocal?.[idProduto]?.imagens || [];
    const imagens = [...new Set([
      ...(Array.isArray(produto.imagens) ? produto.imagens : []), ...locais
    ])].filter(imagem => typeof imagem === "string" && imagem.trim());
    const falhas = new Set();
    let timerImagem;
    miniaturas.replaceChildren();
    imagemPrincipal.alt = produto.nome;

    function exibir(imagem, animar = false) {
      clearTimeout(timerImagem);
      if (!imagem || falhas.has(imagem)) return;
      imagemPrincipal.hidden = false;
      if (aviso) aviso.hidden = true;
      miniaturas.querySelectorAll("img").forEach(miniatura => {
        const selecionada = miniatura.dataset.imagem === imagem;
        miniatura.classList.toggle("ativa", selecionada);
        miniatura.closest("button")?.setAttribute("aria-pressed", String(selecionada));
      });
      if (animar) {
        imagemPrincipal.classList.add("troca-imagem");
        timerImagem = setTimeout(() => {
          imagemPrincipal.src = imagem;
          imagemPrincipal.classList.remove("troca-imagem");
        }, 180);
      } else {
        imagemPrincipal.src = imagem;
        imagemPrincipal.classList.remove("troca-imagem");
      }
    }

    function indisponivel() {
      clearTimeout(timerImagem);
      imagemPrincipal.removeAttribute("src");
      imagemPrincipal.hidden = true;
      if (aviso) aviso.hidden = false;
    }

    function falhou(imagem) {
      falhas.add(imagem);
      miniaturas.querySelectorAll("img").forEach(miniatura => {
        if (miniatura.dataset.imagem === imagem) {
          miniatura.hidden = true;
          const botao = miniatura.closest("button");
          if (botao) botao.hidden = true;
        }
      });
      if (imagemPrincipal.getAttribute("src") === imagem) {
        const proxima = imagens.find(item => !falhas.has(item));
        if (proxima) exibir(proxima);
        else indisponivel();
      }
    }
    imagemPrincipal.addEventListener("error", () => falhou(imagemPrincipal.getAttribute("src")));
    imagens.forEach((imagem, index) => {
      const miniatura = document.createElement("img");
      miniatura.dataset.imagem = imagem;
      miniatura.alt = `${produto.nome} ${index + 1}`;
      miniatura.addEventListener("error", () => falhou(imagem));
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "miniatura-botao";
      botao.setAttribute("aria-label", `Ver imagem ${index + 1} de ${produto.nome}`);
      botao.setAttribute("aria-pressed", "false");
      botao.addEventListener("click", () => exibir(imagem, true));
      miniatura.src = imagem;
      botao.appendChild(miniatura);
      miniaturas.appendChild(botao);
    });
    if (imagens.length) exibir(imagens[0]);
    else indisponivel();
  }

  carregarGaleria();

  /* CORES */

  function carregarCores() {
    if (!coresProduto) return;

    coresProduto.replaceChildren();

    const cores = Array.isArray(produto.cores)
      ? produto.cores
      : [];

    cores.forEach((cor, index) => {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "btn-cor";
      botao.setAttribute("aria-pressed", String(index === 0));
      botao.setAttribute("aria-label", cor.nome);
      botao.style.setProperty(
        "--cor-produto",
        cor.codigo || "#111"
      );

      const nome = document.createElement("span");
      nome.className = "nome-cor";
      nome.textContent = cor.nome;
      botao.appendChild(nome);

      if (index === 0) {
        botao.classList.add("ativo");
        botao.setAttribute("aria-pressed", "true");
        if (corSelecionada) {
          corSelecionada.textContent = cor.nome;
        }
      }

      botao.addEventListener("click", () => {
        coresProduto.querySelectorAll(".btn-cor").forEach(outro => {
          outro.classList.remove("ativo");
          outro.setAttribute("aria-pressed", "false");
        });

        botao.classList.add("ativo");
        botao.setAttribute("aria-pressed", "true");

        if (corSelecionada) {
          corSelecionada.textContent = cor.nome;
        }
      });

      coresProduto.appendChild(botao);
    });
  }

  carregarCores();

  /* TAMANHOS */

  function carregarTamanhos() {
    if (!tamanhosProduto) return;

    tamanhosProduto.replaceChildren();

    const tamanhos = Array.isArray(produto.tamanhos)
      ? produto.tamanhos
      : [];

    tamanhos.forEach(tamanho => {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "btn-tamanho";
      botao.setAttribute("aria-pressed", "false");
      botao.textContent = tamanho;

      botao.addEventListener("click", () => {
        tamanhosProduto
          .querySelectorAll(".btn-tamanho")
          .forEach(outro => {
            outro.classList.remove("ativo");
            outro.setAttribute("aria-pressed", "false");
          });

        botao.classList.add("ativo");
        botao.setAttribute("aria-pressed", "true");

        if (tamanhoSelecionado) {
          tamanhoSelecionado.textContent = tamanho;
        }
      });

      tamanhosProduto.appendChild(botao);
    });

    if (
      tamanhos.length === 1 &&
      String(tamanhos[0]).toLowerCase() === "único"
    ) {
      const unico = tamanhosProduto.querySelector(".btn-tamanho");

      unico?.classList.add("ativo");
      unico?.setAttribute("aria-pressed", "true");

      if (tamanhoSelecionado) {
        tamanhoSelecionado.textContent = "Único";
      }
    }
  }

  carregarTamanhos();

  /* COMPOSIÇÃO */

  function carregarComposicao() {
    if (!composicaoProduto) return;

    composicaoProduto.replaceChildren();

    const composicao = Array.isArray(produto.composicao)
      ? produto.composicao
      : [];

    composicao.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      composicaoProduto.appendChild(li);
    });
  }

  carregarComposicao();

  /* QUANTIDADE */

  let quantidadeAtual = 1;

  function atualizarQuantidade() {
    if (quantidadeProduto) {
      quantidadeProduto.textContent = quantidadeAtual;
    }
  }

  diminuirQuantidade?.addEventListener("click", () => {
    if (quantidadeAtual > 1) {
      quantidadeAtual--;
      atualizarQuantidade();
    }
  });

  aumentarQuantidade?.addEventListener("click", () => {
    const erro = window.validarEstoqueCarrinho(produto.id, quantidadeAtual + 1);
    if (erro) {
      mostrarToast(erro);
      return;
    }
    quantidadeAtual++;
    atualizarQuantidade();
  });

  atualizarQuantidade();

  /* ADICIONAR AO CARRINHO */

  btnComprar?.addEventListener("click", () => {
    const tamanhos = Array.isArray(produto.tamanhos)
      ? produto.tamanhos
      : [];

    const tamanhoAtivo = tamanhosProduto?.querySelector(
      ".btn-tamanho.ativo"
    );

    if (tamanhos.length !== 1 && !tamanhoAtivo) {
      mostrarAvisoTamanho();
      return;
    }

    const tamanho = tamanhoAtivo
      ? tamanhoAtivo.textContent.trim()
      : tamanhos[0];

    if (typeof window.adicionarCarrinho !== "function") {
      console.error("adicionarCarrinho() não foi encontrada.");
      return;
    }

    const adicionado = window.adicionarCarrinho(
      produto.id,
      quantidadeAtual,
      tamanho,
      {
        nome: produto.nome,
        preco: produto.preco,
        imagem: produto.imagens?.[0] || "",
        categoria: produto.categoria || ""
      }
    );

    if (!adicionado) return;
    btnComprar.classList.add("adicionando-carrinho");

    localStorage.setItem(
      "ultimoTamanhoProduto",
      JSON.stringify({
        id: produto.id,
        tamanho
      })
    );

    setTimeout(() => {
      btnComprar.classList.remove("adicionando-carrinho");
    }, 450);
  });

  /* AVISO DE TAMANHO */

  function mostrarAvisoTamanho() {
    const toast = $("toastCarrinho");

    if (toast) {
      const texto = toast.querySelector("span, p, strong");

      if (texto) {
        texto.textContent = "Escolha o Tamanho Desejado";
      }

      toast.classList.add("mostrar");

      clearTimeout(window.__timerTamanho);

      window.__timerTamanho = setTimeout(() => {
        toast.classList.remove("mostrar");
      }, 2500);
    } else {
      alert("Escolha o Tamanho Desejado");
    }

    if (tamanhosProduto) {
      tamanhosProduto.classList.add("tamanho-obrigatorio");

      setTimeout(() => {
        tamanhosProduto.classList.remove("tamanho-obrigatorio");
      }, 800);
    }
  }

  /* PRODUTOS RELACIONADOS */

  function carregarRelacionados() {
    if (!produtosRelacionados) return;

    produtosRelacionados.replaceChildren();

    const relacionados = Object.values(produtos)
      .filter(item => item && item.id !== produto.id)
      .filter(item => {
        if (
          produto.tipo &&
          item.tipo &&
          produto.tipo === item.tipo
        ) {
          return true;
        }

        if (
          produto.categoria &&
          item.categoria &&
          produto.categoria === item.categoria
        ) {
          return true;
        }

        return false;
      })
      .slice(0, 4);

    relacionados.forEach(item => {
      const card = document.createElement("article");
      card.className = "produto-relacionado";

      const linkImagem = document.createElement("a");
      linkImagem.className = "imagem-relacionado";
      linkImagem.href = `produto.html?id=${encodeURIComponent(item.id)}`;

      const imagem = document.createElement("img");
      imagem.src = item.imagens?.[0] || "";
      imagem.alt = item.nome || "Produto";
      imagem.loading = "lazy";

      linkImagem.appendChild(imagem);

      const info = document.createElement("div");
      info.className = "info-relacionado";

      const categoria = document.createElement("span");
      categoria.className = "categoria-relacionado";
      categoria.textContent = item.categoria || "";

      const nome = document.createElement("h4");
      nome.textContent = item.nome || "";

      const preco = document.createElement("p");
      preco.className = "preco";
      preco.textContent = formatarPreco(item.preco);

      const linkComprar = document.createElement("a");
      linkComprar.className = "comprar-relacionado";
      linkComprar.href = linkImagem.href;
      linkComprar.textContent = "VER PRODUTO";

      info.append(categoria, nome, preco, linkComprar);
      card.append(linkImagem, info);
      produtosRelacionados.appendChild(card);
    });
  }

  carregarRelacionados();

  /* ANIMAÇÕES DE ENTRADA */

  const elementosAnimados = document.querySelectorAll(
    ".produto-container, " +
    ".produto-galeria, " +
    ".produto-info, " +
    ".produtos-relacionados, " +
    ".newsletter"
  );

  elementosAnimados.forEach((elemento, index) => {
    elemento.classList.add("produto-animar");

    setTimeout(() => {
      elemento.classList.add("visivel");
    }, 80 + index * 100);
  });

  console.log(
    "Produto carregado:",
    produto.nome,
    "| ID:",
    produto.id
  );
});
