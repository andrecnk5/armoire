#requires -Version 5.1
<#
.SYNOPSIS
Assistente didatico do Armoire Central para Windows 11 (PowerShell 5.1/7).
.DESCRIPTION
Simula sem escrever com -WhatIf. No modo real, pede confirmacoes.
Nao executa npm ci, commit, push, build ou instalacao de banco/SDK Android.
Arquivo ASCII para funcionar tambem no Windows PowerShell 5.1.
.EXAMPLE
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -WhatIf -Profile Mobile
.EXAMPLE
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -InstallPath "C:\Projetos da turma\armoire"
#>
[CmdletBinding()]
param(
    [ValidateSet('Web', 'Mobile', 'Backend')]
    [Alias('Profile')]
    [string]$SetupProfile = 'Web',
    [string]$InstallPath = (Join-Path $HOME 'Projetos\armoire'),
    [switch]$WhatIf,
    [switch]$Help,
    [switch]$NoLog
)

$ErrorActionPreference = 'Stop'
$script:Issues = 0
$script:LogFile = $null
$script:RepoUrl = 'https://github.com/andrecnk5/armoire.git'
$script:ExitCode = 0

function Say([string]$Message) {
    Write-Host $Message
    # Somente mensagens resumidas: nao gravar saida bruta, nome/email ou tokens.
    if ($script:LogFile) {
        try { [IO.File]::AppendAllText($script:LogFile, $Message + [Environment]::NewLine) }
        catch { Write-Warning 'Falha ao gravar log; continuando sem log.'; $script:LogFile = $null; $script:Issues++ }
    }
}

function Pending([string]$Message) { $script:Issues++; Say ('PENDENTE: ' + $Message) }

function Ask([string]$Question) {
    while ($true) {
        $answer = (Read-Host ($Question + ' [S/N; Enter = N]')).Trim()
        if ($answer -match '^(s|sim|1)$') { return $true }
        if ($answer -eq '' -or $answer -match '^(n|nao|2)$') { return $false }
        Write-Host 'Digite S ou N (tambem pode usar 1 para sim, 2 para nao).'
    }
}

function ToolPath([string]$Name) {
    $command = Get-Command -Name $Name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($command) { return $command.Source }
    return $null
}

function Native([string]$Exe, [string[]]$Arguments, [string]$Label) {
    # Argumentos separados; jamais avaliar comandos escritos pelo aluno.
    # PS 5.1 pode tratar stderr de Git como ErrorRecord mesmo com codigo zero.
    $previousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = @(& $Exe @Arguments 2>&1)
        $result = $LASTEXITCODE
    } finally { $ErrorActionPreference = $previousPreference }
    if ($result -ne 0) {
        $output | ForEach-Object { Write-Host $_ }
        throw ($Label + ': codigo ' + $result + '. Pare e informe ao professor; nenhuma repeticao automatica.')
    }
    return $output
}

function GitOutput([string[]]$Arguments) {
    return ((Native $script:GitExe $Arguments 'Git') | ForEach-Object { $_.ToString() }) -join "`n"
}

function InstalledEvidence([hashtable]$Tool) {
    foreach ($file in $Tool.Files) {
        if ($file -and (Test-Path -LiteralPath $file -PathType Leaf)) { return $true }
    }
    # Detectar instalacao fora do PATH para evitar duplicar Code/Git/Node.
    foreach ($key in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall',
                      'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall',
                      'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall')) {
        foreach ($entry in @(Get-ItemProperty -Path ($key + '\*') -ErrorAction SilentlyContinue)) {
            if ($entry.DisplayName -and $entry.DisplayName -match $Tool.Pattern) { return $true }
        }
    }
    return $false
}

function EnsureTool([hashtable]$Tool) {
    if (ToolPath $Tool.Command) { Say ($Tool.Name + ': comando disponivel; nao reinstalar.'); return }
    if (InstalledEvidence $Tool) {
        Pending ($Tool.Name + ': instalacao detectada, mas comando ausente. Reabra todo o VS Code/terminal e rode de novo; nao sera duplicada.')
        return
    }
    $winget = ToolPath 'winget.exe'
    if (-not $winget) {
        Pending ($Tool.Name + ': winget ausente. Abra a Microsoft Store e instale/atualize o Instalador de Aplicativo (App Installer), depois reabra o terminal.')
        return
    }
    if (-not (Ask ('5. Instalar ' + $Tool.Name + ' ausente, ID ' + $Tool.Id + '? Pode aparecer instalador/UAC'))) {
        Pending ($Tool.Name + ': instalacao recusada; nenhuma mudanca efetuada.')
        return
    }
    $arguments = @('install', '--id', $Tool.Id, '--exact', '--source', 'winget', '--no-upgrade', '--interactive')
    if ($Tool.Version) { $arguments += @('--version', $Tool.Version) }
    if ($Tool.Scope) { $arguments += @('--scope', $Tool.Scope) }
    try {
        # Acordos da fonte/pacote e UAC ficam visiveis ao aluno; sem aceite silencioso.
        Native $winget $arguments ('Instalacao de ' + $Tool.Name) | ForEach-Object { Write-Host $_ }
        Say ($Tool.Name + ': instalador terminou com codigo zero.')
        if (-not (ToolPath $Tool.Command)) {
            Pending ($Tool.Name + ': ainda fora do PATH deste terminal. Feche e reabra terminal/VS Code; passos dependentes serao pulados.')
        }
    } catch {
        Pending ($Tool.Name + ': ' + $_.Exception.Message + ' Verifique internet, permissao/UAC e disponibilidade do pacote.')
    }
}

function RepoCheck([string]$Path) {
    if (-not (Test-Path -LiteralPath (Join-Path $Path '.git'))) { throw 'A pasta existe, mas nao e um checkout Git proprio. Escolha OUTRO caminho; nada sera apagado.' }
    $top = (GitOutput @('-C', $Path, 'rev-parse', '--show-toplevel')).Trim()
    if (-not [string]::Equals([IO.Path]::GetFullPath($top).TrimEnd('\'), $Path.TrimEnd('\'), [StringComparison]::OrdinalIgnoreCase)) {
        throw 'O caminho nao corresponde a raiz do checkout. Escolha a pasta correta.'
    }
    foreach ($argsForRemote in @(@('-C', $Path, 'remote', 'get-url', 'origin'), @('-C', $Path, 'remote', 'get-url', '--push', 'origin'))) {
        $remote = (GitOutput $argsForRemote).Trim().TrimEnd('/') -replace '\.git$', ''
        if (-not [string]::Equals($remote, 'https://github.com/andrecnk5/armoire', [StringComparison]::OrdinalIgnoreCase)) {
            throw 'Remoto origin diferente do Armoire esperado (URL nao exibida). Nao modificar este checkout; informe ao professor.'
        }
    }
}

function CleanRepo([string]$Path) {
    return [string]::IsNullOrWhiteSpace((GitOutput @('-C', $Path, 'status', '--porcelain')))
}

function BranchStep([string]$Path) {
    $targetBranch = 'main'
    if ($SetupProfile -eq 'Web') { $targetBranch = 'in_dev_front-end' }
    if ($SetupProfile -eq 'Mobile') { $targetBranch = 'in_dev_mobile' }
    if (-not (CleanRepo $Path)) {
        Pending 'Checkout tem alteracoes/arquivos nao rastreados. Nao trocar branch nem atualizar. Mostre git status ao professor.'
        GitOutput @('-C', $Path, 'status', '--short', '--branch') | Write-Host
        return
    }
    $current = (GitOutput @('-C', $Path, 'branch', '--show-current')).Trim()
    if (-not $current) { throw 'Checkout sem branch ativa (detached HEAD). Pare e confirme a situacao com o professor.' }
    if ($current -ne $targetBranch) {
        $available = (GitOutput @('-C', $Path, 'for-each-ref', '--format=%(refname)', ('refs/heads/' + $targetBranch), ('refs/remotes/origin/' + $targetBranch)))
        if (-not $available) { Pending 'Branch do perfil nao encontrada. Nao criar branch nova nem atualizar refs automaticamente.'; return }
        if (Ask ('6. Sua responsabilidade foi confirmada pelo professor? Trocar de ' + $current + ' para ' + $targetBranch)) {
            RepoCheck $Path
            if (-not (CleanRepo $Path)) { throw 'Arquivos mudaram antes da troca de branch. Pare.' }
            GitOutput @('-C', $Path, 'switch', $targetBranch) | Write-Host
            Say ('Branch ativa: ' + $targetBranch + '.')
            $current = $targetBranch
        } else { Say 'Troca de branch recusada; branch atual mantida.' }
    }
    if ($current -notin @('main', 'in_dev_front-end', 'in_dev_mobile')) { Pending 'Branch atual fora das tres trilhas conhecidas; nenhuma atualizacao automatica.'; return }
    if (Ask ('6. Atualizar SOMENTE a branch atual ' + $current + ' com git pull --ff-only? Requer internet')) {
        RepoCheck $Path
        if (-not (CleanRepo $Path)) { throw 'Checkout deixou de estar limpo. Atualizacao interrompida.' }
        # Se divergir ou falhar, o catch principal encerra. Sem pull alternativo.
        GitOutput @('-C', $Path, 'pull', '--ff-only', 'origin', $current) | Write-Host
        Say 'Atualizacao fast-forward concluida; nenhum merge ou rebase solicitado.'
    }
}

function Extensions {
    $code = ToolPath 'code.cmd'
    if (-not $code) { Pending 'code.cmd indisponivel; extensoes adiadas. Reabra terminal/VS Code e repita.'; return }
    if (-not (Ask '7. Instalar somente extensoes recomendadas ainda ausentes? Nao altera configuracoes nem formata arquivos')) { return }
    try {
        $installed = @((Native $code @('--list-extensions') 'Listagem de extensoes') | ForEach-Object { $_.ToString().Trim().ToLowerInvariant() })
        $ids = @('dbaeumer.vscode-eslint', 'esbenp.prettier-vscode')
        if ($SetupProfile -eq 'Web') { $ids += 'ritwickdey.LiveServer' }
        if ($SetupProfile -eq 'Mobile') { $ids += 'expo.vscode-expo-tools' }
        foreach ($id in $ids) {
            if ($installed -contains $id.ToLowerInvariant()) { Say ('Extensao ja presente: ' + $id); continue }
            Native $code @('--install-extension', $id) ('Extensao ' + $id) | ForEach-Object { Write-Host $_ }
            Say ('Extensao instalada: ' + $id)
        }
    } catch { Pending ('Extensoes nao concluidas: ' + $_.Exception.Message + ' Consulte a mensagem do VS Code e verifique a rede.') }
}

function Identity([string]$Path) {
    if (-not (Ask '8. Conferir e preencher SOMENTE nome/email Git ausentes neste repositorio? Nao e login; nao digite senha ou token')) { return }
    foreach ($key in @('user.name', 'user.email')) {
        # --get retorna 1 quando a chave nao existe; isso nao e falha de autenticacao.
        $value = @(& $script:GitExe -C $Path config --get $key 2>$null)
        $result = $LASTEXITCODE
        if ($result -eq 0 -and ($value -join '').Trim()) { Say ($key + ': ja definido; preservado.'); continue }
        if ($result -ne 0 -and $result -ne 1) { throw 'Falha ao ler identidade Git. Nao alterar configuracao.' }
        $label = 'Seu nome de autoria'
        if ($key -eq 'user.email') { $label = 'Seu email de commit (pode usar o noreply de sua conta GitHub)' }
        $entry = (Read-Host $label).Trim()
        if (-not $entry -or $entry -match '[\r\n]') { Pending 'Campo Git vazio/invalido; identidade nao preenchida.'; continue }
        if (Ask ('8. Salvar este campo ' + $key + ' somente no checkout atual')) {
            GitOutput @('-C', $Path, 'config', '--local', $key, $entry) | Out-Null
            Say ($key + ': definido localmente; valor omitido do log.')
        }
    }
}

if ($Help) {
    @'
ARMOIRE - ajuda
  -WhatIf                    Somente plano; SEM prompts, rede, escrita ou instalacoes.
  -Profile Web|Mobile|Backend Preseleciona o perfil; Backend nao instala banco/stack.
  -InstallPath "C:\..."       Pasta do CLONE; programas usam seus instaladores oficiais.
  -NoLog                     Nao oferecer log opcional fora do Git.
  -Help                      Mostrar esta ajuda e sair.
Real: perguntas S/N, sem admin automatico. Recusar o plano nao altera nada.
Codigos: 0 = plano/conclusao sem pendencias ou cancelamento; 1 = passos pendentes;
         2 = bloqueio de seguranca/erro Git. Nao execute por dot-sourcing.
Leia docs/HOW-TO.md e docs/TESTE-VM-WINDOWS11.md antes de executar.
'@ | Write-Host
    exit 0
}

try {
    if (-not $WhatIf -and -not $PSBoundParameters.ContainsKey('SetupProfile')) {
        do { $choice = Read-Host '1. Perfil: 1=Web, 2=Mobile, 3=Backend a avaliar' } while ($choice -notin @('1', '2', '3'))
        $profileByNumber = @{ '1' = 'Web'; '2' = 'Mobile'; '3' = 'Backend' }
        $SetupProfile = $profileByNumber[$choice]
    }
    if (-not $WhatIf -and -not $PSBoundParameters.ContainsKey('InstallPath')) {
        $answerPath = Read-Host ('2. Pasta do clone (Enter = ' + $InstallPath + '). Digite caminho completo, sem variaveis')
        if ($answerPath.Trim()) { $InstallPath = $answerPath.Trim() }
    }
    if ([string]::IsNullOrWhiteSpace($InstallPath)) { throw 'Caminho vazio.' }
    $InstallPath = [IO.Path]::GetFullPath($InstallPath).TrimEnd('\')
    $scriptRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\')
    Write-Host ('Plano: perfil ' + $SetupProfile + '; clone em ' + $InstallPath)
    Write-Host 'Git.Git e Microsoft.VisualStudioCode estaveis, apenas se ausentes; Code por usuario.'
    if ($SetupProfile -eq 'Mobile') { Write-Host 'OpenJS.NodeJS.LTS 26.13.1, somente se Node ausente; versao existente nao sera substituida.' }
    if ($SetupProfile -eq 'Backend') { Write-Host 'Backend: somente ferramentas comuns. Banco, servidor e stack aguardam decisao com professor.' }
    Write-Host 'Clone novo: HTTPS --no-checkout e sparse-checkout para omitir SOMENTE *:Zone.Identifier.'
    Write-Host 'Checkout existente: validar origin, mostrar estado, confirmar troca/atualizacao apenas se limpo.'
    Write-Host 'Extensoes opcionais: dbaeumer.vscode-eslint e esbenp.prettier-vscode.'
    if ($SetupProfile -eq 'Web') { Write-Host 'Web: tambem ritwickdey.LiveServer; branch sugerida in_dev_front-end.' }
    if ($SetupProfile -eq 'Mobile') { Write-Host 'Mobile: tambem expo.vscode-expo-tools; branch sugerida in_dev_mobile.' }
    Write-Host 'Identidade Git opcional; log opcional fora do Git. Sem npm ci automatico.'
    if ($WhatIf) {
        foreach ($name in @('winget.exe', 'git.exe', 'node.exe', 'npm.cmd', 'code.cmd')) {
            Write-Host ($name + ': ' + [bool](ToolPath $name))
        }
        Write-Host 'SIMULACAO: fim. Nenhum prompt, consulta de rede, arquivo, clone ou programa foi alterado.'
        exit 0
    }
    if ($env:OS -ne 'Windows_NT' -or [Environment]::OSVersion.Version.Build -lt 22000) { throw 'Modo real destinado ao Windows 11. Nao executar no WSL/Linux.' }
    if ($InstallPath -notmatch '^[A-Za-z]:\\.+') { throw 'Use uma pasta em disco local, por exemplo C:\Projetos\armoire; nao use raiz do disco ou caminho de rede.' }
    foreach ($part in $InstallPath.Substring(3).Split('\')) {
        if ($part.IndexOfAny([IO.Path]::GetInvalidFileNameChars()) -ge 0 -or $part -match '[. ]$' -or $part -match '^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])($|\.)') { throw 'Caminho contem caractere invalido. Escolha outra pasta.' }
    }
    if ($InstallPath.StartsWith($scriptRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Nao clone dentro da pasta que contem este kit. Escolha uma pasta distinta.' }
    if (Test-Path -LiteralPath $InstallPath) {
        if (-not (Test-Path -LiteralPath $InstallPath -PathType Container) -or -not (Test-Path -LiteralPath (Join-Path $InstallPath '.git'))) {
            throw 'Destino ja existe e nao e um checkout proprio. Nao sera sobrescrito, nem se estiver vazio. Escolha outra pasta.'
        }
    } elseif ($scriptRoot.StartsWith($InstallPath + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Destino contem o proprio kit; escolha outra pasta.' }
    # Validar checkout preexistente ANTES de qualquer instalacao ou escrita de log.
    if (Test-Path -LiteralPath $InstallPath) {
        $script:GitExe = ToolPath 'git.exe'
        if (-not $script:GitExe) { throw 'Destino existente exige Git no terminal para conferir origin. Reabra o terminal ou instale Git pela fonte oficial; nenhuma mudanca foi feita.' }
        RepoCheck $InstallPath
    }
    if (-not (Ask '3. Revisou o plano e autoriza seguir para as perguntas de execucao')) { Write-Host 'Cancelado, sem alteracoes.'; exit 0 }

    if (-not $NoLog -and (Ask '4. Registrar log resumido opcional em LocalAppData\ArmoireSetup\Logs, fora do Git')) {
        $logRoot = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'ArmoireSetup\Logs'
        if ($logRoot.StartsWith($InstallPath + '\', [StringComparison]::OrdinalIgnoreCase) -or $logRoot -eq $InstallPath) { throw 'Pasta de log coincide com destino Git. Rode com -NoLog.' }
        try {
            [IO.Directory]::CreateDirectory($logRoot) | Out-Null
            $candidate = Join-Path $logRoot ('setup-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N') + '.txt')
            $stream = [IO.File]::Open($candidate, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write)
            $stream.Dispose()
            $script:LogFile = $candidate
            Say 'Log iniciado; sem saidas brutas de comandos ou dados de identidade.'
        } catch { Pending 'Nao foi possivel iniciar log; demais passos podem continuar.' }
    }
    $programRoot = [Environment]::GetFolderPath('ProgramFiles')
    $userPrograms = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Programs'
    $tools = @(
        @{ Name = 'Git'; Command = 'git.exe'; Id = 'Git.Git'; Pattern = '^Git( version|$)'; Files = @((Join-Path $programRoot 'Git\cmd\git.exe'), (Join-Path $userPrograms 'Git\cmd\git.exe')) },
        @{ Name = 'VS Code'; Command = 'code.cmd'; Id = 'Microsoft.VisualStudioCode'; Scope = 'user'; Pattern = '^Microsoft Visual Studio Code'; Files = @((Join-Path $programRoot 'Microsoft VS Code\Code.exe'), (Join-Path $userPrograms 'Microsoft VS Code\Code.exe')) }
    )
    if ($SetupProfile -eq 'Mobile') {
        $tools += @{ Name = 'Node.js LTS 26.13.1'; Command = 'node.exe'; Id = 'OpenJS.NodeJS.LTS'; Version = '26.13.1'; Pattern = '^Node\.js'; Files = @((Join-Path $programRoot 'nodejs\node.exe')) }
    }
    foreach ($tool in $tools) { EnsureTool $tool }
    $script:GitExe = ToolPath 'git.exe'
    $repoReady = $false
    if (-not $script:GitExe) { Pending 'Git indisponivel neste terminal; clone, branches e identidade nao serao executados.' }
    else {
        if (Test-Path -LiteralPath $InstallPath) {
            RepoCheck $InstallPath
            Say 'Checkout Armoire ja existe; nao clonar por cima nem alterar sparse-checkout.'
            GitOutput @('-C', $InstallPath, 'status', '--short', '--branch') | Write-Host
            $repoReady = $true
        } elseif (Ask ('6. Clonar ' + $script:RepoUrl + ' para pasta nova, com omissao local dos metadados Windows invalidos')) {
            $parent = Split-Path -Parent $InstallPath
            [IO.Directory]::CreateDirectory($parent) | Out-Null
            if (Test-Path -LiteralPath $InstallPath) { throw 'Destino surgiu antes do clone. Pare; nao sobrescrever nem tentar novamente por cima.' }
            GitOutput @('clone', '--no-checkout', '--branch', 'main', $script:RepoUrl, $InstallPath) | Write-Host
            # Nomes contendo ':' nao podem ser materializados pelo Git for Windows.
            # Os objetos continuam no historico; nada e apagado/versionado como exclusao.
            $oldPreference = $ErrorActionPreference
            try {
                $ErrorActionPreference = 'Continue'
                $sparseOutput = @(@('/*', '!*:Zone.Identifier') | & $script:GitExe -C $InstallPath sparse-checkout set --no-cone --stdin 2>&1)
                $sparseResult = $LASTEXITCODE
            } finally { $ErrorActionPreference = $oldPreference }
            if ($sparseResult -ne 0) {
                $sparseOutput | ForEach-Object { Write-Host $_ }
                throw ('Falha no sparse-checkout, codigo ' + $sparseResult + '. Clone parcial preservado; pare e informe ao professor, sem apagar a pasta.')
            }
            GitOutput @('-C', $InstallPath, 'checkout', 'main') | Write-Host
            RepoCheck $InstallPath
            if (-not (CleanRepo $InstallPath)) { throw 'Clone nao ficou limpo. Pare; nao limpar nem repetir por cima.' }
            Say 'Clone concluido em main; metadados :Zone.Identifier omitidos apenas no disco.'
            $repoReady = $true
        } else { Say 'Clone recusado; pasta de destino nao criada.' }
        if ($repoReady) { BranchStep $InstallPath }
    }
    Extensions
    if ($repoReady) { Identity $InstallPath }
    if ($SetupProfile -eq 'Mobile') {
        $node = ToolPath 'node.exe'
        if (-not $node -or -not (ToolPath 'npm.cmd')) { Pending 'Node/npm indisponiveis; reabra terminal e confira antes de instalar dependencias.' }
        else {
            $versionText = ((Native $node @('--version') 'Versao Node') -join '').Trim().TrimStart('v')
            $parsedVersion = $null
            $compatible = $false
            if ([Version]::TryParse($versionText, [ref]$parsedVersion)) {
                $compatible = ($parsedVersion.Major -eq 22 -and $parsedVersion -ge [Version]'22.13.0') -or
                              ($parsedVersion.Major -eq 24 -and $parsedVersion -ge [Version]'24.3.0') -or
                              ($parsedVersion.Major -eq 26 -and $parsedVersion -ge [Version]'26.13.1')
            }
            if (-not $compatible) { Pending 'Node existente fora das faixas LTS conferidas. Nao foi substituido. Pare antes de npm ci e consulte o professor.' }
            else { Say ('Node compativel com SDK/lock: ' + $versionText + '; referencia do kit: 26.13.1 LTS.') }
        }
    }
    Say '9. Relatorio final das ferramentas deste terminal:'
    foreach ($name in @('winget.exe', 'git.exe', 'node.exe', 'npm.cmd', 'code.cmd')) {
        $exe = ToolPath $name
        if ($exe) {
            try { $lines = @(Native $exe @('--version') ('Versao ' + $name)); Say ($name + ': ' + (($lines | Select-Object -First 1).ToString())) }
            catch { Pending ($name + ': nao foi possivel obter versao.') }
        } else { Say ($name + ': indisponivel neste terminal.') }
    }
    if ($repoReady) { Say 'Checkout validado. Use git status e confira a branch antes de editar.' }
    if ($SetupProfile -eq 'Mobile') { Say 'Proximos passos MANUAIS: confirmar branch mobile, entrar em mobile, npm.cmd ci e npx.cmd expo start. Consulte HOW-TO.' }
    if ($SetupProfile -eq 'Web') { Say 'Proximo passo: abrir a raiz do repo no VS Code e front-end/index.html com Live Server. Consulte HOW-TO.' }
    if ($SetupProfile -eq 'Backend') { Say 'Proximo passo: discutir contratos Supabase, schema e RLS com o professor. Nenhuma stack instalada.' }
    if ($script:Issues -gt 0) { $script:ExitCode = 1 }
    Say ('Fim; pendencias: ' + $script:Issues + '; codigo de saida: ' + $script:ExitCode + '.')
} catch {
    $script:ExitCode = 2
    Say ('BLOQUEADO: ' + $_.Exception.Message)
    Say 'Nenhuma limpeza ou repeticao automatica. Preserve as pastas e envie o resumo ao professor.'
}
if ($script:LogFile) { Write-Host ('Log local: ' + $script:LogFile) }
if ($script:ExitCode -eq 0 -and $script:Issues -gt 0) { $script:ExitCode = 1 }
Write-Host ('Codigo final: ' + $script:ExitCode)
exit $script:ExitCode
