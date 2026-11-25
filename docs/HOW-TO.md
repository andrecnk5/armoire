# Armoire Central: HOW-TO do zero no Windows 11

Este guia é para quem está começando a usar terminal, Git e ferramentas de desenvolvimento. Faça uma etapa de cada vez e confira o resultado antes de continuar. Não é preciso instalar tudo que aparece em tutoriais da internet.

**Estado documental em 25/11/2026:** web e mobile integrados na `main`; **script PowerShell ainda NÃO validado na prática na VM Windows 11. Use `-WhatIf` antes de qualquer instalação real** e siga o roteiro do professor. Este guia descreve o código existente, sem prometer um back-end completo. [Voltar ao README](../README.md) · [Script](../scripts/setup-windows.ps1) · [Teste na VM](TESTE-VM-WINDOWS11.md).

## 1. Entender o ambiente

**Windows 11** é o sistema operacional. **PowerShell** é o programa que interpreta os comandos. **Windows Terminal** é uma janela que pode abrir abas de PowerShell e de outros ambientes. O terminal integrado do **VS Code** também executa PowerShell.

Abra o menu Iniciar e procure **Windows PowerShell**, ou escolha uma aba PowerShell no Terminal. No VS Code: menu **Terminal → Novo Terminal**; confira que o perfil é PowerShell. Para este guia, não escolha Ubuntu/WSL, Git Bash ou Prompt de Comando. Seus comandos e caminhos podem ser diferentes.

Uma linha como `PS C:\Users\...>` é o aviso de que o terminal está pronto. **Não copie esse prefixo**, apenas o comando dentro dos blocos. Digite uma linha por vez e pressione Enter. Não copie as cercas de três crases que delimitam os exemplos.

| Termo | Significado neste projeto |
| --- | --- |
| Pasta/diretório | Lugar onde ficam arquivos; por exemplo, `front-end` ou `mobile`. |
| Arquivo | Documento ou código, como `README.md` e `package.json`. |
| Caminho | Endereço de uma pasta/arquivo no computador. |
| Repositório | Arquivos do projeto e histórico de alterações controlado pelo Git. |
| Clone | Sua cópia local do repositório do GitHub. |
| Branch | Linha de trabalho com seu próprio histórico. |
| Commit | Registro local de um conjunto de mudanças escolhidas. |
| Push | Envio de commits locais para a branch remota autorizada. |

Experimente comandos de leitura:

```powershell
Get-Location
Get-ChildItem
```

O primeiro mostra a pasta atual; o segundo lista o conteúdo. Para entrar numa pasta, use `Set-Location`, também chamado `cd`. `..` significa a pasta acima. Aspas protegem caminhos com espaços:

```powershell
Set-Location "$HOME\Projetos\armoire"
Set-Location .\mobile
Set-Location ..
```

`$HOME` é a pasta do seu usuário no Windows. Não a redefina. O caminho gerado pelo kit usa `Projetos\armoire`, sem acentos; o nome da pasta do usuário pode ter acentos. Se isso causar problema em uma ferramenta, combine um caminho curto como `C:\Projetos\armoire`. Não mova um checkout com trabalho aberto sem orientação.

## 2. Preparar contas e permissões

Você precisa de Windows 11, acesso à internet para instalações/clone/dependências, espaço livre e autorização da escola para instalar programas. Comece sem executar o terminal como administrador. Alguns instaladores podem mostrar o **UAC**, a janela de confirmação do Windows. Se precisar de uma senha administrativa que você não possui, cancele e peça ajuda; o script não se eleva sozinho.

Crie/use sua própria conta no [GitHub](https://github.com/). Peça ao professor acesso ao repositório e aceite o convite. Poder ler um repositório público não significa poder enviar alterações. Git é o programa local; GitHub é o serviço remoto.

No Git for Windows, mantenha o **Git Credential Manager** no instalador. Quando uma operação HTTPS exigir login, ele pode abrir uma janela no navegador. Confira o domínio GitHub, entre na **sua** conta e complete a autenticação de dois fatores se solicitada. Não use a senha do orientador. Não coloque token ou senha em um comando de clone, arquivo `.env`, captura de tela ou mensagem de erro enviada ao grupo. [Orientação oficial de autenticação HTTPS](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git).

Nome e e-mail do Git identificam a autoria dos commits; **não fazem login**. Veja a configuração na seção 5. Para Expo Go, use o aplicativo oficial no Android e confira a compatibilidade com SDK 57; uma conta Expo própria pode ser necessária conforme o fluxo. O APK pronto não exige login Expo para executar o catálogo local.

## 3. Versoes e instalacao das ferramentas

### Referência conferida

Consulta em **22/11/2026**. Não instale uma versão Alpha/Current apenas por ser mais nova. A versão do projeto é determinada por `mobile/package.json` e `mobile/package-lock.json`, não pelo último tutorial disponível.

| Ferramenta | Referência | Como conferir no PowerShell |
| --- | --- | --- |
| PowerShell | 5.1 do Windows ou 7 existente; nenhum dos dois é instalado pelo kit | `$PSVersionTable.PSVersion` |
| WinGet | Versão estável fornecida pelo App Installer do Windows 11 | `winget --version` |
| Git for Windows | 2.56.1 estável na consulta; WinGet pode oferecer revisão diferente | `git --version` |
| VS Code | 1.147.0 Stable na consulta; preservar instalação existente | `code --version` |
| Node.js | **26.13.1 LTS**, referência para nova instalação mobile | `node --version` |
| npm | Incluído no instalador Node; não atualizar separadamente por impulso | `npm.cmd --version` |

A [página oficial Node](https://nodejs.org/en/download) confirma 26.13.1 LTS, e o [calendário de versões](https://nodejs.org/en/about/previous-releases) distingue LTS de Alpha/EOL. A tabela oficial do [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) indica Node mínimo 22.13.x. No lockfile local, React Native 0.86.3 e Metro aceitam `^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0`; combinando requisitos e linhas LTS atuais, o assistente aceita instalações existentes 22.13+, 24.3+ ou 26.13.1+, dentro dessas mesmas versões principais. Isso é compatibilidade declarada, não garantia de teste Windows de todas essas versões. A referência escolhida continua **26.13.1**. Node 25 está EOL e Node 27 Alpha não é a recomendação.

No mobile, o lock fixa Expo 57.0.33, Expo Router 57.0.31, React Native 0.86.3, React 19.2.3 e TypeScript 6.0.3. Não atualize esses pacotes, não apague o lockfile e não rode `expo install --fix` para tentar resolver qualquer erro.

### Caminho recomendado: assistente

O script fica em `scripts/setup-windows.ps1`, publicado na `main` deste repositório. Obtenha os quatro arquivos do kit na `main` verificada ou receba a cópia do professor, mantendo sua estrutura em uma pasta separada, por exemplo `Downloads\armoire-kit`. A publicação do material não comprova o teste prático no Windows 11.

Abra o arquivo no Bloco de Notas ou VS Code e revise o conteúdo com o professor. Não execute um script cuja origem você não conferiu. O arquivo não está assinado digitalmente; se a escola exigir assinatura, peça uma distribuição assinada pelo responsável. Não altere políticas da instituição.

Na raiz do kit, simule primeiro:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -WhatIf -Profile Mobile -InstallPath "$HOME\Projetos\armoire"
$LASTEXITCODE
```

O plano aparece sem perguntas e sem executar programas externos, acessar a rede, instalar, clonar, criar pasta ou log. A escolha `-Profile Web` mostra o perfil web; `-Profile Backend` mostra somente ferramentas comuns. Para ajuda:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -Help
```

Depois de revisar o plano, execute:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
```

Quem já usa PowerShell 7 pode trocar `powershell` por `pwsh`. Não é necessário instalar PowerShell 7 para usar o kit. `-NoProfile` evita carregar personalizações. `-ExecutionPolicy Bypass` afeta **somente o processo iniciado**; não muda a configuração global, do usuário ou da máquina. Políticas de grupo têm precedência. Não execute comandos de liberação permanente. [Escopos e limites oficiais das políticas](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies).

O assistente pergunta:

1. Perfil: Web, Mobile ou Backend a avaliar.
2. Pasta do clone; Enter mantém `$HOME\Projetos\armoire`. Essa escolha não determina onde os programas serão instalados.
3. Confirmação do plano antes das escritas.
4. Log opcional em `%LOCALAPPDATA%\ArmoireSetup\Logs`, fora do clone; `-NoLog` pula a oferta.
5. Instalação individual de ferramentas ausentes, com instalador/UAC visível. Uma instalação detectada fora do PATH não é duplicada.
6. Clone novo ou inspeção do checkout existente; confirmação separada para trocar branch e para atualizar com `pull --ff-only`.
7. Extensões: ESLint e Prettier; no web, Live Server; no mobile, Expo Tools. Extensões existentes são preservadas. Não se ativa formatação automática nem se altera configuração do projeto.
8. Nome/e-mail Git somente se ausentes, com confirmação e escopo local. Nunca pede senha ou token.
9. Resumo de ferramentas e pendências.

O script não roda `npm ci`, abre servidor, instala Android Studio, Docker ou banco, cria backend, faz commit/push, nem gera APK. ESLint/Prettier são ferramentas de edição: não autorizam refatorar ou formatar o projeto inteiro. A extensão ESLint pode indicar que falta configuração/dependência; não gere arquivos de configuração nem instale ESLint no projeto sem combinar.

Depois de instalar ferramentas, **feche e abra novamente todo o VS Code/Terminal** se os comandos continuarem ausentes. O script não altera o PATH global e pula os passos dependentes até você reabrir. É seguro repetir: pasta existente não é sobrescrita, ferramentas/extensões detectadas não são reinstaladas, identidade existente não é substituída. Atualizar ou mudar branch exige nova confirmação e árvore limpa.

Código final, consultado com `$LASTEXITCODE` logo depois do comando: `0` = simulação, conclusão sem pendências ou cancelamento voluntário do plano; `1` = houve passos pendentes (por exemplo, reabrir terminal); `2` = bloqueio/erro Git ou destino inválido. Se falhar um clone, a pasta parcial fica preservada; não repita por cima nem apague seus arquivos. Envie o resumo ao professor.

### Instalação manual, se necessária

O [WinGet oficial](https://learn.microsoft.com/en-us/windows/package-manager/winget/) faz parte do **Instalador de Aplicativo / App Installer**, distribuído pela Microsoft Store. Se não existir `winget`, procure e atualize esse componente na Store, abra-o/inicie a sessão Windows e reabra o terminal. Computadores gerenciados podem impedir seu uso. Não baixe scripts de instalação de sites desconhecidos.

Somente para ferramentas **ausentes**, após conferir os comandos da tabela:

```powershell
winget install --id Git.Git --exact --source winget --no-upgrade --interactive
winget install --id Microsoft.VisualStudioCode --exact --source winget --scope user --no-upgrade --interactive
```

Para desenvolver o mobile, se Node estiver ausente:

```powershell
winget install --id OpenJS.NodeJS.LTS --exact --source winget --version 26.13.1 --no-upgrade --interactive
```

`--id` escolhe o pacote; `--exact` evita seleção ambígua; `--source winget` fixa a fonte; `--version` fixa a recomendação Node; `--no-upgrade` evita atualizar uma instalação existente; `--interactive` mantém o instalador visível. Leia os acordos apresentados. Se a versão fixada não estiver disponível, pare e peça orientação, sem trocar por Alpha ou baixar outro instalador aleatório. [Parâmetros oficiais de instalação](https://learn.microsoft.com/en-us/windows/package-manager/winget/install) e [manifesto Microsoft do Node 26.13.1](https://raw.githubusercontent.com/microsoft/winget-pkgs/master/manifests/o/OpenJS/NodeJS/LTS/26.13.1/OpenJS.NodeJS.LTS.yaml).

Sem WinGet, use os instaladores nos sites oficiais de [Git for Windows](https://git-scm.com/install/windows), [VS Code no Windows](https://code.visualstudio.com/docs/setup/windows) e [Node.js](https://nodejs.org/en/download), com ajuda do professor. VS Code User Setup evita exigir administrador quando permitido. Não instale simultaneamente cópias User e System do Code. O assistente não tenta corrigir uma instalação incompatível existente.

## 4. Escolher o perfil e a branch

| Perfil | Pasta principal | Branch a combinar | Ferramentas iniciais |
| --- | --- | --- | --- |
| Web | `front-end` | `in_dev_front-end` | Git, VS Code, Live Server; Node opcional para verificações |
| Mobile | `mobile` | `in_dev_mobile` | Git, VS Code, Node/npm e Android real/Expo Go compatível |
| Backend a avaliar | Contratos existentes no web | Manter leitura na `main` até decisão | Git e VS Code; nenhuma stack/banco decidido pelo kit |

`main` reúne entregas aprovadas. As branches de desenvolvimento podem não conter todos os arquivos da outra trilha ou a documentação nova publicada apenas na main. A integração feita na main não atualiza automaticamente as duas branches de trabalho. Confirme com o professor **qual branch usar hoje**; não escolha apenas por ela ter mais arquivos.

Guarde o kit fora do clone para continuar lendo as instruções mesmo depois de mudar de branch. Não crie uma branch de backend sem decisão da equipe/orientação.

## 5. Clonar sem sobrescrever arquivos

O assistente já faz este procedimento. Use os comandos abaixo somente se for seguir o caminho manual, com Git funcionando e uma pasta de destino **que ainda não exista**. Não execute os dois caminhos sobre a mesma pasta.

Este repositório preserva 57 arquivos históricos terminados em `:Zone.Identifier`. São metadados de transferência, não código do aplicativo. O Windows [restringe `:` em nomes de arquivo](https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file). Por isso, `git clone` com checkout comum pode terminar com `invalid path` ou `unable to checkout working tree`.

O [sparse-checkout do Git](https://git-scm.com/docs/git-sparse-checkout) permite omitir esses nomes apenas no seu disco, conservando os objetos e autores no histórico. Não desative a proteção NTFS e não remova os arquivos do Git para contornar isso.

No PowerShell:

```powershell
$DestinoArmoire = Join-Path $HOME 'Projetos\armoire'
Test-Path -LiteralPath $DestinoArmoire
```

Se aparecer `True`, **pare**: escolha outra pasta ou peça ajuda para conferir o checkout existente. Não apague nem clone por cima, mesmo se a pasta parecer vazia. Se aparecer `False`, continue:

```powershell
New-Item -ItemType Directory -Path (Split-Path -Parent $DestinoArmoire) -ErrorAction SilentlyContinue
git clone --no-checkout --branch main https://github.com/andrecnk5/armoire.git "$DestinoArmoire"
```

O primeiro comando tenta criar só a pasta pai; se ela já existir, não a substitui. O clone baixa o histórico, mas ainda não materializa os arquivos. **Se qualquer comando Git falhar, pare nesse ponto.** Não cole todo o bloco de uma vez após um erro.

```powershell
@('/*', '!*:Zone.Identifier') | git -C "$DestinoArmoire" sparse-checkout set --no-cone --stdin
git -C "$DestinoArmoire" checkout main
Set-Location "$DestinoArmoire"
git status --short --branch
git remote -v
```

Os padrões incluem os arquivos normais e excluem somente aqueles metadados. Aspas simples conservam os caracteres dos padrões, sem expandi-los. O checkout deve ficar limpo; o remoto deve ser `https://github.com/andrecnk5/armoire.git`. A saída de status esperada é parecida com `## main...origin/main`, sem linhas de arquivos alterados. Não compartilhe uma URL se ela contiver dados de login.

O sparse-checkout não é `.gitignore`: os arquivos omitidos continuam rastreados. Não execute `git sparse-checkout disable` no Windows enquanto esses nomes existirem no histórico. Não extraia o ZIP histórico `mobile/armoire_central.zip` sobre o projeto. Se já houve um clone parcial com erro, preserve a pasta e informe ao professor; uma nova tentativa deve usar destino diferente após o diagnóstico.

Abra a raiz no editor:

```powershell
code .
```

O ponto significa “esta pasta”. Confie no workspace somente depois de conferir que é o projeto do professor.

### Configurar sua autoria

O assistente pode preencher campos ausentes sem substituir os existentes. Manualmente, primeiro confira:

```powershell
git config --get user.name
git config --get user.email
```

Se não houver valor, use **seu próprio** nome e e-mail. Os textos abaixo são marcadores: substitua-os antes de executar; não copie o nome do orientador. Você pode consultar um endereço `noreply` nas configurações de e-mail da sua conta GitHub.

```powershell
git config --local user.name "SEU NOME DE AUTORIA"
git config --local user.email "SEU EMAIL DE COMMIT"
```

`--local` limita a configuração a esse clone. O e-mail de commit pode aparecer no histórico público. Esses comandos não concedem permissão no GitHub. [Configuração Git oficial](https://docs.github.com/en/get-started/git-basics/set-up-git).

## 6. Git no dia a dia

Antes de mexer em arquivos, entre na **raiz do clone** e leia:

```powershell
git status --short --branch
git branch -vv
```

`M` indica alteração, `??` arquivo não rastreado e `A` inclusão preparada. Se houver trabalho local, não mude de branch nem atualize ainda. Salve os arquivos e discuta com o responsável quais mudanças devem ser registradas. Não apague alterações para “deixar verde”.

Com árvore limpa e responsabilidade confirmada, escolha **um** exemplo:

```powershell
git switch in_dev_front-end
```

Ou, para a equipe mobile:

```powershell
git switch in_dev_mobile
```

`switch` muda os arquivos visíveis para aquela linha de trabalho. Em um clone novo, pode criar o acompanhamento local da branch já existente no `origin`. Se a branch não for encontrada ou houver ambiguidade, pare; não crie outra com nome parecido. [Comportamento oficial do switch](https://git-scm.com/docs/git-switch).

Para atualizar **a branch atual**, somente com árvore limpa e antes de começar novas edições:

```powershell
git status --short --branch
git pull --ff-only
```

`--ff-only` permite apenas avançar para os commits remotos quando não há histórias divergentes. Se aparecer `divergent`, `not possible to fast-forward`, conflito, alteração local ou falha de permissão, **pare e envie o diagnóstico ao professor**. Não tente um pull diferente, force, reset, clean ou rebase para “resolver”. O script utiliza explicitamente `origin` e o nome da branch atual; manualmente, confirme o upstream em `git branch -vv` antes de usar o comando abreviado. [Documentação oficial do pull](https://git-scm.com/docs/git-pull).

### Registrar uma alteração autorizada

Depois de editar apenas seus arquivos, confira o diff. Exemplo web **somente quando esse arquivo tiver uma alteração real autorizada**:

```powershell
git status --short --branch
git diff -- front-end/index.html
git add -- front-end/index.html
git diff --cached --name-status
git diff --cached --check
git diff --cached -- front-end/index.html
```

`diff` mostra diferenças; `add --` prepara somente o caminho escolhido; `--cached` mostra o que entrará no commit. Confirme que não há arquivos de outra pessoa, APK, ZIP novo, senha, token, `.env`, keystore, backup, cache, `node_modules` ou `:Zone.Identifier`. O histórico já contém resíduos antigos; isso não autoriza adicionar outros ou fazer uma limpeza fora da tarefa. Não use `git add .` ou `git add -A` neste fluxo.

Somente depois de conferir e realizar a verificação combinada para a mudança:

```powershell
git commit -m "docs(web): explica o fluxo de demonstracao"
git status --short --branch
git push origin in_dev_front-end
```

A mensagem é exemplo; descreva sua alteração real. No mobile, selecione seus caminhos `mobile/...` e publique somente na `in_dev_mobile`, se autorizado. Não dê push na main por conta própria. Commit é local; push publica. Um push rejeitado é motivo para parar, sem usar força. Peça revisão e integração ao responsável.

## 7. Perfil web

### Abrir o site

O web é uma pasta de HTML/CSS/JS; não há `package.json` web nem um comando `npm start` para essa pasta. Não dê duplo clique no HTML para usar como fluxo principal: um servidor HTTP local evita diferenças de origem `file://`.

1. Na raiz do clone, confirme a branch combinada e execute `code .`.
2. Instale a extensão **Live Server**, de Ritwick Dey, ID `ritwickdey.LiveServer`, se ainda estiver ausente. O assistente a oferece no perfil web.
3. No explorador do VS Code, abra `front-end/index.html`, clique com o botão direito e escolha **Open with Live Server**.
4. Use a URL que ele abrir, normalmente `http://127.0.0.1:5500/front-end/index.html` quando a raiz do workspace é o repositório. A porta pode mudar se já estiver ocupada.
5. Para encerrar, use o botão da porta/Go Live na barra de status ou o comando **Live Server: Stop Live Server** na paleta (`Ctrl+Shift+P`). [Instruções do autor da extensão](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).

Se Live Server estiver ausente, com `code` já funcionando, este comando instala somente a extensão na sua conta do editor:

```powershell
code --install-extension ritwickdey.LiveServer
```

Não é necessário criar configuração de servidor no repositório. A [CLI oficial do VS Code](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#_command-line-extension-management) permite listar com `code --list-extensions --show-versions`.

**Alternativa somente se Python já estiver disponível**, sem instalar Python por exigência do kit: na raiz, execute `py -m http.server 8000 --bind 127.0.0.1 --directory front-end`, abra `http://127.0.0.1:8000/index.html` e encerre com `Ctrl+C`. A variante Linux `python3` foi usada nas evidências históricas; não é o nome garantido no Windows.

### O que observar

Percorra home → categoria → catálogo → produto → tamanho/quantidade → carrinho. Depois veja My Armoire e as mensagens de acesso à conta. Use os links da interface: abrir `produto.html` sem identificação do produto deve mostrar um estado de produto ausente, não um produto inventado.

Checkout/pagamento, pedidos, newsletter e controles demonstrativos não devem ser tratados como serviço real. Não crie contas nem faça gravações remotas usando dados pessoais para “testar”. Catálogo local e respostas simuladas dos testes não comprovam Auth, banco ou autorização.

O navegador ainda pode solicitar Supabase, SDK via CDN, ViaCEP, Google Fonts e Font Awesome. Sem internet, parte da aparência/integração pode variar; o web não tem a mesma comprovação offline do APK. Veja os contratos em [INTEGRACAO-SUPABASE](../front-end/INTEGRACAO-SUPABASE.md). O [relatório web](../front-end/VALIDACAO-FINAL.md) preserva resultados e ressalvas históricos; suas recomendações antigas de merge não são o estado atual da main.

## 8. Perfil mobile

### Dependências do projeto

Confirme branch `in_dev_mobile`, Node compatível e npm. Depois, **dentro da pasta mobile**:

```powershell
Set-Location "$HOME\Projetos\armoire"
git status --short --branch
node --version
npm.cmd --version
Set-Location .\mobile
Get-Item .\package.json, .\package-lock.json
npm.cmd ci
```

Altere o primeiro caminho se escolheu outro destino. `npm ci` usa o lockfile para reproduzir dependências, em vez de atualizar versões. Precisa de internet na primeira instalação, baixa pacotes e pode executar scripts das dependências; use apenas a fonte de projeto conferida. Ele recria `node_modules` se essa pasta já existir, portanto não guarde trabalho próprio nela. Não modifica o código-fonte ou reescreve o lock em um fluxo normal. [Comportamento oficial de npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/).

Se `npm ci` terminar com erro, pare antes do comando seguinte. Registre a versão Node, pasta atual e mensagem. Não apague `package-lock.json`, não mude para `npm install` ou `--legacy-peer-deps` por tentativa e erro e não rode correções automáticas de dependências.

### Abrir no Android com Expo Go

Ainda em `mobile`:

```powershell
npx.cmd expo start
```

Isso corresponde a `npx expo start` nos guias Expo; o sufixo `.cmd` evita o lançador PowerShell. O comando usa o Expo instalado no projeto depois de `npm ci`. Se aparecer pedido inesperado para baixar outra versão de Expo, cancele e confira a pasta e a instalação.

Mantenha esse terminal aberto. Deve aparecer o servidor Metro e um QR. No Android, abra o **Expo Go oficial** e use a opção de ler QR. Computador e celular precisam estar na mesma rede para conexão LAN. Permita o acesso do Node apenas na rede confiável quando o Windows perguntar; não desative todo o firewall.

Uma VM pode usar rede NAT que impede o celular de alcançá-la. Nesse caso, o professor decide entre ajustar a rede da VM, usar o computador de desenvolvimento apropriado ou demonstrar com o APK pronto. O modo `npx.cmd expo start --tunnel` é uma alternativa documentada pelo Expo, mas depende de internet e pode pedir uma dependência de túnel; não é necessário para usar o APK. Não instale ngrok nem abra portas por impulso. [Iniciar e conectar segundo o Expo](https://docs.expo.dev/get-started/start-developing/).

**Expo Go precisa ser compatível com SDK 57.** A versão da loja muda com o tempo; não há garantia de que ela abrirá este projeto indefinidamente. Se aparecer SDK mismatch, confira a orientação oficial com o professor. Não atualize o projeto só para combinar com o Expo Go mais novo. Para demonstração imediata, use o APK aprovado. Expo Go também não suporta qualquer módulo nativo arbitrário. [Limites e opções de ambiente Expo](https://docs.expo.dev/get-started/set-up-your-environment/).

`Ctrl+C` no terminal encerra o servidor. `npm.cmd run web` abre a variante web do projeto Expo e `npm.cmd run android` tenta abri-lo em um dispositivo/emulador disponível; **essa variante web não é o site de `front-end/`**. Android Studio/emulador são opcionais para quem precisar deles em tarefa aprovada; a VM não precisa de emulador para validar este kit. Windows não executa o simulador iOS do Xcode.

Os scripts reais incluem `start`, `android`, `ios`, `web`, `lint` e `typecheck`. Para uma verificação de TypeScript combinada com o professor, use `npm.cmd run typecheck` em `mobile`, depois de instalar dependências. O script de lint existe, mas configuração/dependências ESLint podem exigir decisão; não aceite inicializações automáticas que criem arquivos fora da tarefa. Não use `reset-project`: ele é um utilitário do template original, não uma correção de erro.

## 9. Demonstrar com o APK aprovado

Use o [APK C5-R4](https://expo.dev/artifacts/eas/5r_Kg7ciOsvWifWT4ytKrfskbxdqjWFiYED8dbeFxyQ.apk) e o [registro da build](https://expo.dev/accounts/andrecnk5/projects/armoire_central/builds/7cb0545e-da65-4748-b6aa-0c4194e04297). Salve o download **fora do clone**, por exemplo em Downloads. Não é preciso instalar Git/Node para apenas executar esse APK no Android.

No Windows, ajuste o caminho para o arquivo que realmente baixou:

```powershell
$ApkArmoire = "$HOME\Downloads\NOME-REAL-DO-ARQUIVO.apk"
(Get-Item -LiteralPath $ApkArmoire).Length
(Get-FileHash -LiteralPath $ApkArmoire -Algorithm SHA256).Hash
```

Esperado: `131908719` bytes e SHA-256 `43eeddc9e250eba6f855a188ac15de8bf1cd56dde30f1a59304d7355a13fb65e` (maiúsculas/minúsculas do texto do hash não mudam o valor). Se divergir, não instale: confira o link com o professor.

Depois de conferir, transfira/baixe pelo link aprovado no Android. O sistema pode pedir permissão para instalar a partir daquele navegador/gerenciador de arquivos. Autorize apenas a origem necessária, conforme a política da escola; não desative proteções do aparelho. Abra Armoire Central e siga o roteiro de catálogo/detalhes. Se houver aviso de assinatura diferente ou app já existente incompatível, não desinstale por impulso: isso pode perder dados locais; peça orientação.

O APK contém imagens e dados locais e não precisa do servidor Metro. O professor relatou uso offline no Moto G82; uma segunda estudante confirmou funcionamento em outro Android de modelo não informado, sem comprovação específica offline. Não extrapole esses relatos para todos os dispositivos ou serviços remotos.

`mobile/eas.json` tem perfil preview/internal/APK e `app.json` aponta ao projeto Expo do orientador. Isso não concede credenciais aos alunos. Não altere owner/projectId, assinatura ou versão, nem rode uma nova build sem uma tarefa aprovada. Senhas, tokens, keystore e `service_role` nunca entram no Git.

## 10. Perfil backend e banco: decidir antes de instalar

Leia [INTEGRACAO-SUPABASE](../front-end/INTEGRACAO-SUPABASE.md) com o professor. Hoje existem um cliente browser em `front-end/js/armoire-client.js`, uma integração compartilhada e chamadas previstas a Supabase Auth e às tabelas `products`, `favoritos`, `enderecos` e `looks_salvos`. A chave publishable no cliente é pública; não é a chave secreta `service_role`.

Antes de prometer backend funcional, o grupo precisa confirmar: acesso autorizado ao serviço; schema e relações de tabelas; dados de demonstração; permissões e políticas RLS por usuário; Auth real; respostas de leitura/gravação/exclusão; tratamento de falhas e isolamento entre usuários. Testes simulados e filtros do navegador não comprovam essa segurança no servidor.

Combinem quem cuida dessa área, qual serviço será usado e quais tarefas/branches serão autorizadas. O kit não cria `backend/`, servidor, banco ou branch nova, nem instala Docker/PostgreSQL/MySQL/Supabase CLI. A escolha futura deve partir das necessidades e do código real. Não use dados pessoais reais ou credenciais privilegiadas em demonstrações.

## 11. Erros comuns e como parar com segurança

| Sintoma | O que conferir e fazer |
| --- | --- |
| `git` não reconhecido | Feche e reabra terminal/VS Code; confira instalação oficial do Git. Não clone até `git --version` funcionar. |
| `node`/`npm` não reconhecido | Confira Node LTS instalado e reabra o terminal. Use `npm.cmd`; não modifique PATH global por tentativa e erro. |
| `npm.ps1 cannot be loaded` | Use `npm.cmd` e `npx.cmd`. Para o assistente revisado, use o processo `powershell -NoProfile -ExecutionPolicy Bypass -File ...`; políticas da escola podem exigir intervenção do responsável. |
| `winget` ausente | Atualize App Installer na Microsoft Store e reabra o terminal. Se a escola bloquear, use o responsável de TI/instaladores oficiais. |
| WinGet falha/solicita UAC | Leia o erro; confira rede/permissão. Não repita em loop, não execute instalador desconhecido e não eleve todo o script automaticamente. |
| Pasta de clone já existe | Não apague nem sobrescreva. Confirme se é o checkout esperado; caso contrário, escolha destino diferente. |
| `invalid path ... :Zone.Identifier` | Foi tentado um checkout comum. Preserve o clone parcial e peça ajuda; use o procedimento sparse-checkout em uma nova pasta, sem desativar proteção NTFS. |
| Sem internet/proxy | Instalações, clone, npm e serviços remotos podem falhar. Guarde o erro; não desative certificado/TLS. O APK já baixado e conferido continua sendo a opção de demonstração local. |
| `403`, `repository not found`, push negado | Confira URL, conta no navegador, convite e permissão. Não envie tokens ao grupo. Ler um repositório não concede escrita. |
| Git pede senha no terminal | Não use a senha da conta como token. Pare e confira Git Credential Manager/fluxo de navegador com o professor. |
| `not a git repository` | Você está fora do clone. Use `Get-Location` e entre na raiz correta. |
| Branch ausente ou pull/push rejeitado | Não crie uma branch improvisada nem force a operação. Envie `git status --short --branch` e a mensagem ao professor. |
| Porta ocupada (`EADDRINUSE`) | Confira se já há servidor aberto em outro terminal. Encerre o seu com `Ctrl+C`/Stop Live Server ou aceite outra porta oferecida; não mate processos desconhecidos. |
| Caminhos `/home/...` ou `python3` não funcionam | São exemplos Linux/WSL. Neste roteiro use PowerShell Windows, caminhos `C:\...` e os comandos Windows informados. Não misture `node_modules` Windows e WSL. |
| Expo Go SDK mismatch | Confira SDK 57 e compatibilidade do Expo Go com o professor; use o APK aprovado para demonstração. Não atualize o projeto arbitrariamente. |
| QR não conecta | Mesma rede, servidor aberto, firewall na rede confiável e rede NAT da VM. Túnel só após entender a necessidade. |
| `npm ci` falha por lock/engines | Confira pasta `mobile`, versões Node/npm e branch; envie o erro. Não apague lock nem aceite correções automáticas. |
| Imagens não aparecem | Confira branch e caminhos, inclusive maiúsculas/minúsculas. No mobile os quatro PNGs corretos estão na versão consolidada; não renomeie JPEG como PNG. No web confira a URL/servidor e erros de rede do navegador. |
| Extensão ausente/ESLint pede configuração | Confira `code --list-extensions`; reabra o editor. Não instale pacote de extensões nem gere configuração do projeto sem tarefa autorizada. |

## 12. Checklist do aluno e devolutiva

- [ ] Consigo explicar qual pasta estou usando e qual é minha branch autorizada.
- [ ] Ferramentas necessárias respondem com versão; não instalei banco/emulador sem necessidade.
- [ ] Clone tem o remoto correto; entendo por que os metadados `:Zone.Identifier` foram omitidos.
- [ ] Consegui abrir a parte web/mobile sob minha responsabilidade e encerrar o servidor.
- [ ] Entendo a diferença entre Expo Go/Metro e APK pronto.
- [ ] Sei quais funções são demonstrativas e quais integrações remotas ainda não foram validadas.
- [ ] Sei usar status/diff/add seletivo antes de um commit; não publiquei artefatos ou segredos.
- [ ] Registrei qualquer erro antes de tentar outra operação e preservei meu trabalho.

Ao pedir ajuda, envie: perfil, versão Windows/PowerShell, versões das ferramentas, pasta atual sem dados privados desnecessários, branch, comando executado, código de saída e mensagem do erro. Informe o que funcionou e o que ficou pendente. Revise o texto/captura antes de compartilhar; retire senhas, tokens, e-mails pessoais e URLs autenticadas. O log do assistente é um resumo, não um histórico completo do terminal.

O professor deve usar o [roteiro da VM](TESTE-VM-WINDOWS11.md) e devolver os resultados para a validação prática do kit. A publicação documental foi autorizada separadamente e não comprova esse teste.
