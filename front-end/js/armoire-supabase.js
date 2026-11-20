
/*
  ARMOIRE — Integração do catálogo com Supabase
  Arquivo: js/armoire-supabase.js
*/

(() => {
  "use strict";

  // Substitua pelos dados públicos do seu projeto.
  const PROJECT_URL = "https://wcuutgmwlipshdpqxbim.supabase.co";
  const PUBLIC_KEY = "sb_publishable_sbX0g8RVoczkFCE4rRtrzQ_n7xvWHL1";

  // Remoto válido substitui todo o conjunto ativo. Falha mantém o snapshot local.
  // Preserva a referência de `produtos`, utilizada pelo detalhe e pelo carrinho.
  const locais = { ...produtos };
  window.armoireCatalogoLocal = locais;
  window.armoireCatalogoEstado = { fonte: "carregando", versao: 0 };

  function texto(valor) {
    return String(valor || "").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  function lista(valor) {
    if (Array.isArray(valor)) return valor;
    if (typeof valor !== "string" || !valor.trim()) return [];
    try {
      const dados = JSON.parse(valor);
      return Array.isArray(dados) ? dados : [valor];
    } catch { return valor.split(",").map(s => s.trim()).filter(Boolean); }
  }

  function adaptarProduto(p) {
    const idValido = typeof p.source_id === "string" ||
      (typeof p.source_id === "number" && Number.isFinite(p.source_id));
    const id = idValido ? String(p.source_id).trim() : "";
    const preco = (typeof p.price === "number" ||
      (typeof p.price === "string" && p.price.trim())) ? Number(p.price) : NaN;
    if (!id || ["undefined", "null", "__proto__"].includes(id) ||
        typeof p.name !== "string" || !p.name.trim() ||
        !Number.isFinite(preco) || preco < 0) {
      throw new Error("Resposta do catálogo contém produto inválido.");
    }
    const original = locais[id] || {};
    const categoria = String(p.category || "");
    const grupos = {
      camiseta: "camisetas", polo: "polos", camisa: "camisas",
      calca: "calcas", bermuda: "bermudas", bone: "acessorios", bones: "acessorios",
      acessorio: "acessorios", agasalho: "agasalhos", moletom: "agasalhos"
    };
    const tipo = texto(categoria) === texto(original.categoria) && original.tipo
      ? original.tipo : (grupos[texto(categoria)] || texto(categoria));
    const estoque = (typeof p.stock === "number" ||
      (typeof p.stock === "string" && p.stock.trim())) ? Number(p.stock) : NaN;
    return {
      ...original,
      id, nome: p.name.trim(), descricao: p.description || "",
      categoria, tipo, marca: p.brand || "", preco,
      estoque: Number.isSafeInteger(estoque) && estoque >= 0 ? estoque : null,
      imagens: lista(p.images).map(i => typeof i === "string" ? i : i?.url || i?.src)
        .filter(Boolean).concat(p.image_url ? [p.image_url] : [])
        .filter((i, index, todas) => todas.indexOf(i) === index),
      tamanhos: lista(p.sizes).map(s => typeof s === "string" ? s : s?.name || s?.size || s?.tamanho)
        .filter(Boolean),
      cores: lista(p.colors).map(c => typeof c === "string" ? { nome: c, codigo: "" } :
        { nome: c?.nome || c?.name || "", codigo: c?.codigo || "" }).filter(c => c.nome),
      ativo: true
    };
  }

  function publicar(catalogo, fonte) {
    Object.keys(produtos).forEach(id => delete produtos[id]);
    Object.assign(produtos, catalogo);
    window.armoireCatalogoEstado = {
      fonte, versao: window.armoireCatalogoEstado.versao + 1
    };
    document.dispatchEvent(new CustomEvent("armoire:catalogo-atualizado"));
  }

  async function carregarCatalogo() {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    let timer;
    try {
      const requisicao = async () => {
        const resposta = await fetch(
          `${PROJECT_URL}/rest/v1/products?select=*&is_active=eq.true`,
          { headers: { apikey: PUBLIC_KEY }, signal: controller?.signal }
        );
        if (!resposta.ok) throw new Error(`Erro HTTP ${resposta.status}`);
        const dados = await resposta.json();
        if (!Array.isArray(dados)) throw new Error("Resposta de catálogo inválida.");
        const catalogo = Object.create(null);
        for (const p of dados) {
          if (!p || typeof p !== "object") throw new Error("Produto inválido.");
          // Mesmo que uma resposta inclua inativos, eles nunca entram na listagem.
          if (p.is_active !== true) continue;
          const produto = adaptarProduto(p);
          if (catalogo[produto.id]) throw new Error("ID duplicado no catálogo.");
          catalogo[produto.id] = produto;
        }
        return catalogo;
      };
      const limite = new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller?.abort();
          reject(new Error("Tempo de consulta do catálogo excedido."));
        }, 8000);
      });
      const catalogo = await Promise.race([requisicao(), limite]);
      publicar(catalogo, "remoto");
      return true;
    } catch (erro) {
      publicar(locais, "local");
      console.warn("Armoire: catálogo local exibido.", erro);
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  window.armoireCatalogoReady = carregarCatalogo();
})();
