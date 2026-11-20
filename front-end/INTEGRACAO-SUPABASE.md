# Integração existente — Etapa 05

`js/armoire-client.js` concentra a URL e a chave **pública publishable** do projeto. O SDK UMD continua vindo do jsDelivr; não foi instalado um pacote ou criado um serviço. `window.armoireSupabase` mantém o cliente compartilhado. `window.armoireServico.cliente()` o cria uma única vez, quando o SDK está disponível. `window.armoireAuthReady` e `window.armoireConta.abrir()` coordenam a abertura após recuperar a sessão.

Contratos observados no código (não confirmados no backend):

| Serviço/tabela | Campos e operações existentes |
| --- | --- |
| Supabase Auth | getSession, getUser, signInWithPassword, signUp, signOut, onAuthStateChange |
| products | source_id, name, category, price, stock, sizes, colors, images, image_url, is_active; somente leitura |
| favoritos | usuario_id + produto_id; leitura, upsert e exclusão pela interface |
| enderecos | usuario_id + tipo, destinatario, cep, logradouro, numero, complemento, bairro, cidade, estado, criado_em, atualizado_em; leitura, upsert e exclusão |
| looks_salvos | id, user_id, nome, composicao, created_at; leitura, inserção e exclusão |
| composicao | JSON existente `{ versao: 1, pecas: [{ categoria, produto_id, nome, imagem, preco, categoria_original }] }` |

O catálogo REST preserva o fallback local das Etapas 02–03. Favoritos usam os dados desse modelo mesmo em páginas sem cards. Um favorito fora do catálogo atual continua removível e aparece como indisponível, sem preço inventado.

As operações do SDK têm espera limitada a 8 segundos. Esse limite **não cancela nem repete** uma gravação remota: se a confirmação não chegar, a interface informa a incerteza e pede conferir os dados antes de repetir. Uma resposta tardia não publica sucesso. ViaCEP é opcional; a falha permite digitação manual.

Dependências externas: projeto Supabase configurado, Auth e políticas RLS adequadas por usuário, SDK jsDelivr, ViaCEP, Google Fonts e Font Awesome/CDN. Nenhuma conta de demonstração foi fornecida. Os testes desta etapa usam respostas simuladas e não autenticam, criam usuários ou alteram dados remotos. RLS, permissões, schema e CRUD reais permanecem **não verificados**; filtros no cliente não comprovam autorização no servidor.
