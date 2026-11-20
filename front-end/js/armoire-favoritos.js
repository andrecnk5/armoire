
(() => {
    'use strict';

    /* ==========================================
       ARMOIRE CENTRAL — FAVORITOS
       Integração com Supabase Auth
    ========================================== */

    const URL =
        'https://wcuutgmwlipshdpqxbim.supabase.co';

    const KEY =
        'sb_publishable_sbX0g8RVoczkFCE4rRtrzQ_n7xvWHL1';

    if (!window.supabase?.createClient) {
        console.error('Armoire: Supabase indisponível.');
        return;
    }

    const sb = window.supabase.createClient(URL, KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });

    let usuario = null;
    let favoritos = new Set();
    let processando = new Set();

    const catalogo = new Map();

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

    function registrarProduto(card, id) {
        const link = card.matches('a')
            ? card
            : card.querySelector('a[href]');

        const imagem = card.querySelector('img');

        const nome =
            card.querySelector('h4')?.textContent ||
            card.querySelector('p')?.textContent ||
            imagem?.alt ||
            id;

        const preco =
            card.querySelector('.preco')?.textContent || '';

        catalogo.set(id, {
            id,
            nome: nome.trim(),
            imagem: imagem?.src || '',
            preco: preco.trim(),
            link: link?.href || `produto.html?id=${encodeURIComponent(id)}`
        });
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
        registrarProduto(card, id);

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
        catalogo.clear();
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
        if (!usuario) {
            favoritos.clear();
            atualizarCoracoes();
            return;
        }

        const idUsuario = usuario.id;

        const { data, error } = await sb
            .from('favoritos')
            .select('produto_id')
            .eq('usuario_id', idUsuario);

        if (error) {
            console.error(
                'Erro ao carregar favoritos:',
                error
            );
            return;
        }

        if (usuario?.id !== idUsuario) return;

        favoritos = new Set(
            (data || []).map(item => item.produto_id)
        );

        atualizarCoracoes();
    }

    // ==========================================
    // ADICIONAR OU REMOVER FAVORITO
    // ==========================================

    async function alternarFavorito(id) {
        if (processando.has(id)) return;

        const { data, error: authError } =
            await sb.auth.getUser();

        if (authError || !data.user) {
            solicitarLogin();
            return;
        }

        usuario = data.user;

        processando.add(id);
        atualizarCoracoes();

        try {
            const jaFavorito = favoritos.has(id);

            if (jaFavorito) {
                const { error } = await sb
                    .from('favoritos')
                    .delete()
                    .eq('usuario_id', usuario.id)
                    .eq('produto_id', id);

                if (error) throw error;

                favoritos.delete(id);

                notificar('Produto removido dos favoritos.');

            } else {
                const { error } = await sb
                    .from('favoritos')
                    .upsert(
                        {
                            usuario_id: usuario.id,
                            produto_id: id
                        },
                        {
                            onConflict: 'usuario_id,produto_id'
                        }
                    );

                if (error) throw error;

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

            nome.textContent = produto?.nome || id;

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
        usuario = sessao?.user || null;

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

    async function iniciar() {
        prepararCards();

        const { data } = await sb.auth.getUser();

        usuario = data?.user || null;

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
            setTimeout(mostrarFavoritos, 0);
        }
    });

    iniciar().catch((erro) => {
        console.error(
            'Armoire: falha ao iniciar favoritos:',
            erro
        );
    });

})();
