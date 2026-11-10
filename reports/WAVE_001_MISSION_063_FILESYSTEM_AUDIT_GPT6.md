# WAVE 001 — Missão 063: Filesystem Audit
- IA/modelo: ChatGPT — GPT-6 (OpenAI)
- Data: 2026-11-10
- Status: PROPOSTA / aguardando aprovação do integrador
- Produto: vidift-max/tokensaver-ai, branch v2-saas-alpha, HEAD 935b6fc5d0c126e93697a16f73d56bb3a4d1e55f (read-only)

## Análise do problema atual
O produto já tem controles reais: path_guard::open_verified canonicaliza roots/origem, rejeita redirecionamentos e compara identidade do handle; import lê por handle e aplica MAX_FILE_BYTES; backup/File Center verificam vários caminhos e restore usa staging. A falha é fragmentação: cada módulo combina canonicalize, metadata e open de modo diferente, sem manter necessariamente o handle validado até o uso. Canonicalize-then-open deixa TOCTOU.

Superfícies concretas:
- smart_context.rs::smart_context: canonicaliza blob e depois fs::read_to_string pelo path.
- file_center.rs::read_file_version: canonicaliza blob, abre o path depois e verifica hash no handle; falta resolver/open relativo ao diretório confiável.
- integrity.rs::verify_project/verify_file: canonicaliza e depois File::open; verify_file não é no-follow por si.
- backup.rs::safe_blob_source/hash_file/create_project_backup/restore_project_backup: symlink_metadata/canonicalize, depois cópia/hash/reabertura por path; validação não mantém handle/identidade de ponta a ponta.
- backup.rs::restore_project_backup: check-then-rename no destino (missão 056).
- path_guard.rs::load_roots/save_roots/add_root/remove_root: JSON, temp fixo e read-modify-write sem lock (missão 057).
- advanced.rs::oneshot_capture: exists/metadata/read e publicação própria de blob; não reutiliza helper central.
- lib.rs::ensure_blob_with_status: helper compartilhado verifica symlink, tipo, tamanho e hash e usa temp UUID; ainda opera por paths e rename.
- project_root é implementado em vários módulos sem abstração física uniforme.

## Evidências no código
- src-tauri/src/path_guard.rs: normalize_absolute(), canonical_without_redirect(), identity(), canonical_identity(), open_verified(); identity Unix (dev/inode) e Windows (volume/index).
- src-tauri/src/lib.rs: project_root(), ensure_blob_with_status(), read_source_safely().
- src-tauri/src/smart_context.rs: canonicalize + fs::read_to_string.
- src-tauri/src/file_center.rs: canonicalize + File::open + verify_blob_integrity.
- src-tauri/src/integrity.rs: verify_project(), verify_file() canonicalizam e abrem por path.
- src-tauri/src/backup.rs: safe_blob_source(), hash_file(), create_project_backup(), restore_project_backup().
- src-tauri/src/advanced.rs: oneshot_capture().
- src-tauri/Cargo.toml: não há crate dedicada de dir-handle/capability traversal; windows-sys já é dependência Windows.

## Solução proposta
Criar src-tauri/src/fs_guard.rs como API baseada em handles, não apenas PathBuf: ProjectDir, BlobStore, VerifiedFile e VerifiedDir. Em Unix, resolver componentes por dirfd/openat com O_NOFOLLOW e fstat; em Windows, abrir handles com flags apropriadas para reparse points e validar atributos/tag/identidade. Não assumir que canonicalize + starts_with elimina TOCTOU. Helpers: open_project_db, open_blob_read, create_blob_exclusive, create_staging_dir, publish_dir_noreplace, atomic_replace_config. Falhar fechado onde a plataforma não oferecer garantias equivalentes.
Migrar em ondas: (1) Smart Context, File Center e Integrity; (2) Backup/Restore; (3) OneShot/ensure_blob; (4) Import Roots. Manter 054–057 como donas da lógica de domínio; 063 define contratos filesystem comuns. Recuperação de staging deve reconhecer UUID/owner/idade e nunca remover paths desconhecidos. Logs não devem expor paths absolutos.
A abstração deve especificar hardlinks separadamente: hardlink não é symlink; decidir se é permitido para roots externos e armazenamento interno. Mount points/reparse points também precisam de política por OS.

## Arquivos e funções envolvidos
- Novo src-tauri/src/fs_guard.rs: ProjectDir, BlobStore, VerifiedFile/Dir, open_blob_read(), create_blob_exclusive(), create_staging_dir(), publish_dir_noreplace(), atomic_replace_config().
- src-tauri/src/lib.rs: declarar módulo; project_root(), ensure_blob_with_status(), read_source_safely().
- src-tauri/src/smart_context.rs: smart_context().
- src-tauri/src/file_center.rs: read_file_version().
- src-tauri/src/integrity.rs: verify_project(), verify_file().
- src-tauri/src/backup.rs: safe_blob_source(), hash_file(), create_project_backup(), restore_project_backup().
- src-tauri/src/path_guard.rs: canonical_without_redirect(), canonical_identity(), open_verified(), load_roots(), save_roots(), add_root(), remove_root(), list_roots().
- src-tauri/src/advanced.rs: project_root(), oneshot_capture().
- src-tauri/Cargo.toml: dependências mínimas/auditadas, se necessárias.
- src-tauri/src/tests.rs e testes internos dos módulos.

## Invariantes de segurança
Toda leitura/escrita sensível usa handle validado sem reabrir por path; diretórios/componentes não atravessam symlink/junction/reparse point não autorizado; blob é regular, confinado, hash/tamanho coerentes; criação é exclusiva/no-replace; staging só é removido pelo owner; paths do usuário são validados por componentes; falha de API segura é fail-closed; logs não expõem paths/conteúdo.

## Riscos de regressão
APIs Unix/Windows não são simétricas; junction/reparse point, mount point e hardlink exigem política; dir handles podem não suportar todos targets mobile; rename/publicação variam por filesystem; migração incremental deixa janela entre módulos; handles abertos podem impedir replace/delete no Windows; FFI/dependências ampliam supply chain.

## Dependências
054 OneShot, 055 Backup/Restore, 056 Restore Destination, 057 Import Roots, 058 Limits, 065/066 Integration/Regression e 067 CI. Missão 063 é transversal, mas não deve duplicar lógica de domínio das 054–057.

## Testes necessários
Unitários: path components, identity, containment, regular file, no-follow/no-replace e cleanup ownership. Integração: import→blob→File Center→Integrity→backup→restore. Adversariais: symlink/junction/reparse point em cada componente, swap entre validação/open, parent swap, hardlink, case folding, traversal e substituição após open. Concorrência: blob writers, roots add/remove, restore no mesmo target e cleanup concorrente. Linux/Windows obrigatórios e macOS se suportado. Fuzz/property para paths e manifests. TESTE NÃO EXECUTADO: nenhum build, teste, fuzz, stress ou teste multiplataforma foi executado nesta proposta.

## Critérios objetivos de aceite
Nenhum caminho sensível faz canonicalize e reabre o mesmo objeto sem identidade/handle; swaps não leem/escrevem fora da raiz; no-replace evita sobrescrita multiprocesso; módulos migrados passam no mesmo conjunto adversarial; nenhum fallback inseguro permanece.

## Limitações
É proposta arquitetural, não prova que uma crate única cobre todos os OS/filesystems. Requer protótipo e CI autorizado por plataforma; rollout incremental.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- arquivo: novo src-tauri/src/fs_guard.rs; função: API ProjectDir/BlobStore/open_blob_read/create_blob_exclusive/publish_dir_noreplace; mudança: camada handle-based no-follow/no-replace; teste: unitário e adversarial; risco: FFI/compatibilidade.
- arquivo: src-tauri/src/lib.rs; função: project_root()/ensure_blob_with_status()/read_source_safely(); mudança: delegar resolução segura; teste: import e blob concorrente; risco: regressão storage/cleanup.
- arquivo: src-tauri/src/smart_context.rs, file_center.rs, integrity.rs; função: smart_context()/read_file_version()/verify_project()/verify_file(); mudança: abrir e ler por handle validado; teste: symlink swap e hash; risco: offsets/performance.
- arquivo: src-tauri/src/backup.rs; função: safe_blob_source()/hash_file()/create_project_backup()/restore_project_backup(); mudança: handle-safe streaming e publicação no-replace; teste: parent swap, symlink e concorrência; risco: OS/FS.
- arquivo: src-tauri/src/path_guard.rs; função: open_verified()/load_roots()/save_roots()/add_root()/remove_root(); mudança: integrar guard e lock/replace; teste: race de root/import; risco: lock e revogação.
- arquivo: src-tauri/src/advanced.rs; função: oneshot_capture(); mudança: usar BlobStore exclusivo e commit SQLite seguro; teste: N writers mesmo hash e crash; risco: corrida blob/DB.