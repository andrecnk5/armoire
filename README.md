<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="front-end/images/logo.PNG">
    <source media="(prefers-color-scheme: light)" srcset="front-end/images/logoinv.png">
    <img src="front-end/images/logoinv.png" alt="Monograma AC original do Armoire Central" width="144">
  </picture>
</p>

<h1 align="center">Armoire Central</h1>

<p align="center">Trabalho de conclusão de curso (TCC) de catálogo de moda para web e Android.</p>

**[COMEÇAR — HOW-TO](docs/HOW-TO.md)** / **[VER APK](https://expo.dev/accounts/andrecnk5/projects/armoire_central/builds/7cb0545e-da65-4748-b6aa-0c4194e04297)** / **[INSTALAR WINDOWS — ASSISTENTE](scripts/setup-windows.ps1)**

[Código web](front-end/) / [Código mobile](mobile/)

> **Windows 11: assistente publicado, ainda NÃO validado na prática na VM.** Revise com o professor e use `-WhatIf` antes de qualquer instalação real. Consulte a [configuração do Windows 11](#configuração-do-windows-11) e o [roteiro de teste](docs/TESTE-VM-WINDOWS11.md).

[Estado do projeto](#estado-do-projeto) / [Comece aqui](#comece-aqui) / [APK Android](#apk-android) / [Estrutura](#estrutura) / [Colaboração](#colaboração) / [Documentação](#documentação) / [Autoria](#autoria)

## Conheça o projeto

Projeto acadêmico de catálogo de moda, com uma versão web e um aplicativo Android. A identidade visual e os materiais originais são da equipe de estudantes do Armoire Central.

<p align="center">
  <img src="front-end/images/banneraf.png" alt="Banner editorial do projeto: modelo com camisa escura e calça clara junto a uma fachada de pedra" width="640">
</p>

*Imagem editorial já utilizada no site; não é uma captura de tela da aplicação.*

## Estado do projeto

| Parte | Estado e limites |
| --- | --- |
| Web | HTML, CSS e JavaScript; home, catálogo, detalhes, carrinho e My Armoire. Fluxos demonstrativos e fallback de catálogo local presentes. |
| Mobile | Expo SDK 57, React Native, React, TypeScript e Expo Router; início, catálogo e detalhes com imagens locais. APK Android aprovado para demonstração, com relatos de teste físico descritos abaixo. |
| Backend e banco | Cliente Supabase e contratos no código. Auth real, schema, políticas RLS e CRUD remoto ainda precisam de validação autorizada. |
| Compra e serviços | Checkout/pagamento, pedidos, newsletter e outros controles da interface são demonstrativos ou estão desabilitados. Não há serviço de vendas em produção comprovado. |
| Assistente Windows | Material publicado; validação prática na VM Windows 11 pendente do professor. |

Não há um servidor de back-end próprio nem scripts de implantação de banco confirmados nesta árvore. A continuidade deve ser combinada com a equipe e o orientador; não se deve escolher PostgreSQL, MySQL ou uma nova stack por suposição. Veja os [limites e contratos Supabase](front-end/INTEGRACAO-SUPABASE.md).

**Web e mobile já foram integrados na `main` em 22/11/2026**, no merge `60246804287dfd19a02604056926f192e010d05d`. O [relatório histórico de validação web](front-end/VALIDACAO-FINAL.md) mantém referências a branches e merges de etapas antigas; as ressalvas de serviços remotos continuam válidas.

## Comece aqui

Leia o **[HOW-TO: do primeiro terminal à execução e ao trabalho em equipe](docs/HOW-TO.md)** antes de instalar ferramentas. Ele explica o que digitar, em qual pasta e como conferir cada resultado.

- **Web:** abra a raiz do clone no VS Code e `front-end/index.html` com **Open with Live Server**. [Passos do perfil web](docs/HOW-TO.md#7-perfil-web).
- **Mobile em desenvolvimento:** confirme sua responsabilidade na branch `in_dev_mobile`; dentro de `mobile`, use `npm.cmd ci` e depois, se concluir sem erro, `npx.cmd expo start`. O guia explica branch, QR e compatibilidade do Expo Go. [Passos do perfil mobile](docs/HOW-TO.md#8-perfil-mobile).
- **Demonstração no Android:** baixe e confira o APK aprovado; o catálogo local instalado dispensa Metro, Expo Go e túnel. [Conferência e instalação do APK](docs/HOW-TO.md#9-demonstrar-com-o-apk-aprovado).
- **Preparação no Windows 11:** revise o assistente e simule primeiro. [Configuração e pendências](#configuração-do-windows-11).

`npm.cmd`/`npx.cmd` são os lançadores Windows de npm/npx e evitam depender da política de execução dos arquivos `.ps1`. Durante o desenvolvimento com Expo Go, o computador normalmente precisa manter o servidor Expo aberto; isso difere do uso do APK instalado.

## APK Android

**APK C5-R4 aprovado para demonstração.** [Registro da build no Expo](https://expo.dev/accounts/andrecnk5/projects/armoire_central/builds/7cb0545e-da65-4748-b6aa-0c4194e04297) / [Baixar APK aprovado](https://expo.dev/artifacts/eas/5r_Kg7ciOsvWifWT4ytKrfskbxdqjWFiYED8dbeFxyQ.apk).

O professor relatou instalação, navegação e **uso offline no Moto G82**. Outra estudante relatou funcionamento em um segundo Android de modelo não informado; **não há confirmação de teste offline nesse segundo aparelho**. Esses relatos não são novos testes deste kit.

O **APK instalado não precisa de Metro, Expo Go ou túnel** para demonstrar seu catálogo local.

<details>
<summary>Informações técnicas e conferência do APK</summary>

- Tamanho: **131.908.719 bytes**.
- SHA-256: `43eeddc9e250eba6f855a188ac15de8bf1cd56dde30f1a59304d7355a13fb65e`.
- Identificador Android: `com.armoirecentral.demo`.
- Versão: `1.0.0`; versionCode: `1`.

Veja [como conferir o download](docs/HOW-TO.md#9-demonstrar-com-o-apk-aprovado) antes da instalação. Se tamanho ou hash divergirem, pare e confira a origem com o professor.

</details>

A assinatura Android fica sob custódia Expo do orientador. Não compartilhe senha, token, keystore ou chave privada; não gere outra assinatura nem uma nova build sem orientação. O APK deve ficar **fora do Git**.

## Configuração do Windows 11

> **Script PowerShell ainda NÃO validado na prática na VM Windows 11.** A publicação documental deste kit não altera as aplicações nem comprova o funcionamento do assistente. O professor deve seguir o [roteiro de teste na VM](docs/TESTE-VM-WINDOWS11.md).

Tenha internet, espaço livre e autorização para instalar programas. Use PowerShell do **Windows**, sem precisar abri-lo como administrador.

1. Obtenha o kit na `main` deste repositório ou receba a cópia do professor, conservando `README.md`, `docs/` e `scripts/`. Guarde-o **fora da futura pasta do clone**, por exemplo em `Downloads\armoire-kit`.
2. Revise o [script](scripts/setup-windows.ps1) e confirme sua origem com o professor. Na raiz do kit, simule primeiro com `-WhatIf`; ajuste o caminho se necessário:

   ```powershell
   Set-Location "$HOME\Downloads\armoire-kit"
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -WhatIf -Profile Mobile
   ```

3. Depois de revisar o plano, siga o [procedimento do assistente no HOW-TO](docs/HOW-TO.md#caminho-recomendado-assistente) para a execução real e confira `$LASTEXITCODE`. O guia concentra as perguntas de perfil, pasta, ferramentas, clone, branch, extensões e identidade Git.

A simulação não instala, clona, grava log ou faz perguntas. `Bypass` vale apenas para esse processo; não muda a política permanente. Se políticas da escola bloquearem a execução, peça orientação, sem tentar contorná-las.

O padrão do clone é `$HOME\Projetos\armoire`. Após instalar ferramentas, pode ser necessário fechar todo o VS Code/terminal e abrir novamente. O assistente **não instala dependências do aplicativo automaticamente**.

**Atenção ao clone Windows:** existem **57 metadados históricos `:Zone.Identifier`**, inválidos para checkout no Windows. O assistente usa `--no-checkout` e sparse-checkout para omitir apenas esses metadados no disco; não os apaga do histórico nem altera o aplicativo. Use o [clone manual explicado](docs/HOW-TO.md#5-clonar-sem-sobrescrever-arquivos) em vez de um clone comum ou de extrair indiscriminadamente um ZIP do repositório.

<details>
<summary>Versões de referência e perfis do kit</summary>

Consulta oficial registrada em **22/11/2026**; execução real no Windows ainda pendente de teste do professor.

| Item | Referência do kit |
| --- | --- |
| Windows | Windows 11; PowerShell 5.1 incluído ou PowerShell 7 já instalado |
| Git for Windows | Estável 2.56.1; ID WinGet `Git.Git`, sem atualizar instalação existente automaticamente |
| VS Code | Stable 1.147.0; ID `Microsoft.VisualStudioCode`, instalação por usuário quando ausente |
| Node.js | **26.13.1 LTS**; ID `OpenJS.NodeJS.LTS`, versão fixada para instalação nova no perfil mobile |
| Dependências mobile | Lockfile: Expo 57.0.33, Expo Router 57.0.31, React Native 0.86.3, React 19.2.3 |

O perfil web usa Git/VS Code e Live Server; Node é opcional para suas verificações. O perfil mobile acrescenta Node/npm. O perfil back-end instala somente ferramentas comuns e deixa a stack por decidir. Fontes e faixas de compatibilidade estão no [HOW-TO](docs/HOW-TO.md#3-versoes-e-instalacao-das-ferramentas).

</details>

## Estrutura

```text
armoire/
  README.md
  docs/                        # HOW-TO.md e TESTE-VM-WINDOWS11.md
  scripts/setup-windows.ps1     # assistente Windows 11
  front-end/
    index.html                 # início web
    produtos.html              # catálogo web
    produto.html               # detalhe web
    my-armoire.html             # área de composição/conta
    css/  js/  images/  tests/
    INTEGRACAO-SUPABASE.md
    VALIDACAO-FINAL.md
  mobile/
    app.json  eas.json
    package.json  package-lock.json
    src/app/                   # telas e navegação
    src/components/  src/data/  src/hooks/
    assets/
```

[O README original do app](mobile/README.md) e [sua licença original](mobile/LICENSE) são materiais preservados. Há também arquivos históricos fora do início rápido; não os apague por conta própria.

## Colaboração

- **`main`:** reúne as entregas aprovadas.
- **`in_dev_front-end`:** trilha web.
- **`in_dev_mobile`:** trilha mobile.

Combine a branch e os arquivos sob sua responsabilidade antes de editar. O orientador deve conceder permissão no GitHub a quem for publicar alterações; poder ler o repositório não concede autorização de escrita. Leia [Git no dia a dia](docs/HOW-TO.md#6-git-no-dia-a-dia) para atualizar somente com árvore limpa, fazer commit seletivo e parar em conflitos. **Não use force push.**

A continuidade de backend e banco depende de definição com a equipe e o professor; não crie branch de back-end por conta própria. APKs, credenciais, caches, backups e dependências instaladas não entram no commit. O `.easignore` filtra o pacote EAS, mas **não substitui o `.gitignore`**.

## Documentação

- [HOW-TO dos estudantes](docs/HOW-TO.md) — ambiente, execução, versões, Git e erros comuns.
- [Assistente Windows 11](scripts/setup-windows.ps1) — revisar e simular com `-WhatIf` antes de instalar.
- [Roteiro de teste na VM Windows 11](docs/TESTE-VM-WINDOWS11.md) — validação prática pendente.
- [Integração Supabase](front-end/INTEGRACAO-SUPABASE.md) — contratos e limites de segurança e serviços remotos.
- [Validação web](front-end/VALIDACAO-FINAL.md) — evidências históricas, anteriores à integração atual.
- [README original do mobile](mobile/README.md) — material original preservado.

## Autoria

A autoria original é da **equipe de estudantes do Armoire Central**. O histórico Git, a identidade visual e os materiais originais devem ser preservados. Este documento não acrescenta nomes de integrantes que não tenham sido confirmados, nem apresenta o TCC como empresa ou serviço de vendas em produção.
