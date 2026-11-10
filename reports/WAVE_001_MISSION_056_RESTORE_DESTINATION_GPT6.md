# WAVE 001 — Missão 056: Restore Destination
- IA/modelo: ChatGPT — GPT-6 (OpenAI)
- Data: 2026-11-10
- Status: PROPOSTA / aguardando aprovação do integrador
- Produto: vidift-max/tokensaver-ai, branch v2-saas-alpha, HEAD 935b6fc5d0c126e93697a16f73d56bb3a4d1e55f (read-only)

## Análise do problema atual
restore_project_backup() verifica symlink_metadata(target) e retorna se já existe, depois cria staging .restore-UUID.tmp e por fim executa fs::rename(stage,target). A verificação não reserva o identificador. Outro processo pode criar target durante a cópia. Rename em destino existente tem semântica distinta entre OS/filesystems e não deve ser tratado como no-replace universal. O DB é transacionado dentro do staging, mas isso não serializa o nome no filesystem.

## Evidências no código
- src-tauri/src/backup.rs: restore_project_backup(), checagem inicial do target, criação do stage no mesmo projects_root e rename final.
- source_project_id == target_project_id é rejeitado, mas isso não evita corrida com outro target writer.
- staging no mesmo parent/volume é uma base útil para publicação atômica.

## Solução proposta
Criar helper publish_dir_noreplace(stage,target,parent_handle). Usar primitiva atômica no-replace por plataforma (Unix renameat2 RENAME_NOREPLACE quando disponível; Windows API com semântica explícita de não substituir). Confirmar a API real e suportabilidade nos targets antes de implementar; se não houver garantia, falhar fechado. Não usar check-then-rename nem lockfile como única proteção contra criador externo.
Manter parent directory handle/identity desde validação e preferir operações relativas ao handle. Criar staging exclusivo UUID no mesmo parent. Se publish retornar AlreadyExists, mapear para RESTORE_TARGET_EXISTS e remover apenas staging próprio. Validar que target inexistente cobre arquivo, diretório, symlink e junction. Não tocar no target concorrente. A limpeza pós-crash deve identificar ownership e idade.

## Arquivos e funções envolvidos
- src-tauri/src/backup.rs: restore_project_backup(); novo publish_dir_noreplace().
- src-tauri/src/fs_guard.rs (novo, coordenado com 063): primitive por plataforma/parent handle.
- src-tauri/Cargo.toml: somente se for necessária dependência/FFI adicional.
- src-tauri/src/tests.rs e testes internos: integração concorrente.

## Invariantes de segurança
Nunca sobrescrever destino preexistente; target final só aparece completo; stage e target no mesmo volume; falha não modifica destino concorrente; sem fallback inseguro; parent identity estável durante publish.

## Riscos de regressão
APIs Unix/Windows e filesystems alternativos diferem; suporte pode exigir FFI/dependência; erros de AlreadyExists precisam ser mapeados corretamente; operação pode falhar em FS sem primitive segura.

## Dependências
Missão 063 define handle/parent guard; 055 integra budget/staging; 065/066/067 fornecem testes e CI Windows/Linux. Requer grant específico para patch.

## Testes necessários
Duas restaurações concorrentes no mesmo destino (exatamente uma vence); processo externo cria destino durante operação; destino existente como arquivo/diretório/symlink/junction; parent swap; crash antes/depois da publicação; Linux e Windows. TESTE NÃO EXECUTADO: nenhum teste dinâmico, multiprocesso ou multiplataforma foi executado nesta proposta.

## Critérios objetivos de aceite
Sob corrida N-way, uma única publicação; demais retornam conflito; projeto final contém DB/blobs validados; nunca há estado parcial em target; nenhum destino existente é substituído.

## Limitações
A primitiva concreta depende da matriz de OS/FS suportados e precisa de protótipo CI. Não há teste operacional nesta proposta.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- arquivo: src-tauri/src/backup.rs; função: restore_project_backup(); mudança: substituir check+rename por publish no-replace; teste: corrida multiprocesso e external creator; risco: semântica OS/FS.
- arquivo: src-tauri/src/fs_guard.rs (novo); função: publish_dir_noreplace(); mudança: primitive por plataforma e parent handle; teste: symlink/junction/parent swap e target existente; risco: FFI/dependência e FS não suportado.