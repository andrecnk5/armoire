
(() => {
    'use strict';

    /* ==========================================
       ARMOIRE CENTRAL
       SISTEMA DE AUTENTICAÇÃO E MINHA CONTA
    ========================================== */


    // ==========================================
    // 1. CONFIGURAÇÃO DO SUPABASE
    // ==========================================

    const SUPABASE_URL =
        'https://wcuutgmwlipshdpqxbim.supabase.co';

    const SUPABASE_ANON_KEY =
        'sb_publishable_sbX0g8RVoczkFCE4rRtrzQ_n7xvWHL1';

    if (!window.supabase?.createClient) {
        console.error(
            'Armoire: biblioteca Supabase não carregou.'
        );
        return;
    }

    const sb = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );


    // ==========================================
    // 2. INTERFACE HTML
    // ==========================================

    const markup = `
        <!-- FUNDO ESCURECIDO -->

        <div
            id="ac-overlay"
            class="ac-overlay"
            aria-hidden="true">
        </div>


        <!-- LOGIN E CADASTRO -->

        <section
            id="ac-modal"
            class="ac-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ac-heading"
            aria-hidden="true"
            inert>

            <button
                class="ac-close"
                type="button"
                data-ac-close
                aria-label="Fechar">
                ×
            </button>

            <div class="ac-eyebrow">
                ARMOIRE CENTRAL
            </div>

            <h2 id="ac-heading">
                Entrar
            </h2>

            <p class="ac-description">
                Sua experiência Armoire começa aqui.
            </p>

            <form id="ac-form" novalidate>

                <div id="ac-name-wrap" hidden>

                    <label for="ac-name">
                        Nome completo
                    </label>

                    <input
                        id="ac-name"
                        type="text"
                        autocomplete="name"
                        minlength="2">

                </div>

                <label for="ac-email">
                    E-mail
                </label>

                <input
                    id="ac-email"
                    type="email"
                    autocomplete="email"
                    required>

                <label for="ac-password">
                    Senha
                </label>

                <input
                    id="ac-password"
                    type="password"
                    autocomplete="current-password"
                    minlength="6"
                    required>

                <div id="ac-confirm-wrap" hidden>

                    <label for="ac-confirm">
                        Confirme a senha
                    </label>

                    <input
                        id="ac-confirm"
                        type="password"
                        autocomplete="new-password">

                </div>

                <p
                    id="ac-message"
                    class="ac-message"
                    role="status"
                    aria-live="polite">
                </p>

                <button
                    id="ac-submit"
                    class="ac-primary"
                    type="submit">
                    Entrar
                </button>

            </form>

            <button
                id="ac-switch"
                class="ac-switch"
                type="button">
                Não tem uma conta? Cadastre-se
            </button>

        </section>


        <!-- PAINEL MINHA CONTA -->

        <aside
            id="ac-drawer"
            class="ac-drawer"
            aria-label="Minha conta"
            aria-hidden="true"
            inert>

            <div class="ac-drawer-top">

                <span>
                    ARMOIRE CENTRAL
                </span>

                <button
                    type="button"
                    data-ac-close
                    aria-label="Fechar">
                    ×
                </button>

            </div>


            <!-- PÁGINA PRINCIPAL DA CONTA -->

            <div id="ac-account-home">

                <div class="ac-profile">

                    <div
                        class="ac-avatar"
                        id="ac-avatar"
                        aria-label="Inicial do nome do usuário">
                        A
                    </div>

                    <div class="ac-profile-info">

                        <span class="ac-profile-label">
                            MINHA CONTA
                        </span>

                        <h2 id="ac-welcome">
                            Bem-vindo à Armoire.
                        </h2>

                        <p id="ac-user-email"></p>

                    </div>

                </div>


                <!-- MENU DA CONTA -->

                <nav
                    class="ac-account-menu"
                    aria-label="Opções da minha conta">

                    <button
                        type="button"
                        data-ac-section="pedidos">

                        <i
                            class="fa-solid fa-box"
                            aria-hidden="true"></i>

                        <span>
                            Meus pedidos
                        </span>

                        <i
                            class="fa-solid fa-chevron-right"
                            aria-hidden="true"></i>

                    </button>


                    <button
                        type="button"
                        data-ac-section="favoritos">

                        <i
                            class="fa-regular fa-heart"
                            aria-hidden="true"></i>

                        <span>
                            Meus favoritos
                        </span>

                        <i
                            class="fa-solid fa-chevron-right"
                            aria-hidden="true"></i>

                    </button>


                    <button
                        type="button"
                        data-ac-section="enderecos">

                        <i
                            class="fa-solid fa-location-dot"
                            aria-hidden="true"></i>

                        <span>
                            Meus endereços
                        </span>

                        <i
                            class="fa-solid fa-chevron-right"
                            aria-hidden="true"></i>

                    </button>


                    <button
                        type="button"
                        data-ac-section="guarda-roupa">

                        <i
                            class="fa-solid fa-shirt"
                            aria-hidden="true"></i>

                        <span>
                            Meu guarda-roupa
                        </span>

                        <i
                            class="fa-solid fa-chevron-right"
                            aria-hidden="true"></i>

                    </button>


                    <button
                        type="button"
                        data-ac-section="configuracoes">

                        <i
                            class="fa-solid fa-gear"
                            aria-hidden="true"></i>

                        <span>
                            Configurações
                        </span>

                        <i
                            class="fa-solid fa-chevron-right"
                            aria-hidden="true"></i>

                    </button>

                </nav>


                <!-- EXPLORAR PRODUTOS -->

                <a
                    class="ac-explore"
                    href="produtos.html">

                    EXPLORAR COLEÇÃO

                    <i
                        class="fa-solid fa-arrow-up-right-from-square"
                        aria-hidden="true"></i>

                </a>


                <!-- LOGOUT -->

                <button
                    id="ac-logout"
                    type="button"
                    class="ac-primary">
                    Sair da conta
                </button>

            </div>


            <!-- PÁGINAS INTERNAS DA CONTA -->

            <div
                id="ac-account-detail"
                hidden>

                <button
                    id="ac-account-back"
                    type="button"
                    class="ac-back">

                    <i
                        class="fa-solid fa-arrow-left"
                        aria-hidden="true"></i>

                    Voltar para minha conta

                </button>

                <h2 id="ac-detail-title"></h2>

                <div id="ac-detail-content"></div>

            </div>

        </aside>


        <!-- NOTIFICAÇÕES -->

        <div
            id="ac-toast"
            class="ac-toast"
            role="status"
            aria-live="polite">
        </div>
    `;


    // ==========================================
    // 3. INSERIR INTERFACE NA PÁGINA
    // ==========================================

    document.body.insertAdjacentHTML(
        'beforeend',
        markup
    );

    const $ = (id) => document.getElementById(id);

    const overlay = $('ac-overlay');
    const modal = $('ac-modal');
    const drawer = $('ac-drawer');
    const form = $('ac-form');

    let mode = 'login';
    let session = null;
    let busy = false;
    let lastFocus = null;
    let toastTimer;


    // ==========================================
    // 4. NOTIFICAÇÕES
    // ==========================================

    function toast(texto) {
        const elemento = $('ac-toast');

        elemento.textContent = texto;
        elemento.classList.add('show');

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            elemento.classList.remove('show');
        }, 4500);
    }

    function message(texto, erro = false) {
        const elemento = $('ac-message');

        elemento.textContent = texto;
        elemento.classList.toggle('error', erro);
    }


    // ==========================================
    // 5. ABRIR E FECHAR PAINÉIS
    // ==========================================

    function close() {
        const focoAnterior = lastFocus;

        overlay.classList.remove('open');
        modal.classList.remove('open');
        drawer.classList.remove('open');

        overlay.setAttribute('aria-hidden', 'true');
        modal.setAttribute('aria-hidden', 'true');
        drawer.setAttribute('aria-hidden', 'true');

        modal.inert = true;
        drawer.inert = true;

        document.body.classList.remove('ac-locked');

        window.armoireDialogos?.fechar(modal);
        window.armoireDialogos?.fechar(drawer);
        lastFocus = null;

        focoAnterior?.focus?.();
    }

    function open(tipo) {
        const focoAnterior = document.activeElement;

        close();

        lastFocus = focoAnterior;

        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');

        document.body.classList.add('ac-locked');

        const elemento =
            tipo === 'drawer' ? drawer : modal;

        elemento.inert = false;
        elemento.setAttribute('aria-hidden', 'false');

        requestAnimationFrame(() => {
            elemento.classList.add('open');
            window.armoireDialogos?.abrir(elemento, {
                fechar: close, origem: lastFocus, externos: [overlay],
                inicial: tipo === 'drawer' ? drawer.querySelector('[data-ac-close]') : $('ac-email')
            });
        });

        const foco =
            tipo === 'drawer'
                ? drawer.querySelector('[data-ac-close]')
                : $('ac-email');

        foco?.focus();
    }


    // ==========================================
    // 6. ALTERNAR LOGIN E CADASTRO
    // ==========================================

    function setMode(novoModo) {
        mode = novoModo;

        form.reset();
        message('');

        const cadastro = mode === 'signup';

        $('ac-heading').textContent =
            cadastro ? 'Criar conta' : 'Entrar';

        $('ac-name-wrap').hidden = !cadastro;
        $('ac-confirm-wrap').hidden = !cadastro;

        $('ac-name').required = cadastro;
        $('ac-confirm').required = cadastro;

        $('ac-password').autocomplete =
            cadastro ? 'new-password' : 'current-password';

        $('ac-submit').textContent =
            cadastro ? 'Criar minha conta' : 'Entrar';

        $('ac-switch').textContent =
            cadastro
                ? 'Já tem uma conta? Entrar'
                : 'Não tem uma conta? Cadastre-se';

        modal.classList.remove('ac-swap');

        void modal.offsetWidth;

        modal.classList.add('ac-swap');
    }


    // ==========================================
    // 7. ATUALIZAR PERFIL DO USUÁRIO
    // ==========================================

    function updateAccount() {
        const usuario = session?.user;

        if (!usuario) {
            $('ac-welcome').textContent =
                'Bem-vindo à Armoire.';

            $('ac-user-email').textContent = '';
            $('ac-avatar').textContent = 'A';

            return;
        }

        const nome =
            usuario.user_metadata?.full_name ||
            usuario.user_metadata?.nome ||
            usuario.user_metadata?.name ||
            usuario.email?.split('@')[0] ||
            'Cliente';

        const primeiroNome =
            nome.trim().split(/\s+/)[0];

        const inicial =
            primeiroNome.charAt(0).toLocaleUpperCase('pt-BR');

        $('ac-avatar').textContent = inicial || 'A';

        $('ac-welcome').textContent =
            `Olá, ${primeiroNome}!`;

        $('ac-user-email').textContent =
            usuario.email || '';
    }


    // ==========================================
    // 8. RESTAURAR SESSÃO
    // ==========================================

    async function syncSession() {
        const { data, error } =
            await sb.auth.getSession();

        if (error) {
            console.warn(
                'Armoire: erro ao recuperar sessão:',
                error.message
            );
        }

        session = data?.session || null;

        updateAccount();
    }


    // ==========================================
    // 9. TRATAMENTO DE ERROS
    // ==========================================

    function tratarErroAutenticacao(erro) {
        switch (erro?.code) {
            case 'user_already_exists':
            case 'email_exists':
            case 'email_address_exists':
                return 'Este e-mail já está em uso.';

            case 'invalid_credentials':
                return 'E-mail ou senha incorretos.';

            case 'email_not_confirmed':
                return 'Confirme seu e-mail antes de entrar.';

            case 'weak_password':
                return 'Escolha uma senha mais segura.';

            case 'over_email_send_rate_limit':
            case 'over_request_rate_limit':
                return 'Muitas tentativas. Aguarde antes de tentar novamente.';

            case 'validation_failed':
            case 'email_address_invalid':
                return 'Informe um endereço de e-mail válido.';

            default:
                return erro?.message ||
                    'Não foi possível concluir. Tente novamente.';
        }
    }


    // ==========================================
    // 10. CADASTRAR USUÁRIO
    // ==========================================

    async function cadastrarUsuario(nome, email, senha) {
        const { data, error } =
            await sb.auth.signUp({
                email: email.trim().toLowerCase(),
                password: senha,

                options: {
                    data: {
                        full_name: nome.trim(),
                        nome: nome.trim()
                    }
                }
            });

        if (error) {
            throw error;
        }

        return data;
    }


    // ==========================================
    // 11. ENTRAR NA CONTA
    // ==========================================

    async function entrarUsuario(email, senha) {
        const { data, error } =
            await sb.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password: senha
            });

        if (error) {
            throw error;
        }

        return data;
    }


    // ==========================================
    // 12. VALIDAR FORMULÁRIO
    // ==========================================

    function validarFormulario() {
        const nome = $('ac-name').value.trim();
        const email = $('ac-email').value.trim();
        const senha = $('ac-password').value;
        const confirmacao = $('ac-confirm').value;

        if (!email || !senha) {
            message(
                'Preencha o e-mail e a senha.',
                true
            );

            return null;
        }

        const emailValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!emailValido) {
            message(
                'Informe um endereço de e-mail válido.',
                true
            );

            return null;
        }

        if (mode === 'signup') {
            if (nome.length < 2) {
                message(
                    'Informe seu nome completo.',
                    true
                );

                return null;
            }

            if (senha.length < 6) {
                message(
                    'A senha deve ter pelo menos 6 caracteres.',
                    true
                );

                return null;
            }

            if (senha !== confirmacao) {
                message(
                    'As senhas são diferentes. Confira todos os caracteres.',
                    true
                );

                return null;
            }
        }

        return {
            nome,
            email,
            senha
        };
    }


    // ==========================================
    // 13. ENVIAR LOGIN OU CADASTRO
    // ==========================================

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        if (busy) {
            return;
        }

        const dados = validarFormulario();

        if (!dados) {
            return;
        }

        busy = true;
        $('ac-submit').disabled = true;

        message('Aguarde...');

        try {
            if (mode === 'signup') {
                const resultado = await cadastrarUsuario(
                    dados.nome,
                    dados.email,
                    dados.senha
                );

                if (resultado.session) {
                    session = resultado.session;

                    updateAccount();
                    close();

                    toast(
                        'Perfil criado com sucesso! Bem-vindo à Armoire.'
                    );

                    voltarMinhaConta();
                    open('drawer');

                } else {
                    message(
                        'Se o endereço puder ser cadastrado, você receberá um e-mail de confirmação.'
                    );

                    toast(
                        'Confira sua caixa de entrada para verificar as próximas etapas.'
                    );
                }

            } else {
                const resultado = await entrarUsuario(
                    dados.email,
                    dados.senha
                );

                session = resultado.session;

                updateAccount();
                close();

                toast(
                    'Bem-vindo de volta à Armoire!'
                );

                voltarMinhaConta();
                open('drawer');
            }

        } catch (erro) {
            console.error('Armoire Auth:', erro);

            message(
                tratarErroAutenticacao(erro),
                true
            );

        } finally {
            busy = false;
            $('ac-submit').disabled = false;
        }
    });


    // ==========================================
    // 14. NAVEGAÇÃO DA MINHA CONTA
    // ==========================================

    const secoesConta = {
        pedidos: {
            titulo: 'Meus pedidos',
            texto: 'Seu histórico de compras aparecerá aqui.'
        },

        favoritos: {
            titulo: 'Meus favoritos',
            texto: 'Os produtos que você salvar como favoritos aparecerão aqui.'
        },

        enderecos: {
            titulo: 'Meus endereços',
            texto: 'Aqui você poderá gerenciar seu endereço principal e seu endereço alternativo.'
        },

        'guarda-roupa': {
            titulo: 'Meu guarda-roupa',
            texto: 'Seus looks e combinações de peças aparecerão aqui.'
        },

        configuracoes: {
            titulo: 'Configurações',
            texto: 'Aqui você poderá gerenciar suas informações pessoais e preferências.'
        }
    };

    function abrirSecaoConta(secao) {
        const dados = secoesConta[secao];

        if (!dados || !session?.user) {
            return;
        }

        $('ac-account-home').hidden = true;
        $('ac-account-detail').hidden = false;

        $('ac-detail-title').textContent = dados.titulo;

        const conteudo = $('ac-detail-content');
        conteudo.replaceChildren();

        const descricao = document.createElement('p');

        descricao.className = 'ac-detail-description';
        descricao.textContent = dados.texto;

        conteudo.appendChild(descricao);
    }

    function voltarMinhaConta() {
        $('ac-account-detail').hidden = true;
        $('ac-account-home').hidden = false;
    }

    document
        .querySelectorAll('[data-ac-section]')
        .forEach((botao) => {
            botao.addEventListener('click', () => {
                abrirSecaoConta(
                    botao.dataset.acSection
                );
            });
        });

    $('ac-account-back').addEventListener(
        'click',
        voltarMinhaConta
    );


    // ==========================================
    // 15. ÍCONES DE PERFIL DO SITE
    // ==========================================

    document
        .querySelectorAll('.fa-user, .icone-perfil')
        .forEach((icone) => {
            const alvo =
                icone.closest('a, button, .icone-perfil') ||
                icone;

            if (alvo.dataset.acBound) {
                return;
            }

            alvo.dataset.acBound = '1';

            alvo.setAttribute('role', 'button');
            alvo.setAttribute('tabindex', '0');

            alvo.setAttribute(
                'aria-label',
                'Abrir minha conta'
            );

            function ativar(evento) {
                evento.preventDefault();

                if (session) {
                    updateAccount();
                    voltarMinhaConta();
                    open('drawer');

                } else {
                    setMode('login');
                    open('modal');
                }
            }

            alvo.addEventListener('click', ativar);

            if (!alvo.matches('button')) alvo.addEventListener('keydown', (evento) => {
                if (
                    evento.key === 'Enter' ||
                    evento.key === ' '
                ) {
                    evento.preventDefault();
                    ativar(evento);
                }
            });
        });


    // ==========================================
    // 16. FECHAR PAINÉIS
    // ==========================================

    document
        .querySelectorAll('[data-ac-close]')
        .forEach((botao) => {
            botao.addEventListener('click', close);
        });

    overlay.addEventListener('click', close);

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') {
            close();
        }
    });


    // ==========================================
    // 17. ALTERNAR LOGIN E CADASTRO
    // ==========================================

    $('ac-switch').addEventListener('click', () => {
        setMode(
            mode === 'login' ? 'signup' : 'login'
        );
    });


    // ==========================================
    // 18. SAIR DA CONTA
    // ==========================================

    $('ac-logout').addEventListener(
        'click',
        async () => {
            if (busy) {
                return;
            }

            busy = true;
            $('ac-logout').disabled = true;

            try {
                const { error } = await sb.auth.signOut();

                if (error) {
                    throw error;
                }

                session = null;

                updateAccount();
                voltarMinhaConta();
                close();

                toast('Você saiu da sua conta.');

            } catch (erro) {
                console.error(
                    'Armoire: erro ao sair da conta:',
                    erro
                );

                toast(
                    'Não foi possível sair da conta. Tente novamente.'
                );

            } finally {
                busy = false;
                $('ac-logout').disabled = false;
            }
        }
    );


    // ==========================================
    // 19. MONITORAR ALTERAÇÕES DE SESSÃO
    // ==========================================

    sb.auth.onAuthStateChange(
        (_evento, novaSessao) => {
            session = novaSessao;

            updateAccount();
        }
    );


    // ==========================================
    // 20. INICIALIZAÇÃO
    // ==========================================

    syncSession().catch((erro) => {
        console.error(
            'Armoire: erro ao restaurar sessão',
            erro
        );
    });


// ==========================================
// ABRIR LOGIN AO CLICAR EM FAVORITOS
// ==========================================

document.addEventListener(
    'armoire:solicitar-login',
    () => {
        if (session) {
            return;
        }

        setMode('login');
        open('modal');
    }
    
);
})();

