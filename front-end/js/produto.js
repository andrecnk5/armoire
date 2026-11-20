
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
  if (window.armoireCatalogoReady) {
    await window.armoireCatalogoReady;
  }

  const parametros = new URLSearchParams(window.location.search);
  const idProduto = parametros.get("id");

  if (
    !idProduto ||
    typeof produtos === "undefined" ||
    !produtos[idProduto]
  ) {
    console.error("Produto não encontrado:", idProduto);
    return;
  }

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

    const imagens = Array.isArray(produto.imagens)
      ? produto.imagens
      : [];

    miniaturas.replaceChildren();

    if (!imagens.length) {
      imagemPrincipal.removeAttribute("src");
      return;
    }

    imagemPrincipal.src = imagens[0];
    imagemPrincipal.alt = produto.nome;

    imagens.forEach((imagem, index) => {
      const miniatura = document.createElement("img");

      miniatura.src = imagem;
      miniatura.alt = `${produto.nome} ${index + 1}`;
      miniatura.className = index === 0 ? "ativa" : "";

      miniatura.addEventListener("click", () => {
        trocarImagem(imagem, miniatura);
      });

      miniaturas.appendChild(miniatura);
    });
  }

  let timerImagem;

  function trocarImagem(imagem, miniatura) {
    if (!imagemPrincipal) return;

    clearTimeout(timerImagem);

    imagemPrincipal.classList.remove("troca-imagem");
    void imagemPrincipal.offsetWidth;
    imagemPrincipal.classList.add("troca-imagem");

    timerImagem = setTimeout(() => {
      imagemPrincipal.src = imagem;
      imagemPrincipal.classList.remove("troca-imagem");
    }, 180);

    miniaturas.querySelectorAll("img").forEach(img => {
      img.classList.remove("ativa");
    });

    miniatura.classList.add("ativa");
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
        if (corSelecionada) {
          corSelecionada.textContent = cor.nome;
        }
      }

      botao.addEventListener("click", () => {
        coresProduto.querySelectorAll(".btn-cor").forEach(outro => {
          outro.classList.remove("ativo");
        });

        botao.classList.add("ativo");

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
      botao.textContent = tamanho;

      botao.addEventListener("click", () => {
        tamanhosProduto
          .querySelectorAll(".btn-tamanho")
          .forEach(outro => outro.classList.remove("ativo"));

        botao.classList.add("ativo");

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
    const estoque = Number(produto.estoque) || 99;

    if (quantidadeAtual < estoque) {
      quantidadeAtual++;
      atualizarQuantidade();
    }
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

    if (tamanhos.length > 1 && !tamanhoAtivo) {
      mostrarAvisoTamanho();
      return;
    }

    const tamanho = tamanhoAtivo
      ? tamanhoAtivo.textContent.trim()
      : "Único";

    if (typeof window.adicionarCarrinho !== "function") {
      console.error("adicionarCarrinho() não foi encontrada.");
      return;
    }

    btnComprar.classList.add("adicionando-carrinho");

    window.adicionarCarrinho(
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
