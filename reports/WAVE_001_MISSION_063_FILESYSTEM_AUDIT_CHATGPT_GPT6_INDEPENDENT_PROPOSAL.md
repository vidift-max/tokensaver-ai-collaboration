# WAVE 001 — Missão 063: Filesystem Audit — proposta independente

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: segurança Rust, filesystem cross-platform, TOCTOU e isolamento
- Papel: auditoria transversal read-only e proposta de patch | Data: 2026-11-10
- Status próprio: REVIEW_REQUIRED; aguarda reconciliação/aprovação

## Análise do problema atual
A validação de filesystem está duplicada. Diversos módulos montam `app_data_dir/storage/projects/<id>` e passam pathname a `db::open`, que cria parent e abre SQLite por caminho. Symlink/junction em ancestral pode redirecionar antes das verificações locais. Backup/path_guard fazem metadata/canonicalize, mas reabrem pathname depois, mantendo TOCTOU. `safe_blob_source` canonicaliza e depois `fs::copy` reabre. Em Windows, is_symlink não cobre necessariamente todos reparse points/junctions. Importação compara identidade do handle, mas roots/config ainda são path-based.

## Evidências no código
Projeto principal `vidift-max/tokensaver-ai`, branch `v2-saas-alpha`, HEAD `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- `src-tauri/src/lib.rs::project_root`, `initialize_project`, `import_text_file`: root/DB por pathname.
- `smart_context.rs::project_root/smart_context`; `project_memory.rs::list_project_memory/set_project_memory`; `integrity.rs::project_root/verify_project`; `advanced.rs::project_root`: builders duplicados e DB por caminho.
- `backup.rs::safe_blob_source/create_project_backup/restore_project_backup/hash_file`: checks locais e reabertura pós-canonicalize.
- `path_guard.rs::canonical_without_redirect/open_verified/identity`: identidade de handle para origem, não para toda raiz.
- `db.rs::open`: create_dir_all e Connection::open por pathname.

## Solução proposta
Criar `secure_fs.rs` com API central para resolver projeto, abrir dir/DB/blob, criar staging exclusivo, publicar no-replace e remover árvore owned. Validar cada componente desde app_data_dir até storage/projects/project e backups/project/backup. Unix: dirfd/openat O_NOFOLLOW por componente; quando disponível openat2 RESOLVE_BENEATH|RESOLVE_NO_SYMLINKS. Windows: FILE_FLAG_OPEN_REPARSE_POINT e consulta de reparse tag/atributos; rejeitar junction/mount/device não permitido. Manter handles e operar relativamente a eles; canonicalize+starts_with não é defesa concorrente. Para SQLite, investigar VFS/handle-safe open suportado por rusqlite; se inviável, diretório privado com ACL restrita e revalidação imediata, registrando residual TOCTOU. `safe_blob_source` deve copiar do handle validado; integrity deve hashear no mesmo handle. Staging tem token de ownership; cleanup confirma identidade. Publish depende do no-replace da Missão 056. Import Roots depende do bounded read/lock/atomic replace da 057. Substituir builders project_root duplicados.

## Invariantes de segurança
- Symlink/junction/reparse point não permitido em qualquer ancestral é rejeitado.
- Validação e operação usam mesmo handle/dirfd sempre que suportado.
- DB/blob/backup/staging permanecem confinados às raízes designadas.
- Nenhum pathname validado é reaberto inseguramente após janela concorrente.
- Cleanup só remove objeto de propriedade comprovada.
- Falha é fail-closed, sem fallback inseguro.

## Riscos
Mudança transversal; APIs nativas variam por SO/FS; SQLite/rusqlite abre por pathname e pode exigir VFS; ACL pode quebrar migrações; rejeitar mount points afeta volumes legítimos; hardlinks e network FS requerem política.

## Dependências
Missão 056 (publish no-replace), 057 (Import Roots), 055 (budgets/staging), 051/052 (Smart Context/Memory), revisão de db::open e aprovação de crates/plataformas.

## Testes necessários
Unitários: traversal, symlink em cada componente, junction/reparse, hardlink, path depth, tipo inesperado. Integração: symlink em app_data/storage/projects/project/blobs/backups; troca entre validate/open; provar DB externo não aberto/modificado. Concorrência: symlink swap, blob swap durante hash/copy, cleanup vs restore. Cross-platform Linux, Windows NTFS junction/mount, macOS/APFS se suportado. Regressão import/File Center/Smart Context/Memory/Integrity/Backup/Restore/Advanced. **TESTE NÃO EXECUTADO:** nenhum teste adversarial, build ou integração.

## Critérios objetivos de aceite
Links em ancestrais rejeitados; race controlada não redireciona open; nenhum DB/blob externo acessado; cleanup não apaga objeto concorrente; todos comandos críticos usam resolver ou exceção aprovada; matriz SO documenta garantias.

## Limitações
Auditoria estática, sem prova dinâmica. SQLite por pathname é limitação arquitetural e precisa solução/mitigação antes de declarar confinamento forte. Hardlinks/mount/network FS dependem da política por plataforma.

## Relação com trabalho anterior
Li relatório 063 e missões 051/052/055/056/057/058/062/064. Acrescento arquitetura handle-relative, risco de reabertura pós-canonicalize em safe_blob_source e DB open, e separação entre defesa da raiz e validação do leaf.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
| arquivo | função | mudança | teste | risco |
|---|---|---|---|---|
| `src-tauri/src/secure_fs.rs` novo | API de raiz/handle | resolver handle-relative, rejeitar links/reparse points | adversarial race | complexidade nativa |
| `src-tauri/src/lib.rs` | `project_root`, `initialize_project`, `import_text_file` | migrar para secure_fs | root swap | permissões |
| `src-tauri/src/db.rs` | `open` | separar mkdir/open; avaliar VFS/handle | DB path swap | limitação SQLite |
| `smart_context.rs`, `project_memory.rs`, `integrity.rs`, `advanced.rs` | builders/commands | eliminar builders duplicados | regressão por módulo | impacto transversal |
| `src-tauri/src/backup.rs` | `safe_blob_source`, hash/copy, create/restore | handles, staging owned, publish no-replace | blob swap/cleanup race | APIs SO |
| `src-tauri/src/path_guard.rs` | `open_verified`, config helpers | roots e arquivos handle-safe | junction/revoke race | semântica |
| `src-tauri/Cargo.toml` | dependências | bindings/crates aprovadas | build matrix | manutenção |
