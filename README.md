# Armoire Central

<img src="front-end/images/logo.PNG" alt="Armoire Central" width="160">

Projeto acadêmico de catálogo de moda, com uma versão web e um aplicativo Android. A autoria original é da equipe de estudantes do Armoire Central; o histórico Git e os materiais originais devem ser preservados. Este documento não acrescenta nomes de integrantes que não tenham sido confirmados.

**Script PowerShell ainda NÃO validado na prática na VM Windows 11.** O professor deve seguir o roteiro de teste e usar `-WhatIf` antes de qualquer instalação real. A publicação documental deste kit não altera as aplicações nem comprova o funcionamento do assistente no Windows.

## Por onde começar

- [HOW-TO: do primeiro terminal à execução e ao trabalho em equipe](docs/HOW-TO.md).
- [Assistente PowerShell para Windows 11](scripts/setup-windows.ps1).
- [Roteiro de teste do professor na VM](docs/TESTE-VM-WINDOWS11.md).
- [Limites e contratos da integração Supabase](front-end/INTEGRACAO-SUPABASE.md).
- [Evidências históricas da validação web](front-end/VALIDACAO-FINAL.md).

Leia o HOW-TO antes de instalar ferramentas. Ele explica o que digitar, em qual pasta e como conferir cada resultado.

## O que existe e funciona

| Parte | Estado e limites |
| --- | --- |
| Web | HTML, CSS e JavaScript; home, catálogo, detalhes, carrinho e My Armoire. Fluxos demonstrativos e fallback de catálogo local estão presentes. |
| Mobile | Expo SDK 57, React Native, React, TypeScript e Expo Router; início, catálogo e detalhes com imagens locais. APK Android aprovado disponível abaixo. |
| Conta e dados remotos | Cliente Supabase e contratos no código. Auth real, schema, políticas RLS e CRUD remoto ainda precisam de validação autorizada. |
| Compra e serviços | Checkout/pagamento, pedidos, newsletter e outros controles identificados na interface são demonstrativos ou estão desabilitados. Não há serviço de vendas em produção comprovado. |

Não há um servidor de back-end próprio nem scripts de implantação de banco confirmados nesta árvore. A continuidade dessa parte deve ser combinada com a equipe e o orientador; não se deve escolher PostgreSQL, MySQL ou uma nova stack por suposição.

O documento histórico de validação web contém referências a branches e merges de etapas antigas. **Web e mobile já foram integrados na `main` em 22/11/2026**, no merge `60246804287dfd19a02604056926f192e010d05d`. As ressalvas de serviços remotos continuam válidas.

## Estrutura

```text
armoire/
  README.md
  docs/
    HOW-TO.md
    TESTE-VM-WINDOWS11.md
  scripts/
    setup-windows.ps1
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

[O README original do app](mobile/README.md) e [sua licença original](mobile/LICENSE) são materiais preservados. Há também arquivos históricos que não fazem parte do início rápido; não os apague por conta própria.

## Início rápido no Windows 11

Tenha internet, espaço livre e autorização para instalar programas. Use PowerShell do **Windows**, sem precisar abri-lo como administrador. O orientador deve conceder permissão no GitHub a quem for publicar alterações.

1. Obtenha o kit na `main` deste repositório ou receba a cópia do professor, conservando `README.md` e as pastas `docs/` e `scripts/`. Guarde uma cópia fora da futura pasta do clone, por exemplo em uma pasta `armoire-kit` dentro de Downloads.
2. Revise o script e confirme a origem com o professor. No PowerShell, entre na pasta do kit e simule:

   ```powershell
   Set-Location "$HOME\Downloads\armoire-kit"
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -WhatIf -Profile Mobile
   ```

   Troque o caminho se salvou o kit em outro lugar. A simulação não instala, clona, grava log ou faz perguntas. `Bypass` vale apenas para esse processo; não muda a política permanente. Políticas da escola podem bloquear a execução: nesse caso, peça orientação, sem tentar contorná-las.

3. Depois de revisar o plano, execute o assistente real:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
   $LASTEXITCODE
   ```

   Escolha perfil, pasta, ferramentas, clone, branch, extensões e identidade Git nas perguntas. O padrão do clone é `$HOME\Projetos\armoire`. Após instalar ferramentas, pode ser necessário fechar todo o VS Code/terminal e abrir novamente. O assistente não instala dependências do aplicativo automaticamente.

4. Para **web**, abra a raiz do clone no VS Code, abra `front-end/index.html` e escolha **Open with Live Server**. Siga a [seção web](docs/HOW-TO.md#7-perfil-web).
5. Para **mobile**, confirme a responsabilidade na branch `in_dev_mobile` e siga a [seção mobile](docs/HOW-TO.md#8-perfil-mobile):

   ```powershell
   Set-Location "$HOME\Projetos\armoire"
   git status --short --branch
   Set-Location .\mobile
   npm.cmd ci
   npx.cmd expo start
   ```

   `npm.cmd`/`npx.cmd` são os lançadores Windows dos comandos npm/npx. Eles evitam depender da política de execução dos arquivos `.ps1`. O HOW-TO explica a conferência da branch, o QR e as limitações do Expo Go.

**Atenção ao clone Windows:** existem 57 metadados históricos com nomes `:Zone.Identifier`, inválidos para checkout no Windows. O assistente usa `--no-checkout` e sparse-checkout para omitir apenas esses metadados no disco. Não os apaga do histórico nem altera o aplicativo. Use o [clone manual explicado](docs/HOW-TO.md#5-clonar-sem-sobrescrever-arquivos) em vez de um clone comum ou de extrair indiscriminadamente um ZIP do repositório.

## Versões de referência

Consulta oficial em **22/11/2026**; execução real no Windows ainda pendente de teste do professor.

| Item | Referência do kit |
| --- | --- |
| Windows | Windows 11; PowerShell 5.1 incluído ou PowerShell 7 já instalado |
| Git for Windows | Estável 2.56.1; ID WinGet `Git.Git`, sem atualizar instalação existente automaticamente |
| VS Code | Stable 1.147.0; ID `Microsoft.VisualStudioCode`, instalação por usuário quando ausente |
| Node.js | **26.13.1 LTS**, ID `OpenJS.NodeJS.LTS`, versão fixada para instalação nova no perfil mobile |
| Dependências mobile | Lockfile: Expo 57.0.33, Expo Router 57.0.31, React Native 0.86.3, React 19.2.3 |

O perfil web usa Git/VS Code e Live Server; Node é opcional para suas verificações. O perfil mobile acrescenta Node/npm. O perfil back-end instala somente ferramentas comuns e deixa a stack por decidir. Fontes e faixas de compatibilidade estão no [HOW-TO](docs/HOW-TO.md#3-versoes-e-instalacao-das-ferramentas).

## APK aprovado para demonstração

- [Build C5-R4 no Expo](https://expo.dev/accounts/andrecnk5/projects/armoire_central/builds/7cb0545e-da65-4748-b6aa-0c4194e04297).
- [Download do APK aprovado](https://expo.dev/artifacts/eas/5r_Kg7ciOsvWifWT4ytKrfskbxdqjWFiYED8dbeFxyQ.apk).
- Tamanho: **131.908.719 bytes**.
- SHA-256: `43eeddc9e250eba6f855a188ac15de8bf1cd56dde30f1a59304d7355a13fb65e`.
- Identificador Android: `com.armoirecentral.demo`; versão `1.0.0`, versionCode `1`.

O professor relatou instalação, navegação e uso offline no Moto G82. Outra estudante relatou funcionamento em um segundo Android de modelo não informado; não há confirmação de teste offline nesse segundo aparelho. Esses relatos não são novos testes deste kit.

O **APK instalado não precisa de Metro, Expo Go ou túnel** para demonstrar seu catálogo local. Durante o desenvolvimento com Expo Go, o computador normalmente precisa manter o servidor Expo aberto. Não confunda os dois modos.

A assinatura Android fica sob custódia Expo do orientador. Não compartilhe senha, token, keystore ou chave privada; não gere outra assinatura nem uma nova build sem orientação. O APK deve ficar **fora do Git**. Veja [como conferir o download](docs/HOW-TO.md#9-demonstrar-com-o-apk-aprovado).

## Trabalho em equipe

`main` reúne as entregas aprovadas; `in_dev_front-end` é a trilha web e `in_dev_mobile` a trilha mobile. Combine a branch e os arquivos sob sua responsabilidade antes de editar. Leia [Git no dia a dia](docs/HOW-TO.md#6-git-no-dia-a-dia) para atualizar somente com árvore limpa, fazer commit seletivo e parar em conflitos.

Não crie branch de back-end por conta própria. APKs, credenciais, caches, backups e dependências instaladas não entram no commit. O `.easignore` filtra o pacote EAS, mas **não substitui o `.gitignore`**.
