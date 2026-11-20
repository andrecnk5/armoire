
/*
  ARMOIRE — Integração do catálogo com Supabase
  Arquivo: js/armoire-supabase.js
*/

(() => {
  "use strict";

  // Substitua pelos dados públicos do seu projeto.
  const PROJECT_URL = "https://wcuutgmwlipshdpqxbim.supabase.co";
  const PUBLIC_KEY = "sb_publishable_sbX0g8RVoczkFCE4rRtrzQ_n7xvWHL1";

  function adaptarProduto(p) {
    const original = produtos[p.source_id] || {};

    return {
      ...original,
      id: p.source_id,
      nome: p.name,
      descricao: p.description || "",
      categoria: p.category,
      marca: p.brand,
      preco: Number(p.price),
      estoque: p.stock,
      imagens: (
        p.images?.length ? p.images : [p.image_url]
      ).filter(Boolean),
      tamanhos: p.sizes || [],
      cores: (p.colors || []).map(nome => ({
        nome,
        codigo: ""
      })),
      ativo: p.is_active
    };
  }

  async function carregarCatalogo() {
    if (
      PROJECT_URL.includes("SEU-PROJETO") ||
      PUBLIC_KEY === "SUA_CHAVE_PUBLICAVEL"
    ) {
      console.warn(
        "Armoire: configure a URL e a chave pública."
      );
      return;
    }

    try {
      const endpoint =
        `${PROJECT_URL}/rest/v1/products` +
        "?select=*&is_active=eq.true";

      const resposta = await fetch(endpoint, {
        headers: {
          apikey: PUBLIC_KEY
        }
      });

      if (!resposta.ok) {
        throw new Error(
          `Erro HTTP ${resposta.status}: ` +
          await resposta.text()
        );
      }

      const lista = await resposta.json();

      for (const item of lista) {
        if (!item.source_id) continue;

        produtos[item.source_id] =
          adaptarProduto(item);
      }

      document.querySelectorAll(
        ".grade-produtos .produto[data-produto-id]"
      ).forEach(card => {
        const item = produtos[card.dataset.produtoId];

        if (!item) return;

        const img = card.querySelector("img");

        if (img && item.imagens[0]) {
          img.src = item.imagens[0];
          img.alt = item.nome;
        }

        const nome = card.querySelector("h4");

        if (nome) {
          nome.textContent = item.nome;
        }

        const preco = card.querySelector(".preco");

        if (preco) {
          preco.textContent =
            Number(item.preco).toLocaleString(
              "pt-BR",
              {
                style: "currency",
                currency: "BRL"
              }
            );
        }
      });

      console.log(
        `Armoire: ${lista.length} produtos recebidos do Supabase.`
      );
      return true;

    } catch (erro) {
      console.error(
        "Armoire: erro ao carregar catálogo:",
        erro
      );
      return false;
    }
  }

 window.armoireCatalogoReady = carregarCatalogo();
})();
