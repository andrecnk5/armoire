# Armoire Central — validação final da versão web

Etapa 06, 20/11/2026. Status: **COM RESSALVAS**. Branch exclusiva: `in_dev_front-end`.

A Etapa 05 foi publicada antes desta etapa. O GitHub confirmou o HEAD remoto `f614536d738585ed13e329cde62e6fb923e4e558`, que é a base desta revisão. O commit da Etapa 06 deve permanecer local até autorização de publicação; seu SHA será informado no relatório da conversa e pode ser consultado com `git log -1`.

## Alterações e preservação

- Newsletter: removida a confirmação fictícia “INSCRITO” da home. As três páginas identificam a demonstração, desabilitam os campos/botões e impedem envio de formulário.
- Checkout: desabilitado e identificado como demonstrativo, sem pagamentos ou criação de pedidos.
- Busca e links institucionais/sociais sem destino: identificados e desabilitados; os links funcionais do catálogo e o destino dinâmico do Quick Shop são preservados.
- Pedidos e configurações da conta: mensagens explícitas de demonstração; sem operações de banco.
- Imagens: `loading="lazy"` e `decoding="async"` somente na imagem editorial e nas quatro categorias da home, abaixo do hero e da introdução. Hero e logo continuam imediatos. Não foram medidas melhorias de desempenho em navegador.
- CSS/JS: a proteção dos demonstrativos fica em arquivos comuns pequenos. Removido somente o handler da newsletter que produzia uma confirmação inexistente. Os estilos extensos e a rotina redundante de fechamento do menu foram preservados: não se comprovou novo impacto funcional que justificasse consolidá-los sem validação visual.
- `produtos.js` e `filtros-recolhiveis.js`: nenhuma referência encontrada nos HTML/JS ativos pesquisados. Arquivos preservados porque usos externos não foram descartados.
- Todas as 36 imagens originais foram preservadas, totalizando 52.415.671 bytes (49,99 MiB). Há 11 pares com SHA-256 idêntico, equivalentes a 18.239.187 bytes de cópias (17,39 MiB). Não foram removidos: caminhos podem existir em dados remotos.
- As quatro imagens `categoria-*.png` contêm JPEG apesar da extensão. Nomes e conteúdo foram preservados; conferir renderização no teste visual pendente.

## Evidências consolidadas

| Verificação | Resultado e alcance |
| --- | --- |
| Regressões das Etapas 01–05 | PASSOU: 101 testes com arquivos, DOM, Auth e rede simulados |
| Etapa 06 | PASSOU: 7 testes de demonstração e integração entre contextos simulados de página |
| Total | **108 PASSOU, 0 FALHOU** |
| Sintaxe | PASSOU: 26 arquivos JS/CJS e 4 blocos inline |
| HTML | PASSOU: quatro páginas, fechamento de tags, IDs únicos, referências ARIA/rótulos, listas e ausência de controles dentro de links |
| CSS | PASSOU: chaves balanceadas; nenhuma reescrita dos CSS originais |
| Caminhos locais | PASSOU: auditoria de imagens, scripts, estilos e links com case exato |
| HTTP local | PASSOU: 62 URLs, HTTP 200, somente HEAD em servidor temporário de leitura |
| Imagens originais | PASSOU: nenhum arquivo de imagem alterado/removido |
| Navegador/console visual | NÃO EXECUTADO: nenhum navegador Linux disponível; execução Windows falha na comunicação do WSL |
| Responsividade/overflow | NÃO EXECUTADO em navegador: 320, 375, 390, 768 e 1280 px |
| Teclado nativo e screenshots | NÃO EXECUTADO: Tab, Shift+Tab, Enter, Espaço e Escape reais ainda dependem de navegador |
| Supabase real | NÃO EXECUTADO: Auth, tabelas, RLS, permissões e CRUD não foram validados no serviço real |

Os testes simulados comprovam nestes cenários: home → categoria → catálogo → produto → tamanho → carrinho, estoque e total coerentes; login → favorito → My Armoire → salvar/recuperar look → carrinho; erros de rede, SDK ausente, sessão expirada, foco de painéis e preservação dos dados locais. **Não são testes ponta a ponta em navegador nem comprovam autorização no servidor.**

## Como repetir as verificações

Sem instalação de frameworks, usando Node 24:

```bash
node --test --test-isolation=none front-end/tests/etapa0{1,2,3,4,5,6}.test.cjs
python3 front-end/tests/recursos-http.py
```

Neste ambiente, Node está no executável do VS Code Server e não no PATH. A execução HTTP exigiu permissão para abrir um socket local; o servidor foi encerrado ao fim do teste.

Para conferência manual em uma máquina com navegador:

```bash
python3 -m http.server 8000 --directory front-end
```

Abrir `http://localhost:8000/index.html`; executar os dois fluxos acima nas cinco larguras; conferir `document.documentElement.scrollWidth <= window.innerWidth`, console, rede, rolagem inicial e posterior, foco visível, fechamento/restauração de foco e controles de tamanho/quantidade. Conferir produto válido, ausente e sem ID; rede offline/lenta; todos os demonstrativos identificados. Não usar contas reais ou gravar no Supabase sem autorização específica para demonstração.

## Dependências e decisão de integração

Supabase Auth/products/favoritos/enderecos/looks_salvos, políticas RLS, SDK Supabase via jsDelivr, ViaCEP opcional, Google Fonts e Font Awesome/CDN continuam externos. Sua disponibilidade real não foi validada nesta etapa. O contrato observado e a incerteza de gravações sem confirmação estão documentados em `INTEGRACAO-SUPABASE.md`. A chave publishable é pública; filtros no JavaScript não comprovam isolamento por usuário no backend.

Recomendação: **adiar o merge para main** até conferir layout/teclado em navegador e validar Auth e isolamento/permissões com acesso de demonstração aprovado. O professor pode aceitar os demonstrativos como limite acadêmico, mas as pendências precisam permanecer explícitas. Após essas evidências, a integração ainda depende de autorização específica; nenhum merge foi executado.

A implementação mobile deve permanecer em trilha separada, com autorização e diagnóstico próprios. Não iniciar como se a integração real e as regras do backend já estivessem comprovadas. `main`, `mobile/` e Supabase foram preservados; nenhuma implementação mobile foi realizada.
