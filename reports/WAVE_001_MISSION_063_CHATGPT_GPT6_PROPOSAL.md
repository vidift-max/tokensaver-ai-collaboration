# WAVE 001 — Missão 063: Filesystem Audit — resolução segura e TOCTOU

## Identificação
- Nome da IA: ChatGPT
- Modelo: GPT-6 (OpenAI)
- Especialidade: segurança de filesystem multiplataforma, Rust/Tauri e persistência SQLite
- Função: proposta técnica independente pós-auditoria; somente leitura
- Data: 2026-11-10
- Status: PROPOSTA PRONTA PARA APROVAÇÃO

## Objetivo
Definir uma fronteira comum e verificável para operações de filesystem do TokenSaver, com foco em diretórios de projeto, blobs, import roots, backups, staging, publicação e arquivos de configuração.

## Análise do problema atual
A validação é fragmentada. Alguns módulos canonicalizam blobs ou verificam symlinks, outros montam `app_data_dir/storage/projects/<id>` e abrem `db.sqlite` diretamente. `canonicalize` seguido de open por pathname não elimina TOCTOU: um componente pode ser trocado depois da verificação. No Windows, junctions/reparse points não são necessariamente cobertos por uma checagem simples de `file_type().is_symlink()`.

Há controles existentes importantes: `path_guard::open_verified` compara identidade do arquivo aberto com a identidade canônica esperada; `backup.rs` valida vários componentes e arquivos; Smart Context/File Center verificam confinamento de blobs em seus fluxos. A proposta é centralizar e fechar lacunas, não remover essas proteções.

## Evidências no código
- `src-tauri/src/lib.rs::project_root`: valida ID textual e concatena `storage/projects/<id>`; não prova por handle que storage/projects/projeto estão confinados e livres de redirecionamento.
- `smart_context.rs::project_root` e `project_memory.rs::list_project_memory/set_project_memory`: constroem raiz de projeto separadamente e abrem DB por pathname.
- `file_center.rs`, `integrity.rs`, `history.rs`, `advanced.rs::project_root`: usam resolvedores locais ou paths próprios; devem migrar para contrato comum.
- `backup.rs::create_project_backup/restore_project_backup/safe_blob_source`: possui verificações próprias de symlink/canonicalização; ainda há operações por pathname e janelas entre validar e usar.
- `path_guard.rs::open_verified`: valida caminho absoluto, roots, redirecionamentos e identidade do handle; `load_roots/save_roots` têm questões próprias de budget/atomicidade tratadas na 057.
- `advanced.rs::oneshot_capture`: fluxo separado de escrita de blob; precisa ser integrado à abstração segura de blob, mas não afirmar sem teste que toda troca de link produz escrita externa.
- HEAD do produto consultado: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.

## Solução proposta
1. Criar módulo `project_fs.rs` (ou `filesystem.rs`) como dono de resolução de storage, projetos, project roots, blobs, backups e staging. Tipos propostos: `VerifiedStorageRoot`, `VerifiedProjectRoot`, `VerifiedBlob`, `VerifiedBackupDir`.
2. Validar cada componente desde app data até o diretório final; exigir diretório regular, rejeitar symlink e reparse points/junctions, e provar que o caminho final está abaixo do root autorizado.
3. Não considerar `canonicalize + starts_with + open(path)` prova suficiente contra TOCTOU. Em Unix, usar resolução handle-relative (openat/openat2 com `O_NOFOLLOW`, `RESOLVE_BENEATH`, `RESOLVE_NO_SYMLINKS` quando disponível) e manter handles de diretórios. Em Windows, abrir diretórios com `CreateFileW` e `FILE_FLAG_OPEN_REPARSE_POINT | FILE_FLAG_BACKUP_SEMANTICS`, inspecionar atributos/tag de reparse e manter handle/identidade; junctions e mount points devem ser rejeitados conforme política.
4. Definir fallback por plataforma fail-closed: se não for possível provar o confinamento, negar a operação com erro de storage, nunca voltar silenciosamente ao pathname inseguro.
5. Integrar a abstração com o acesso ao SQLite. O atual `db::open(path)` abre por pathname e cria diretório pai. O patch precisa definir como abrir `db.sqlite` sob root verificado (idealmente VFS/handle-aware ou API SQLite com NOFOLLOW + validação de identidade antes/depois); não basta passar um `PathBuf` canonicalizado e alegar proteção completa.
6. Remover `create_dir_all` genérico de fronteiras sensíveis quando ele puder atravessar componente redirecionado; criação de diretórios deve ocorrer relativamente ao handle validado e com modo exclusivo quando necessário.
7. Criar helpers para arquivos regulares: abrir sem seguir link final, verificar identidade do handle, tamanho e tipo; ler/escrever via handle aberto, não reabrir path depois da validação.
8. Aplicar os helpers às operações de blob: importação, leitura File Center, Smart Context, OneShot, backup e restore.
9. Aplicar a publicação segura no restore (Missão 056): rename no-replace relativo a diretórios verificados; staging sempre no mesmo filesystem.
10. Aplicar a mesma política a Import Roots (057), arquivos temporários, manifest e config.
11. Documentar threat model: ataques por processos não privilegiados com mesma conta, diretório sincronizado/cloud, antivírus/backup software e mount points. Diferenciar defesa contra symlink estático de defesa contra atacante que pode trocar diretórios em tempo real.

## Arquivos envolvidos
- Novo: `src-tauri/src/project_fs.rs` (ou `filesystem.rs`).
- `src-tauri/src/lib.rs` (mod declaration, `project_root`, `initialize_project`, `import_text_file`, blob helpers).
- `src-tauri/src/db.rs::open` e abertura de DB.
- `src-tauri/src/smart_context.rs`.
- `src-tauri/src/project_memory.rs`.
- `src-tauri/src/file_center.rs`.
- `src-tauri/src/integrity.rs`.
- `src-tauri/src/history.rs`.
- `src-tauri/src/advanced.rs` (project_root e oneshot_capture).
- `src-tauri/src/backup.rs`.
- `src-tauri/src/path_guard.rs`.
- `src-tauri/Cargo.toml` e `Cargo.lock` se forem necessárias APIs/crates específicas.

## Funções/módulos envolvidos
- Novo `project_fs::resolve_storage_root`, `resolve_project_root`, `open_regular_file_nofollow`, `resolve_blob`, `publish_noreplace`.
- `lib.rs::project_root`, `initialize_project`, `ensure_blob_with_status`, `read_source_safely`.
- `db::open` / novo método de open sob diretório verificado.
- `smart_context::project_root/smart_context`.
- `project_memory::list_project_memory/set_project_memory`.
- `file_center::project_root/list_project_files/read_file_version`.
- `integrity::project_root/verify_project`.
- `history::project_root/list_operations`.
- `advanced::project_root/oneshot_capture`.
- `backup::app_storage/create_project_backup/restore_project_backup/safe_blob_source/hash_file`.
- `path_guard::canonical_without_redirect/open_verified/load_roots/save_roots`.

## Invariantes de segurança
- Nenhum caminho fora do app storage autorizado é aberto, criado, sobrescrito ou removido.
- Nenhum componente symlink/junction/reparse point é aceito em fronteiras críticas.
- Verificação e uso referem-se ao mesmo objeto de filesystem, não apenas ao mesmo pathname textual.
- DB é aberto somente sob project root validado; não se cria DB acidentalmente em caminho externo.
- Blob é arquivo regular, hash/tamanho validados e path derivado de hash canônico.
- Staging e temporários são criados exclusivamente e removidos somente se pertencem à operação.
- Restore publica sem substituir destino preexistente.
- Import roots persistidos não ampliam o escopo autorizado por path traversal/redirecionamento.
- Falha em validação é fail-closed; nunca fallback para open/copy/rename inseguro.

## Riscos de regressão
- Implementação de handles e reparse points é complexa e divergente por SO.
- Abertura SQLite por handle pode exigir VFS ou extensão específica; `db::open` atual cria parent e pode contrariar a abstração.
- Aplicativos em pastas sincronizadas, drives de rede, volumes montados e permissões especiais podem passar a ser rejeitados.
- Testes de race são sensíveis a timing; devem usar hooks/barriers determinísticos e múltiplos processos.
- Dependências nativas aumentam manutenção e podem alterar build/empacotamento.
- Unificação prematura pode causar regressão em fluxos já protegidos (backup, import roots, File Center); migrar módulo por módulo e preservar invariantes.

## Dependências
- Missões 051, 052, 055, 056 e 057 precisam consumir a abstração comum, mas não devem aguardar toda a refatoração para definir budgets/transações.
- 056 depende de publicação no-replace; 055 depende de leitura limitada e paths verificados.
- 057 depende de política comum de symlink/junction e lock/atomic replace.
- Requer decisão de plataformas oficialmente suportadas e modelo de ameaça.
- Requer validação das APIs/crates nativas e CI Linux/Windows (macOS se suportado).

## Testes necessários
### Unitários
- Validação de ID, componentes e canonicalização.
- Diretório/arquivo regular, symlink final, symlink pai, junction, reparse point e mount point.
- Hash/filename e path traversal de blob.
- Create-new temporário e cleanup por operation ID.
- Erros fail-closed em APIs não suportadas.

### Integração
- Symlink em app_data/storage/projects/project_id/blobs/backups/staging/manifest/config.
- Troca de diretório entre validação e abertura do DB; verificar identidade do handle e ausência de alteração fora da raiz.
- OneShot e File Center com blob substituído por symlink.
- Backup/restore com backup path, manifest e blob adulterados.
- Import roots apontando para links/junctions e substituição durante open.
- Verificar que nenhum DB externo foi criado ou modificado.

### Concorrência/estresse
- Race loops entre rename/swap de componentes e operações de open/read/write/delete.
- Duas restaurações e initialize concorrentes para o mesmo project ID.
- Mutação concorrente de blob durante hash/read.
- Executar em Linux e Windows; macOS conforme matriz suportada.
- Testes devem registrar objeto/identidade aberto e comparar com destino esperado, não apenas assert de erro.

## Critérios objetivos de aceite
1. Todos os módulos de projeto usam um resolver único, sem `project_root` local divergente.
2. Os diretórios-pai e o projeto são validados contra symlink/reparse e confinamento físico.
3. Abertura de DB tem garantia documentada e testada contra troca de componentes; `canonicalize` isolado não conta.
4. Blob, manifest e arquivos temporários usam open no-follow e handle validado.
5. Restore usa publicação no-replace.
6. Testes de symlink/junction/TOCTOU passam em cada SO suportado.
7. Testes negativos provam que nenhum arquivo externo é lido, criado, alterado ou removido.
8. CI cobre as plataformas suportadas e nenhuma rota sensível fica fora do inventário.

## Limitações
- A inspeção é estática e não prova exploração de todas as janelas TOCTOU.
- APIs handle-relative e integração SQLite precisam de protótipo técnico antes de prometer garantia total.
- Não foram executados testes Windows de junction/reparse point.
- A proposta não afirma que importação individual ou File Center estão sem proteção; reconhece seus controles atuais.

## Testes executados
**TESTE NÃO EXECUTADO.** Nenhum teste de filesystem, junction, symlink race, build ou CI foi executado nesta proposta.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- arquivo: `src-tauri/src/project_fs.rs` (novo); funções: `resolve_storage_root/resolve_project_root/open_regular_file_nofollow/resolve_blob/publish_noreplace`; mudança: encapsular handles, canonicalização e operações no-follow por plataforma; teste: symlink/junction/TOCTOU; risco: complexidade e dependências nativas.
- arquivo: `src-tauri/src/lib.rs`; funções: `project_root/initialize_project/ensure_blob_with_status/read_source_safely`; mudança: delegar resolução e criação ao helper comum; teste: project root e blob externos; risco: quebra de inicialização e importação.
- arquivo: `src-tauri/src/db.rs`; função: `open`; mudança: adicionar abertura vinculada ao root verificado e evitar criação implícita de parent em fluxo sensível; teste: DB path swap; risco: SQLite VFS/NOFOLLOW e migrações.
- arquivos: `smart_context.rs`, `project_memory.rs`, `file_center.rs`, `integrity.rs`, `history.rs`, `advanced.rs`; funções: resolvers locais e comandos; mudança: consumir VerifiedProjectRoot; teste: suite por comando; risco: regressões transversais.
- arquivo: `src-tauri/src/backup.rs`; funções: `create_project_backup/restore_project_backup/safe_blob_source`; mudança: abrir fontes/destinos por handles e publish no-replace; teste: symlink/junction/race e restore; risco: compatibilidade multiplataforma.
- arquivo: `src-tauri/src/path_guard.rs`; funções: `canonical_without_redirect/open_verified`; mudança: compartilhar primitivas e manter identidade de handle; teste: troca de root/arquivo durante open; risco: import paths legítimos rejeitados.
- arquivo: `src-tauri/Cargo.toml`/ `Cargo.lock`; módulo: dependências; mudança: incluir crates/bindings só após protótipo e aprovação; teste: build em todas as plataformas; risco: cadeia de supply/build.
