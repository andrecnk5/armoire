
(() => {
    'use strict';

    /* ==========================================
       ARMOIRE CENTRAL — FAVORITOS
       Integração com Supabase Auth
    ========================================== */

    if (window.armoireFavoritosIniciado) return;
    const sb = window.armoireServico?.cliente();
    if (!sb) return; // A conta exibe a indisponibilidade do SDK.
    window.armoireFavoritosIniciado = true;
    const executar = window.armoireServico.executar;

    let usuario = null;
    let favoritos = new Set();
    let processando = new Set();

    const catalogo = new Map();
    let carregandoFavoritos = false;
    let erroFavoritos = '';
    let versao = 0;
    function secaoAberta() {
        return document.getElementById('ac-account-detail')?.hidden === false &&
            document.getElementById('ac-detail-title')?.textContent === 'Meus favoritos';
    }
    function atualizarCatalogo() {
        catalogo.clear();
        if (typeof produtos === 'undefined') return;
        Object.values(produtos).forEach(p => {
            catalogo.set(String(p.id), {
                id: String(p.id), nome: p.nome, imagem: p.imagens?.[0] || '',
                preco: Number.isFinite(p.preco) ? p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
                link: `produto.html?id=${encodeURIComponent(p.id)}`
            });
        });
    }

    // ==========================================
    // IDENTIFICAR PRODUTOS
    // ==========================================

    function obterId(card) {
        if (card.dataset.produtoId) {
            return card.dataset.produtoId;
        }

        const link = card.matches('a')
            ? card
            : card.querySelector('a[href]');

        if (!link) return null;

        try {
            const url = new URL(link.href, location.href);
            return url.searchParams.get('id');
        } catch {
            return null;
        }
    }

    // ==========================================
    // ADICIONAR BOTÕES AOS CARDS
    // ==========================================

    function criarBotao(id) {
        const botao = document.createElement('button');

        botao.type = 'button';
        botao.className = 'ac-favorito-botao';
        botao.dataset.favoritoId = id;

        botao.innerHTML = `
            <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>
            </svg>
        `;

        botao.addEventListener('click', (evento) => {
            evento.preventDefault();
            evento.stopPropagation();

            alternarFavorito(id);
        });

        return botao;
    }

    function prepararCard(card) {
        const id = obterId(card);

        if (!id) return;

        if (typeof produtos !== 'undefined' && window.armoireCatalogoEstado && !produtos[id]) return;

        if (card.dataset.favoritoPreparado === '1') {
            return;
        }

        card.dataset.favoritoPreparado = '1';

        const botao = criarBotao(id);

        // O botão não pode ficar dentro de um link.
        // Criamos um contêiner para o link e o coração.

        const unidade = card.closest('.catalogo-card');
        if (unidade) {
            unidade.classList.add('ac-favorito-card');
            unidade.appendChild(botao);
        } else if (card.matches('a')) {
            const container = document.createElement('div');

            container.className = 'ac-favorito-card';

            card.parentNode.insertBefore(container, card);
            container.appendChild(card);
            container.appendChild(botao);

        } else {
            card.classList.add('ac-favorito-card');
            card.appendChild(botao);
        }
    }

    function prepararCards() {
        atualizarCatalogo();
        document.querySelectorAll(
            '.grade-produtos .produto, ' +
            '.mais-vendidos .produto-mini'
        ).forEach(prepararCard);

        atualizarCoracoes();
    }

    // ==========================================
    // ATUALIZAR APARÊNCIA DOS CORAÇÕES
    // ==========================================

    function atualizarCoracoes() {
        document.querySelectorAll(
            '.ac-favorito-botao'
        ).forEach((botao) => {
            const id = botao.dataset.favoritoId;

            const selecionado = favoritos.has(id);

            botao.classList.toggle(
                'ativo',
                selecionado
            );

            botao.setAttribute(
                'aria-pressed',
                String(selecionado)
            );

            botao.setAttribute(
                'aria-label',
                selecionado
                    ? 'Remover dos favoritos'
                    : 'Adicionar aos favoritos'
            );

            botao.disabled = processando.has(id);
        });
    }

    // ==========================================
    // CARREGAR FAVORITOS DO BANCO
    // ==========================================

    async function carregarFavoritos() {
        const atual = ++versao;
        const idUsuario = usuario?.id;
        carregandoFavoritos = !!idUsuario;
        erroFavoritos = '';
        if (secaoAberta()) mostrarFavoritos();
        try {
            if (!idUsuario) { favoritos.clear(); return; }
            const { data, error } = await executar(sb.from('favoritos').select('produto_id').eq('usuario_id', idUsuario));
            if (atual !== versao) return;
            if (error) throw error;
            if (!Array.isArray(data)) throw new Error('Resposta de favoritos inválida.');
            favoritos = new Set(data.map(item => window.armoireServico.idProduto(item.produto_id)).filter(Boolean));
        } catch (erro) {
            if (atual !== versao) return;
            erroFavoritos = 'Não foi possível carregar os favoritos. Tente novamente.';
            console.error('Armoire: favoritos indisponíveis.', erro);
        } finally {
            if (atual === versao) {
                carregandoFavoritos = false;
                atualizarCoracoes();
                if (secaoAberta()) mostrarFavoritos();
            }
        }
    }

    // ==========================================
    // ADICIONAR OU REMOVER FAVORITO
    // ==========================================

    async function alternarFavorito(id) {
        if (processando.has(id)) return;

        processando.add(id);
        atualizarCoracoes();
        const atual = versao;
        let idUsuario;
        try {
            const { data, error: authError } = await executar(sb.auth.getUser());
            if (atual !== versao) return;
            if (authError && authError.name !== 'AuthSessionMissingError') throw authError;
            if (authError || !data?.user) { solicitarLogin(); return; }
            if (usuario?.id !== data.user.id || erroFavoritos || carregandoFavoritos) {
                usuario = data.user;
                await carregarFavoritos();
                if (erroFavoritos) throw new Error(erroFavoritos);
            }
            idUsuario = usuario.id;
            const jaFavorito = favoritos.has(id);

            if (jaFavorito) {
                const { error } = await executar(sb
                    .from('favoritos')
                    .delete()
                    .eq('usuario_id', idUsuario)
                    .eq('produto_id', id), true);

                if (error) throw error;

                if (usuario?.id !== idUsuario) return;
                favoritos.delete(id);

                notificar('Produto removido dos favoritos.');

            } else {
                const { error } = await executar(sb
                    .from('favoritos')
                    .upsert(
                        {
                            usuario_id: idUsuario,
                            produto_id: id
                        },
                        {
                            onConflict: 'usuario_id,produto_id'
                        }
                    ), true);

                if (error) throw error;

                if (usuario?.id !== idUsuario) return;
                favoritos.add(id);

                notificar('Produto adicionado aos favoritos!');
            }

            atualizarCoracoes();

            if (
                !document.getElementById(
                    'ac-account-detail'
                )?.hidden &&
                document.getElementById(
                    'ac-detail-title'
                )?.textContent === 'Meus favoritos'
            ) {
                mostrarFavoritos();
            }

        } catch (erro) {
            console.error(
                'Armoire: erro ao salvar favorito:',
                erro
            );

            notificar(
                'Não foi possível atualizar os favoritos.'
            );

        } finally {
            processando.delete(id);
            atualizarCoracoes();
        }
    }

    // ==========================================
    // LOGIN E NOTIFICAÇÕES
    // ==========================================

    function solicitarLogin() {
        notificar(
            'Entre na sua conta para salvar favoritos.'
        );

        document.dispatchEvent(
            new CustomEvent('armoire:solicitar-login')
        );
    }

    function notificar(texto) {
        const toast = document.getElementById('ac-toast');

        if (toast) {
            toast.textContent = texto;
            toast.classList.add('show');

            clearTimeout(notificar.timer);

            notificar.timer = setTimeout(() => {
                toast.classList.remove('show');
            }, 3500);
        } else {
            console.info(texto);
        }
    }

    // ==========================================
    // EXIBIR FAVORITOS NA MINHA CONTA
    // ==========================================

    function mostrarFavoritos() {
        const conteudo = document.getElementById(
            'ac-detail-content'
        );

        if (!conteudo) return;

        conteudo.replaceChildren();
        if (carregandoFavoritos || erroFavoritos) {
            const aviso = document.createElement('p');
            aviso.className = 'ac-detail-description';
            aviso.textContent = carregandoFavoritos ? 'Carregando favoritos...' : erroFavoritos;
            conteudo.appendChild(aviso);
            return;
        }

        if (!usuario) {
            const aviso = document.createElement('p');
            aviso.className = 'ac-detail-description';
            aviso.textContent =
                'Entre na sua conta para visualizar seus favoritos.';

            conteudo.appendChild(aviso);
            return;
        }

        if (favoritos.size === 0) {
            const vazio = document.createElement('p');

            vazio.className = 'ac-detail-description';
            vazio.textContent =
                'Você ainda não adicionou produtos aos favoritos.';

            conteudo.appendChild(vazio);
            return;
        }

        const lista = document.createElement('div');
        lista.className = 'ac-lista-favoritos';

        favoritos.forEach((id) => {
            const produto = catalogo.get(id);

            const item = document.createElement('div');
            item.className = 'ac-favorito-item';

            if (produto?.imagem) {
                const imagem = document.createElement('img');

                imagem.src = produto.imagem;
                imagem.alt = produto.nome;
                imagem.loading = 'lazy';

                item.appendChild(imagem);
            }

            const informacoes = document.createElement('div');
            informacoes.className = 'ac-favorito-info';

            const nome = document.createElement('a');

            nome.href = produto?.link ||
                `produto.html?id=${encodeURIComponent(id)}`;

            nome.textContent = produto?.nome || `Produto indisponível (${id})`;

            informacoes.appendChild(nome);

            if (produto?.preco) {
                const preco = document.createElement('p');

                preco.textContent = produto.preco;

                informacoes.appendChild(preco);
            }

            const remover = document.createElement('button');

            remover.type = 'button';
            remover.className = 'ac-remover-favorito';
            remover.textContent = 'Remover';

            remover.addEventListener('click', () => {
                alternarFavorito(id);
            });

            informacoes.appendChild(remover);
            item.appendChild(informacoes);
            lista.appendChild(item);
        });

        conteudo.appendChild(lista);
    }

    // ==========================================
    // MONITORAR AUTENTICAÇÃO
    // ==========================================

    sb.auth.onAuthStateChange((_evento, sessao) => {
        if (usuario && usuario.id === sessao?.user?.id) return;
        versao++;
        favoritos.clear();
        erroFavoritos = '';
        carregandoFavoritos = false;
        usuario = sessao?.user || null;
        if (secaoAberta()) mostrarFavoritos();

        if (!usuario) {
            favoritos.clear();
            atualizarCoracoes();
        }

        // Evita chamadas ao banco dentro do callback
        // de autenticação.
        setTimeout(() => {
            carregarFavoritos();
        }, 0);
    });

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    document.addEventListener('armoire:cards-atualizados', prepararCards);
    document.addEventListener('armoire:catalogo-atualizado', () => {
        prepararCards();
        if (secaoAberta()) mostrarFavoritos();
    });

    async function iniciar() {
        prepararCards();

        const atual = versao;
        const { data, error } = await executar(sb.auth.getUser());
        if (atual !== versao) return;
        if (error && error.name !== 'AuthSessionMissingError') throw error;
        usuario = error ? null : data?.user || null;

        await carregarFavoritos();

        // Atualiza informações após carregar o catálogo.
        if (window.armoireCatalogoReady) {
            await window.armoireCatalogoReady;

            prepararCards();
        }
    }

    document.addEventListener('click', (evento) => {
        const botao = evento.target.closest(
            '[data-ac-section="favoritos"]'
        );

        if (botao) {
            // O painel da conta atualiza primeiro
            // sua própria seção.
            setTimeout(() => carregarFavoritos(), 0);
        }
    });

    iniciar().catch((erro) => {
        erroFavoritos = 'Não foi possível verificar sua conta ou carregar os favoritos.';
        if (secaoAberta()) mostrarFavoritos();
        console.error(
            'Armoire: falha ao iniciar favoritos:',
            erro
        );
    });

})();
