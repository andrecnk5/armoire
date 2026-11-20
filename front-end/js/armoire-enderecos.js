
(() => {
  "use strict";

  if (window.armoireEnderecosIniciado) return;
  const sb = window.armoireServico?.cliente();
  if (!sb) return; // A conta exibe a indisponibilidade do SDK.
  window.armoireEnderecosIniciado = true;
  const executar = window.armoireServico.executar;

  const campos = [
    ["destinatario", "Nome do destinatário"],
    ["cep", "CEP"],
    ["logradouro", "Rua / Avenida"],
    ["numero", "Número"],
    ["complemento", "Complemento (opcional)"],
    ["bairro", "Bairro"],
    ["cidade", "Cidade"],
    ["estado", "UF"]
  ];

  let enderecos = [];
  let carregando = false;
  let usuarioAtual = null;
  let idSessao;
  let versao = 0;
  let erroCarregamento = '';
  let salvando = false;

  const $ = id => document.getElementById(id);

  function secaoAberta() {
    return $("ac-account-detail")?.hidden === false &&
      $("ac-detail-title")?.textContent.trim() === "Meus endereços";
  }

  function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function mensagem(texto, erro = false) {
    const aviso = $("ac-endereco-aviso");
    if (!aviso) return;
    aviso.textContent = texto;
    aviso.classList.toggle("erro", erro);
  }

  async function carregar() {
    const atual = ++versao;
    carregando = true;
    erroCarregamento = '';
    renderizar();
    try {
      const { data: auth, error: authError } = await executar(sb.auth.getUser());
      if (atual !== versao) return false;
      if (authError) throw authError;
      usuarioAtual = auth?.user || null;
      idSessao = usuarioAtual?.id || null;
      if (!usuarioAtual) { enderecos = []; return false; }
      const { data, error } = await executar(sb.from("enderecos").select("*")
        .eq("usuario_id", usuarioAtual.id).order("criado_em", { ascending: true }));
      if (atual !== versao) return false;
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error("Resposta de endereços inválida.");
      enderecos = data;
      return true;
    } catch (erro) {
      if (atual === versao) erroCarregamento = "Não foi possível carregar os endereços. Tente novamente.";
      console.error("Armoire: endereços indisponíveis.", erro);
      return false;
    } finally {
      if (atual === versao) { carregando = false; renderizar(); }
    }
  }

  function renderizar() {
    if (!secaoAberta()) return;

    const area = $("ac-detail-content");
    if (!area) return;

    area.replaceChildren();

    if (carregando) {
      area.appendChild(criar("p", "ac-endereco-texto",
        "Carregando endereços..."));
      return;
    }

    if (erroCarregamento) {
      area.appendChild(criar("p", "ac-endereco-texto", erroCarregamento));
      return;
    }
    if (!usuarioAtual) {
      area.appendChild(criar("p", "ac-endereco-texto",
        "Entre na sua conta para gerenciar seus endereços."));
      return;
    }

    const descricao = criar("p", "ac-endereco-texto",
      "Cadastre seu endereço principal e uma segunda opção para entrega.");
    area.appendChild(descricao);

    const aviso = criar("p", "ac-endereco-aviso");
    aviso.id = "ac-endereco-aviso";
    aviso.setAttribute("role", "status");
    area.appendChild(aviso);

    ["principal", "alternativo"].forEach(tipo => {
      const endereco = enderecos.find(e => e.tipo === tipo);

      const card = criar("div", "ac-endereco-card");
      const topo = criar("div", "ac-endereco-topo");

      topo.appendChild(criar("h3", "",
        tipo === "principal"
          ? "ENDEREÇO PRINCIPAL"
          : "ENDEREÇO ALTERNATIVO"
      ));

      card.appendChild(topo);

      if (endereco) {
        const linhas = [
          endereco.destinatario,
          `${endereco.logradouro}, ${endereco.numero}`,
          endereco.complemento,
          `${endereco.bairro} — ${endereco.cidade}/${endereco.estado}`,
          `CEP ${endereco.cep}`
        ].filter(Boolean);

        linhas.forEach(linha => {
          card.appendChild(criar("p", "ac-endereco-linha", linha));
        });

        const acoes = criar("div", "ac-endereco-acoes");

        const editar = criar("button", "", "Editar");
        editar.type = "button";
        editar.addEventListener("click", () =>
          mostrarFormulario(tipo, endereco)
        );

        const excluir = criar("button", "excluir", "Excluir");
        excluir.type = "button";
        excluir.addEventListener("click", () =>
          excluirEndereco(endereco)
        );

        acoes.append(editar, excluir);
        card.appendChild(acoes);
      } else {
        card.appendChild(criar("p", "ac-endereco-texto",
          "Nenhum endereço cadastrado."
        ));

        const adicionar = criar("button", "ac-endereco-adicionar",
          "+ CADASTRAR ENDEREÇO");

        adicionar.type = "button";
        adicionar.addEventListener("click", () =>
          mostrarFormulario(tipo)
        );

        card.appendChild(adicionar);
      }

      area.appendChild(card);
    });
  }

  function mostrarFormulario(tipo, endereco = null) {
    const dono = usuarioAtual?.id;
    const versaoFormulario = versao;
    const area = $("ac-detail-content");
    if (!area) return;

    area.replaceChildren();

    const voltar = criar("button", "ac-endereco-voltar",
      "← Voltar aos endereços");

    voltar.type = "button";
    voltar.addEventListener("click", renderizar);
    area.appendChild(voltar);

    const titulo = criar("h3", "ac-endereco-form-titulo",
      `${endereco ? "Editar" : "Cadastrar"} endereço ${tipo}`);

    area.appendChild(titulo);

    const form = criar("form", "ac-endereco-form");
    form.noValidate = true;

    const inputs = {};

    campos.forEach(([nome, rotulo]) => {
      const grupo = criar("label", "ac-endereco-campo");
      grupo.appendChild(criar("span", "", rotulo));

      const input = document.createElement("input");

      input.name = nome;
      input.type = "text";
      input.value = endereco?.[nome] || "";
      input.autocomplete = nome === "cep" ? "postal-code" : "off";

      if (nome === "cep") {
        input.inputMode = "numeric";
        input.maxLength = 9;
        input.placeholder = "00000-000";
      }

      if (nome === "estado") {
        input.maxLength = 2;
        input.placeholder = "SP";
      }

      if (nome === "numero") {
        input.maxLength = 20;
      }

      if (nome !== "complemento") {
        input.required = true;
      }

      inputs[nome] = input;
      grupo.appendChild(input);
      form.appendChild(grupo);
    });

    
/* ==========================================
   CONSULTA AUTOMÁTICA DE CEP — VIACEP
========================================== */

let ultimaConsultaCEP = "";
let consultaCEPAtual = 0;

inputs.cep.addEventListener("input", async function () {

    // Remove caracteres que não sejam números.
    const cep = inputs.cep.value.replace(/\D/g, "").slice(0, 8);

    // Formata o CEP automaticamente.
    inputs.cep.value = cep.length > 5
        ? cep.slice(0, 5) + "-" + cep.slice(5)
        : cep;

    // Invalida consultas anteriores.
    const consultaAtual = ++consultaCEPAtual;

    // Aguarda os oito números.
    
if (cep.length !== 8) {
    ultimaConsultaCEP = "";

    inputs.logradouro.value = "";
    inputs.bairro.value = "";
    inputs.cidade.value = "";
    inputs.estado.value = "";

    return;
}


    // Evita consultar novamente o mesmo CEP.
    if (cep === ultimaConsultaCEP) {
        return;
    }

    ultimaConsultaCEP = cep;

    mensagemFormulario("Consultando CEP...");

    try {
        const resposta = await executar(fetch(
            `https://viacep.com.br/ws/${cep}/json/`
        ));

        if (!resposta.ok) {
            throw new Error("Falha na consulta do CEP.");
        }

        const dados = await executar(resposta.json());

        // Ignora resultados de consultas antigas.
        if (consultaAtual !== consultaCEPAtual) {
            return;
        }

        if (dados.erro) {
            ultimaConsultaCEP = "";

            mensagemFormulario(
                "CEP não encontrado. Confira os números informados.",
                true
            );

            return;
        }

        // Preenche automaticamente os campos disponíveis.
        inputs.logradouro.value = dados.logradouro || "";
        inputs.bairro.value = dados.bairro || "";
        inputs.cidade.value = dados.localidade || "";
        inputs.estado.value = dados.uf || "";

        mensagemFormulario(
            "CEP encontrado! Confira os dados e informe o número."
        );

        // Direciona o cliente ao próximo campo necessário.
        if (dados.logradouro && dados.bairro) {
            inputs.numero.focus();
        } else if (!dados.logradouro) {
            inputs.logradouro.focus();
        } else {
            inputs.bairro.focus();
        }

    } catch (erro) {
        if (consultaAtual !== consultaCEPAtual) {
            return;
        }

        ultimaConsultaCEP = "";

        console.error("Erro na consulta do CEP:", erro);

        mensagemFormulario(
            "Não foi possível consultar o CEP. Preencha os campos manualmente.",
            true
        );
    }
    });

    const status = criar("p", "ac-endereco-status");
    status.setAttribute("role", "status");
    form.appendChild(status);

    function mensagemFormulario(texto, erro = false) {
      status.textContent = texto;
      status.classList.toggle("erro", erro);
    }

    const salvar = criar("button", "ac-endereco-salvar",
      "SALVAR ENDEREÇO");

    salvar.type = "submit";
    form.appendChild(salvar);

    form.addEventListener("submit", async evento => {
      evento.preventDefault();

      if (salvando) return;
      const valores = {};

      campos.forEach(([nome]) => {
        valores[nome] = inputs[nome].value.trim();
      });

      valores.cep = valores.cep.replace(/\D/g, "");
      valores.estado = valores.estado.toUpperCase();

      if (Object.entries(valores).some(([chave, valor]) =>
        chave !== "complemento" && !valor
      )) {
        mensagemFormulario("Preencha todos os campos obrigatórios.", true);
        return;
      }

      if (!/^\d{8}$/.test(valores.cep)) {
        mensagemFormulario("Informe um CEP com 8 números.", true);
        return;
      }

      if (!/^[A-Z]{2}$/.test(valores.estado)) {
        mensagemFormulario("Informe a UF com duas letras.", true);
        return;
      }

      salvando = true;
      salvar.disabled = true;
      salvar.textContent = "SALVANDO...";

      try {
        const { data: auth, error: authError } =
          await executar(sb.auth.getUser());

        if (authError || !auth?.user || auth.user.id !== dono || versaoFormulario !== versao) {
          throw new Error("Sua conta mudou ou a sessão expirou. Entre novamente.");
        }

        const { error } = await executar(sb
          .from("enderecos")
          .upsert({
            usuario_id: auth.user.id,
            tipo,
            ...valores,
            atualizado_em: new Date().toISOString()
          }, {
            onConflict: "usuario_id,tipo"
          }), true);

        if (error) throw error;
        if (versaoFormulario !== versao) return;

        if (await carregar()) mensagem("Endereço salvo com sucesso!");
      } catch (erro) {
        console.error(erro);
        mensagemFormulario(
          erro.message || "Não foi possível salvar o endereço.",
          true
        );
      } finally {
        salvando = false;
        salvar.disabled = false;
        salvar.textContent = "SALVAR ENDEREÇO";
      }
    });

    area.appendChild(form);
  }

  async function excluirEndereco(endereco) {
    const dono = usuarioAtual?.id;
    if (!confirm(
      `Deseja excluir o endereço ${endereco.tipo}?`
    )) return;

    try {
      const { data: auth, error: authError } =
        await executar(sb.auth.getUser());

      if (authError || !auth?.user || auth.user.id !== dono) {
        throw new Error("Faça login novamente.");
      }

      const { error } = await executar(sb
        .from("enderecos")
        .delete()
        .eq("id", endereco.id)
        .eq("usuario_id", auth.user.id), true);

      if (error) throw error;

      if (await carregar()) mensagem("Endereço excluído com sucesso!");
    } catch (erro) {
      console.error(erro);
      mensagem("Não foi possível excluir o endereço.", true);
    }
  }

  // Abre a lista quando o usuário entra na seção.
  document.addEventListener("click", evento => {
    if (evento.target.closest(
      '[data-ac-section="enderecos"]'
    )) {
      setTimeout(carregar, 0);
    }
  });

  // Limpa os dados ao sair da conta.
  sb.auth.onAuthStateChange((_evento, sessao) => {
    const id = sessao?.user?.id || null;
    if (id === idSessao) return;
    idSessao = id;
    versao++;
    usuarioAtual = null;
    enderecos = [];
    erroCarregamento = '';
    carregando = false;
    renderizar();
    if (sessao?.user && secaoAberta()) setTimeout(carregar, 0);
  });

})();
