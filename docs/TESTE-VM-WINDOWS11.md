# Teste do kit na VM Windows 11

**Pré-validação do professor — 22/11/2026.** O kit foi preparado no WSL; execução de PowerShell/WinGet no Windows ainda precisa ser comprovada. [HOW-TO](HOW-TO.md) · [README](../README.md) · [Script](../scripts/setup-windows.ps1).

## 1. Preparar e registrar o estado inicial

Use uma VM própria, com snapshot de recuperação e sem trabalho estudantil. Não execute o script no notebook principal para fazer esse teste. Copie o kit mantendo `README.md`, `docs/` e `scripts/` em uma pasta separada da futura pasta do clone. **Não use o ZIP do repositório como clone Windows:** o histórico contém nomes `:Zone.Identifier`; o assistente tem um tratamento específico para eles.

Abra PowerShell como usuário comum. Registre no formulário ao fim:

```powershell
$PSVersionTable.PSVersion
[Environment]::OSVersion.Version
Get-ExecutionPolicy -List
Get-Command winget.exe, git.exe, node.exe, npm.cmd, code.cmd -ErrorAction SilentlyContinue
winget --version
git --version
node --version
npm.cmd --version
code --version
```

Um comando ausente nesta etapa é uma observação de baseline, não falha do kit. Registre também a rede da VM (NAT/bridge) e espaço livre. Se já houver VS Code, anote `code --list-extensions --show-versions` para comparar. Não inclua senhas ou tokens no registro.

## 2. Revisar e simular

Revise o PS1 e confirme a origem com a coordenação. Da raiz do kit, use primeiro o Parser do próprio PowerShell, sem executar o assistente:

```powershell
$TokensArmoire = $null
$ErrosArmoire = $null
[System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path .\scripts\setup-windows.ps1).Path, [ref]$TokensArmoire, [ref]$ErrosArmoire) | Out-Null
$ErrosArmoire | Format-List
$ErrosArmoire.Count
```

Esperado: nenhum erro listado, contagem `0`. Se houver erro, pare e devolva a mensagem antes de executar o script. Esse teste não pôde ser feito no WSL de preparação porque não havia PowerShell instalado. Depois, execute:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -Help
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -WhatIf -Profile Mobile -InstallPath "$HOME\Projetos\Armoire VM"
$LASTEXITCODE
```

Repita a simulação com `-Profile Web` e `-Profile Backend`. Esperado: nenhum prompt, rede/instalação, clone, pasta ou log criado. A saída deve mostrar o plano e os comandos encontrados. Compare estado das ferramentas, existência do destino e pasta de logs antes/depois. Bypass é apenas deste processo; a lista de políticas persistentes deve continuar igual.

Se PowerShell 7 já estiver na VM, repita `-Help` e `-WhatIf` com `pwsh`. Não é necessário instalar 7 só para testar; registre explicitamente qual versão foi executada.

## 3. Executar o fluxo real

Use o perfil Mobile para cobrir Git/VS Code/Node. O destino com espaço testa o tratamento de argumentos:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -Profile Mobile -InstallPath "$HOME\Projetos\Armoire VM"
$LASTEXITCODE
```

Confira que ele mostra o plano antes de escrever, pede confirmação para instalar cada ferramenta ausente, explica UAC e não se eleva. Acordos WinGet ficam visíveis; recusa ou falha gera pendência, sem nova tentativa automática. Se App Installer estiver ausente/bloqueado, registre o resultado e siga somente os passos independentes que já forem possíveis.

Se comandos continuarem fora do PATH após uma instalação, o resultado esperado é pedir para reabrir o terminal e pular os dependentes. Feche todo o Terminal/VS Code, abra novamente e rode o mesmo comando. Não altere PATH/política global para completar o teste.

Confirme clone, branch e extensões quando solicitado. Só autorize atualizar com `pull --ff-only` se o checkout estiver limpo. Na identidade Git, use dados de teste apropriados do professor; o script não deve pedir senha/token nem substituir campos já existentes.

## 4. Conferir clone, versões e arquivos

```powershell
$RepoTesteArmoire = Join-Path $HOME 'Projetos\Armoire VM'
git -C "$RepoTesteArmoire" remote -v
git -C "$RepoTesteArmoire" status --short --branch
git -C "$RepoTesteArmoire" branch -vv
git -C "$RepoTesteArmoire" config --get core.sparseCheckout
git -C "$RepoTesteArmoire" sparse-checkout list
git -C "$RepoTesteArmoire" ls-files '*:Zone.Identifier'
node --version
npm.cmd --version
code --list-extensions --show-versions
```

Esperado: remoto Armoire HTTPS, branch selecionada, estado limpo antes de instalar dependências, Node 26.13.1 em instalação nova e extensões escolhidas. Versões existentes compatíveis são preservadas, não substituídas.

Os padrões sparse devem ser `/*` e `!*:Zone.Identifier`; `ls-files` ainda lista os 57 metadados no índice/histórico, mas eles não são materializados no disco. **Não deve ocorrer `invalid path` no clone Windows.** Não desative sparse-checkout. Confira as quatro imagens de categoria em `mobile/assets/images/armoire/`; o hash de `categoria-polo.png`, por exemplo, deve ser `9c68d77260bfa112d304212b45127da0604d4ccc19e223082b2a8e081e0b56f0` com `Get-FileHash`.

O clone das aplicações vem da main publicada, que agora inclui README, HOW-TO, script e este roteiro. Mantenha uma cópia separada do kit para continuar a leitura ao trocar para as branches de desenvolvimento, que podem não conter a documentação nova. A publicação documental não comprova a validação prática na VM Windows 11.

## 5. Repetição e cenários de proteção

Faça apenas em pastas descartáveis da VM:

- Segunda execução no mesmo destino: não reinstala programas/extensões detectados, não refaz clone, não substitui nome/e-mail Git e não muda branch/atualiza sem confirmação. Compare versões, arquivos e políticas antes/depois.
- Crie no clone um arquivo de anotação de teste não rastreado; repita solicitando outro perfil. Deve manter o arquivo e recusar troca/atualização por árvore suja. Não faça commit desse arquivo.
- Escolha uma pasta existente com um arquivo de teste fora do clone, inclusive caminho com espaço. Deve parar com código 2, sem sobrescrever ou apagar o arquivo, antes de instalações/log.
- Escolha o caminho do próprio kit sem `.git`: deve parar sem tentar clonar por cima. Um checkout de outro remoto também deve ser recusado; não exiba URL autenticada no retorno.
- Recuse o plano inicial: nenhuma escrita, código 0. Recuse uma ferramenta ausente: registrar pendência e pular dependentes, sem instalar silenciosamente.
- Teste sem internet, se viável por snapshot: falhas devem ser compreensíveis; não deve alterar certificados, instalar de outra fonte ou repetir em loop.
- Se o clone falhar por rede/autenticação, preserve a pasta parcial para inspeção. A execução seguinte deve recusar sobrescrevê-la.
- Se houver Node incompatível em um snapshot separado, o script deve preservá-lo e avisar para parar antes de `npm ci`; não instalar uma segunda cópia automaticamente.

O script não deve executar npm ci, commit, push, build, remover pastas nem instalar Android Studio/Docker/banco. O log opcional fica em `%LOCALAPPDATA%\ArmoireSetup\Logs`, com nome único; confira que não contém tokens, senha ou os valores de nome/e-mail Git.

## 6. Testes rápidos das aplicações

**Mobile:** na branch `in_dev_mobile`, entre em `mobile`, rode `npm.cmd ci` e confira o término. Registre `git status --short --branch` (sem mudanças versionadas inesperadas). Inicie `npx.cmd expo start`; deve mostrar Metro/QR. Encerre com `Ctrl+C`. QR em Android real é opcional conforme rede e Expo Go compatível; sem emulador, não há obrigação de rodar Android na VM. **Não gerar nova build**. O APK aprovado pode ser demonstrado separadamente no aparelho do professor, conforme o HOW-TO.

**Web:** com árvore limpa, escolha a branch web somente após confirmação; se estiver validando a main integrada, pode apenas inspecionar `front-end/` nela, sem trocar branch. Abra a raiz no VS Code, instale/confira Live Server e abra `front-end/index.html`. Registre a URL, confira home → catálogo → produto → carrinho e encerre o servidor. Não usar Auth/CRUD real nem dados pessoais como requisito desse teste. Não é necessário repetir a suíte web de 111 testes.

## 7. Devolver os resultados

Copie este formulário para uma anotação **fora do Git**. Preencha com o observado, inclusive falhas; não transforme passos não executados em PASSOU.

```text
Data / snapshot da VM:
Windows build / PowerShell:
Perfil / destino / rede VM:
Versões ANTES (winget, Git, Code, Node, npm):
Help e WhatIf: código / prompts? / houve escrita ou rede?:
Execução real: escolhas / código / erro exato:
Reabertura do terminal necessária?:
Versões DEPOIS / extensões:
Clone: remoto / SHA / branch / git status:
Sparse: padrões / metadados omitidos / invalid path?:
Quatro imagens e hash conferido:
Segunda execução: preservou arquivos/identidade/extensões?:
Pasta existente / árvore suja / outros cenários:
Políticas e PATH globais permaneceram inalterados?:
Web: URL / fluxo / resultado:
Mobile: npm ci / Metro / encerramento / eventual Android:
Log revisado e sem segredos?:
PASSOU / FALHOU / NÃO EXECUTADO por etapa:
Parecer do professor / correções necessárias:
```

Informe também qualquer saída inesperada e, se útil, uma captura revisada que não contenha dados privados. A publicação documental foi autorizada separadamente; a validação prática do script continua pendente desse retorno e do parecer da AR-COORD-C04.
