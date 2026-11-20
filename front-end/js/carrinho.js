
/* ==========================================
   ARMOIRE CENTRAL
   CARRINHO PREMIUM — CATÁLOGO + MY ARMOIRE
   ========================================== */

let carrinho = [];

try {
  const dados = JSON.parse(localStorage.getItem("carrinho") || "[]");
  carrinho = Array.isArray(dados) ? dados : [];
} catch (erro) {
  console.error("Erro ao ler carrinho:", erro);
  carrinho = [];
}

/* ELEMENTOS */

const painelCarrinho = document.getElementById("carrinho");
const overlayCarrinho = document.getElementById("overlayCarrinho");
const abrirCarrinho = document.getElementById("abrirCarrinho");
const fecharCarrinho = document.getElementById("fecharCarrinho");
const listaCarrinho = document.getElementById("listaCarrinho");
const totalCarrinho = document.getElementById("totalCarrinho");
const contadorCarrinho = document.querySelector(".contador-carrinho");
const toast = document.getElementById("toastCarrinho");

let timerToast;

/* ESTILOS PREMIUM */

function instalarEstilosCarrinho() {
  if (document.getElementById("armoire-cart-premium-css")) return;

  const estilo = document.createElement("style");
  estilo.id = "armoire-cart-premium-css";

  estilo.textContent = `
    #carrinho {
      --ac-navy: #031638;
      --ac-muted: #737985;
      --ac-line: #e9ebef;
      background: #fff;
      color: var(--ac-navy);
      width: min(440px, 100vw);
      max-width: 100vw;
      box-sizing: border-box;
      box-shadow: -18px 0 60px rgba(3,22,56,.12);
      font-family: inherit;
    }

    #carrinho * {
      box-sizing: border-box;
    }

    #carrinho #listaCarrinho {
      padding: 10px 23px 24px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #d8dce5 transparent;
    }

    #carrinho .item-carrinho {
      display: grid;
      grid-template-columns: 110px minmax(0,1fr);
      align-items: start;
      gap: 18px;
      padding: 24px 0;
      margin: 0;
      border: 0;
      border-bottom: 1px solid var(--ac-line);
      background: transparent;
      box-shadow: none;
      width: 100%;
      min-width: 0;
      animation: ac-cart-enter .25s ease both;
    }

    #carrinho .imagem-item {
      width: 110px;
      height: 142px;
      min-width: 0;
      overflow: hidden;
      background: #f6f6f5;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 2px;
    }

    #carrinho .imagem-item img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      mix-blend-mode: multiply;
    }

    #carrinho .dados-item {
      min-width: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0;
      padding: 1px 0 0;
      margin: 0;
    }

    #carrinho .dados-item h4 {
      font-size: 14px;
      line-height: 1.45;
      font-weight: 600;
      letter-spacing: .015em;
      color: var(--ac-navy);
      margin: 0 0 7px;
      overflow-wrap: anywhere;
    }

    #carrinho .dados-item .categoria {
      font-size: 10px;
      line-height: 1.5;
      color: #8b909a;
      text-transform: uppercase;
      letter-spacing: .12em;
      margin: 0 0 4px;
      order: -1;
    }

    #carrinho .dados-item .categoria:empty {
      display: none;
    }

    #carrinho .dados-item .tamanho-item {
      font-size: 12px;
      line-height: 1.5;
      color: var(--ac-muted);
      margin: 0 0 9px;
    }

    #carrinho .dados-item .preco {
      font-size: 14px;
      font-weight: 650;
      letter-spacing: .01em;
      color: var(--ac-navy);
      margin: 0 0 15px;
    }

    #carrinho .acoes-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      width: 100%;
      margin: 0;
    }

    #carrinho .controle-qtd {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      width: 108px;
      height: 36px;
      border: 1px solid #dfe2e8;
      background: #fff;
      border-radius: 2px;
      padding: 0;
      margin: 0;
      overflow: hidden;
    }

    #carrinho .controle-qtd button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      min-width: 34px;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--ac-navy);
      font-size: 18px;
      font-weight: 400;
      line-height: 1;
      cursor: pointer;
      transition: background .2s ease;
    }

    #carrinho .controle-qtd button:hover {
      background: #f1f3f6;
    }

    #carrinho .controle-qtd span {
      flex: 1;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      color: var(--ac-navy);
    }

    #carrinho .btn-remover {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 6px 0;
      border: 0;
      background: transparent;
      color: #8b909a;
      font-size: 11px;
      letter-spacing: .02em;
      cursor: pointer;
      text-decoration: none;
      transition: color .2s ease;
    }

    #carrinho .btn-remover:hover {
      color: #a33030;
    }

    #carrinho .btn-remover svg {
      width: 14px;
      height: 14px;
      flex: none;
    }

    #carrinho #totalCarrinho {
      color: var(--ac-navy);
      font-size: 17px;
      font-weight: 700;
      letter-spacing: .015em;
    }

    #carrinho .btn-finalizar {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 52px;
      width: 100%;
      background: var(--ac-navy);
      color: white;
      border: 1px solid var(--ac-navy);
      border-radius: 2px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .15em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background .2s ease, transform .2s ease;
    }

    #carrinho .btn-finalizar:hover {
      background: #102d5b;
      transform: translateY(-1px);
    }

    #carrinho .carrinho-vazio {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 270px;
      padding: 40px 12px;
      color: var(--ac-muted);
    }

    #carrinho .carrinho-vazio i {
      color: var(--ac-navy);
      font-size: 34px;
      margin-bottom: 20px;
    }

    #carrinho .carrinho-vazio h3 {
      color: var(--ac-navy);
      font-size: 17px;
      margin: 0 0 8px;
    }

    #carrinho .carrinho-vazio p {
      font-size: 12px;
      margin: 0;
    }

    @keyframes ac-cart-enter {
      from {
        opacity: 0;
        transform: translateY(5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 480px) {
      #carrinho #listaCarrinho {
        padding: 8px 17px 20px;
      }

      #carrinho .item-carrinho {
        grid-template-columns: 95px minmax(0,1fr);
        gap: 13px;
        padding: 20px 0;
      }

      #carrinho .imagem-item {
        width: 95px;
        height: 126px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #carrinho .item-carrinho {
        animation: none;
      }

      #carrinho .btn-finalizar {
        transition: none;
      }
    }
  `;

  document.head.appendChild(estilo);
}

/* UTILITÁRIOS */

function moedaCarrinho(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function salvarCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));

  window.dispatchEvent(
    new CustomEvent("armoire:carrinho-atualizado", {
      detail: {
        itens: carrinho,
        quantidade: carrinho.reduce(
          (total, item) => total + Number(item.quantidade || 0),
          0
        )
      }
    })
  );
}

function obterProdutoCarrinho(item) {
  let produtoLocal = null;

  if (typeof produtos !== "undefined" && produtos) {
    if (Array.isArray(produtos)) {
      produtoLocal = produtos.find(
        p => String(p.id || p.source_id) === String(item.id)
      );
    } else {
      produtoLocal =
        produtos[item.id] ||
        Object.values(produtos).find(
          p => String(p.id || p.source_id) === String(item.id)
        );
    }
  }

  if (produtoLocal) {
    return {
      id: String(item.id),
      nome: produtoLocal.nome || produtoLocal.name || "",
      preco: Number(produtoLocal.preco ?? produtoLocal.price ?? 0),
      categoria: produtoLocal.categoria || produtoLocal.category || "",
      imagem:
        produtoLocal.imagens?.[0] ||
        produtoLocal.images?.[0] ||
        produtoLocal.image_url ||
        ""
    };
  }

  if (item.produto) {
    return {
      id: String(item.id),
      nome: item.produto.nome || "Produto",
      preco: Number(item.produto.preco || 0),
      categoria: item.produto.categoria || "",
      imagem: item.produto.imagem || ""
    };
  }

  return null;
}

/* CONTADOR */

function atualizarContador() {
  if (!contadorCarrinho) return;

  const quantidade = carrinho.reduce(
    (total, item) => total + Number(item.quantidade || 0),
    0
  );

  contadorCarrinho.textContent = quantidade;
}

/* NOTIFICAÇÕES */

function mostrarToast(
  texto = "Produto adicionado ao carrinho com sucesso!"
) {
  if (!toast) return;

  const span = toast.querySelector("span");

  if (span) span.textContent = texto;

  toast.classList.add("mostrar");

  clearTimeout(timerToast);

  timerToast = setTimeout(() => {
    toast.classList.remove("mostrar");
  }, 2500);
}

/* ABRIR E FECHAR */

function abrirMenuCarrinho() {
  if (!painelCarrinho) return;

  painelCarrinho.classList.add("ativo");
  overlayCarrinho?.classList.add("ativo");
  atualizarCarrinho();
}

function fecharMenuCarrinho() {
  painelCarrinho?.classList.remove("ativo");
  overlayCarrinho?.classList.remove("ativo");
}

/* ADICIONAR PRODUTO */

function adicionarCarrinho(
  idProduto,
  quantidade = 1,
  tamanho = "Único",
  dadosProduto = null,
  atualizarInterface = true
) {
  const id = String(idProduto);
  const tamanhoNormalizado = String(tamanho || "Único");
  const qtd = Number(quantidade);

  if (!id || !Number.isInteger(qtd) || qtd <= 0) {
    return false;
  }

  const existente = carrinho.find(
    item =>
      String(item.id) === id &&
      String(item.tamanho || "Único") === tamanhoNormalizado
  );

  if (existente) {
    existente.quantidade =
      Number(existente.quantidade || 0) + qtd;

    if (dadosProduto) {
      existente.produto = {
        ...existente.produto,
        ...dadosProduto
      };
    }
  } else {
    const novoItem = {
      id,
      quantidade: qtd,
      tamanho: tamanhoNormalizado
    };

    if (dadosProduto) {
      novoItem.produto = {
        nome: dadosProduto.nome || "Produto",
        preco: Number(dadosProduto.preco || 0),
        imagem: dadosProduto.imagem || "",
        categoria: dadosProduto.categoria || ""
      };
    }

    carrinho.push(novoItem);
  }

  if (atualizarInterface) {
    salvarCarrinho();
    atualizarContador();
    atualizarCarrinho();
    mostrarToast();
  }

  return true;
}

/* LOCALIZAR VARIAÇÃO */

function encontrarItem(id, tamanho = null) {
  return carrinho.find(
    item =>
      String(item.id) === String(id) &&
      (
        tamanho === null ||
        String(item.tamanho || "Único") === String(tamanho)
      )
  );
}

/* REMOVER */

function removerProduto(id, tamanho = null) {
  const indice = carrinho.findIndex(
    item =>
      String(item.id) === String(id) &&
      (
        tamanho === null ||
        String(item.tamanho || "Único") === String(tamanho)
      )
  );

  if (indice === -1) return;

  carrinho.splice(indice, 1);

  salvarCarrinho();
  atualizarContador();
  atualizarCarrinho();
}

/* AUMENTAR QUANTIDADE */

function aumentarQuantidade(id, tamanho = null) {
  const item = encontrarItem(id, tamanho);
  if (!item) return;

  item.quantidade = Number(item.quantidade || 0) + 1;

  salvarCarrinho();
  atualizarContador();
  atualizarCarrinho();
}

/* DIMINUIR QUANTIDADE */

function diminuirQuantidade(id, tamanho = null) {
  const item = encontrarItem(id, tamanho);
  if (!item) return;

  item.quantidade = Number(item.quantidade || 0) - 1;

  if (item.quantidade <= 0) {
    removerProduto(item.id, item.tamanho);
    return;
  }

  salvarCarrinho();
  atualizarContador();
  atualizarCarrinho();
}

/* RENDERIZAR CARRINHO */

function atualizarCarrinho() {
  if (!listaCarrinho || !totalCarrinho) return;

  listaCarrinho.replaceChildren();

  if (!carrinho.length) {
    listaCarrinho.innerHTML = `
      <div class="carrinho-vazio">
        <i class="fa-solid fa-bag-shopping"></i>
        <h3>Seu carrinho está vazio</h3>
        <p>Adicione produtos para continuar.</p>
      </div>
    `;

    totalCarrinho.textContent = moedaCarrinho(0);
    return;
  }

  let total = 0;

  carrinho.forEach(item => {
    const produto = obterProdutoCarrinho(item);

    if (!produto) {
      console.warn("Produto não encontrado:", item.id);
      return;
    }

    const quantidade = Number(item.quantidade || 0);
    total += produto.preco * quantidade;

    const card = document.createElement("div");
    card.className = "item-carrinho";

    const imagemContainer = document.createElement("div");
    imagemContainer.className = "imagem-item";

    const imagem = document.createElement("img");
    imagem.src = produto.imagem;
    imagem.alt = produto.nome;

    imagemContainer.appendChild(imagem);

    const dados = document.createElement("div");
    dados.className = "dados-item";

    const nome = document.createElement("h4");
    nome.textContent = produto.nome;

    const tamanho = document.createElement("p");
    tamanho.className = "tamanho-item";
    tamanho.textContent = `Tamanho: ${item.tamanho || "Único"}`;

    const categoria = document.createElement("p");
    categoria.className = "categoria";
    categoria.textContent = produto.categoria;

    const preco = document.createElement("p");
    preco.className = "preco";
    preco.textContent = moedaCarrinho(produto.preco);

    const acoes = document.createElement("div");
    acoes.className = "acoes-item";

    const controle = document.createElement("div");
    controle.className = "controle-qtd";

    const menos = document.createElement("button");
    menos.type = "button";
    menos.className = "menos";
    menos.textContent = "−";
    menos.setAttribute(
      "aria-label",
      `Diminuir quantidade de ${produto.nome}`
    );

    menos.addEventListener("click", () => {
      diminuirQuantidade(item.id, item.tamanho);
    });

    const quantidadeTexto = document.createElement("span");
    quantidadeTexto.textContent = quantidade;

    const mais = document.createElement("button");
    mais.type = "button";
    mais.className = "mais";
    mais.textContent = "+";
    mais.setAttribute(
      "aria-label",
      `Aumentar quantidade de ${produto.nome}`
    );

    mais.addEventListener("click", () => {
      aumentarQuantidade(item.id, item.tamanho);
    });

    controle.append(menos, quantidadeTexto, mais);

    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "btn-remover";

    remover.innerHTML = `
      <svg viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true">
        <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6"/>
      </svg>
      <span>Remover</span>
    `;

    remover.setAttribute(
      "aria-label",
      `Remover ${produto.nome} do carrinho`
    );

    remover.addEventListener("click", () => {
      removerProduto(item.id, item.tamanho);
    });

    acoes.append(controle, remover);

    dados.append(
      nome,
      tamanho,
      categoria,
      preco,
      acoes
    );

    card.append(imagemContainer, dados);
    listaCarrinho.appendChild(card);
  });

  totalCarrinho.textContent = moedaCarrinho(total);
}

/* LIMPAR CARRINHO */

function limparCarrinho() {
  carrinho = [];

  salvarCarrinho();
  atualizarContador();
  atualizarCarrinho();
}

/* INTEGRAÇÃO COM MY ARMOIRE */

document.addEventListener("armoire:adicionar-look", evento => {
  const itens = evento.detail?.itens;

  if (!Array.isArray(itens) || !itens.length) return;

  const validos = itens.every(item =>
    item.produto_id != null &&
    String(item.produto_id).trim() !== "" &&
    String(item.tamanho || "").trim() !== "" &&
    Number.isInteger(Number(item.quantidade)) &&
    Number(item.quantidade) > 0 &&
    Number.isFinite(Number(item.preco)) &&
    Number(item.preco) >= 0
  );

  if (!validos) {
    console.error("MY ARMOIRE: dados inválidos:", itens);
    return;
  }

  const backup = JSON.stringify(carrinho);

  try {
    itens.forEach(item => {
      adicionarCarrinho(
        item.produto_id,
        item.quantidade,
        item.tamanho,
        {
          nome: item.nome,
          preco: item.preco,
          imagem: item.imagem,
          categoria: item.categoria || ""
        },
        false
      );
    });

    salvarCarrinho();
    atualizarContador();
    atualizarCarrinho();

    mostrarToast(
      `${itens.length} peça(s) adicionada(s) ao carrinho!`
    );

    document.dispatchEvent(
      new CustomEvent("armoire:look-adicionado", {
        detail: {
          sucesso: true,
          quantidade: itens.length,
          tentativa: evento.detail?.tentativa
        }
      })
    );

  } catch (erro) {
    carrinho = JSON.parse(backup);

    console.error("MY ARMOIRE: erro ao adicionar look:", erro);

    document.dispatchEvent(
      new CustomEvent("armoire:look-adicionado", {
        detail: {
          sucesso: false,
          erro: erro.message,
          tentativa: evento.detail?.tentativa
        }
      })
    );
  }
});

/* EVENTOS DO PAINEL */

abrirCarrinho?.addEventListener(
  "click",
  abrirMenuCarrinho
);

fecharCarrinho?.addEventListener(
  "click",
  fecharMenuCarrinho
);

overlayCarrinho?.addEventListener(
  "click",
  fecharMenuCarrinho
);

document.getElementById("continuarComprando")
  ?.addEventListener("click", fecharMenuCarrinho);

/* FINALIZAR COMPRA */

document.querySelector(".btn-finalizar")
  ?.addEventListener("click", () => {
    if (!carrinho.length) {
      mostrarToast("Seu carrinho está vazio.");
      return;
    }

    mostrarToast("Checkout disponível em breve!");
  });

/* BOTÃO COMPRAR — PÁGINA DE PRODUTO */

const botaoComprar = document.querySelector(".comprar");

if (
  botaoComprar &&
  typeof produto !== "undefined"
) {
  botaoComprar.addEventListener("click", () => {
    const quantidade =
      parseInt(document.getElementById("qtd")?.value) || 1;

    adicionarCarrinho(produto.id, quantidade);
  });
}

/* BOTÕES COMPRAR — CATÁLOGO */

document.querySelectorAll(".btn-comprar")
  .forEach(botao => {
    botao.addEventListener("click", evento => {
      evento.preventDefault();
      evento.stopPropagation();

      adicionarCarrinho(botao.dataset.id);
    });
  });

/* FECHAR COM ESC */

document.addEventListener("keydown", evento => {
  if (evento.key === "Escape") {
    fecharMenuCarrinho();
  }
});

/* INICIALIZAÇÃO */

function iniciarCarrinho() {
  instalarEstilosCarrinho();
  atualizarContador();
  atualizarCarrinho();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    iniciarCarrinho,
    { once: true }
  );
} else {
  iniciarCarrinho();
}

/* FUNÇÕES GLOBAIS */

window.adicionarCarrinho = adicionarCarrinho;
window.removerProduto = removerProduto;
window.aumentarQuantidade = aumentarQuantidade;
window.diminuirQuantidade = diminuirQuantidade;
window.limparCarrinho = limparCarrinho;
window.abrirMenuCarrinho = abrirMenuCarrinho;
window.fecharMenuCarrinho = fecharMenuCarrinho;
