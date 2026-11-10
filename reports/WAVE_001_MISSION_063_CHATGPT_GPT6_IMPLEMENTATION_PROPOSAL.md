# WAVE 001 — Missão 063: Filesystem Audit — hardening transversal

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** arquitetura Rust/SQLite, segurança de filesystem e confiabilidade
- **Função:** proposta técnica independente pós-auditoria; somente leitura
- **Data:** 2026-11-10
- **Status:** REVIEW_REQUIRED
- **Branch analisada:** `v2-saas-alpha`
- **HEAD/arquivos:** evidências obtidas por fetch dos arquivos indicados; hashes anotados abaixo. Nenhum teste de runtime foi executado.

## Análise do problema atual
A aplicação tem proteções úteis, mas cada módulo faz validação/canonicalização de forma própria. O padrão `canonicalize → checar prefix → reabrir por path` deixa uma janela TOCTOU. O path_guard reduz risco para import source ao comparar identidade do handle aberto com identidade previamente aberta; isso não é ainda uma API comum para blobs/backup/restore. Restore target usa check + rename, OneShot Capture usa exists/read/rename, backup faz canonicalize e depois fs::copy. Hardening precisa padronizar operações baseadas em handles, não só adicionar mais verificações de string.

## Evidências no código
- `src-tauri/src/path_guard.rs`, SHA `588fc60077dad959263c8ad5c2a36df9b1df95ad`: `canonical_without_redirect`, `canonical_identity`, `open_verified`; identity usa dev+ino em Unix e volume+file index em Windows. `open_verified` faz duas aberturas para identidade esperada e final.
- `src-tauri/src/backup.rs`, SHA `524674d95247407b507a0ad96a73531225ab6259`: `safe_blob_source` retorna PathBuf canonicalizado e depois `fs::copy` reabre; restore faz symlink_metadata/canonicalize/rename.
- `src-tauri/src/smart_context.rs`, SHA `4f60ad434a18526e2293d16f663eca1c47e60a7d`: canonicaliza blob e depois `fs::read_to_string`.
- `src-tauri/src/lib.rs`: `ensure_blob_with_status` e `read_source_safely` fazem operações path-based; OneShot Capture em `advanced.rs::oneshot_capture` usa exists, rename e read.
- `src-tauri/src/path_guard.rs`: roots JSON load-modify-save sem lock/replace seguro (Missão 057).

## Solução proposta
Criar um módulo pequeno `safe_fs.rs` com primitives de baixo nível e contratos claros:
1. `open_child_file_nofollow(parent_handle, name)`: abrir filho relativo a diretório já aberto, sem seguir symlink/reparse point; validar tipo regular e obter identity do próprio handle.
2. `open_child_dir_nofollow`: mesmo para diretórios e componentes; navegar por handles em vez de concatenar strings e canonicalize repetidamente.
3. `copy_hash_from_handle`: stream de um handle já validado, com byte budget/deadline (consumido por 051/055).
4. `publish_dir_noreplace(parent_handle, stage_name, target_name)`: rename atômico sem substituir, consumido por 056/055.
5. `atomic_replace_file(parent_handle,temp,target)`: replace atômico de config, consumido por 057.
6. Operações de cleanup recebem um handle/base e nome relativo criado pela operação; não aceitam path arbitrário vindo de manifest/usuário.

Unix: openat/openat2 com O_NOFOLLOW e RESOLVE_BENEATH/NO_MAGICLINKS quando suportado; fstat/fstatat para identidade; renameat2 RENAME_NOREPLACE. macOS: openat/O_NOFOLLOW e renamex_np(RENAME_EXCL), com fallback somente se comprovadamente seguro. Windows: CreateFileW com FILE_FLAG_OPEN_REPARSE_POINT, validar atributos/tag e volume/file ID; MoveFileExW/ReplaceFileW com flags de no-replace/replace definidos explicitamente. Não implementar fallback permissivo em plataforma não suportada.

Não prometer uma abstração idêntica em todas as plataformas sem testar semântica de mount point, junction, hardlink, case-sensitive directories e filesystem remoto. Encapsular unsafe FFI, documentar invariants e limitar número de primitives.

## Arquivos e funções envolvidos
- Novo `src-tauri/src/safe_fs.rs`: APIs acima, identidade e testes por plataforma.
- `src-tauri/src/lib.rs`: declarar módulo.
- `src-tauri/Cargo.toml`: só adicionar crate cross-platform se revisão de manutenção/licença e cobertura API justificar; evitar várias crates sobrepostas.
- `src-tauri/src/path_guard.rs`: `canonical_without_redirect`, `canonical_identity`, `open_verified`, `load_roots`, `save_roots`; migrar para handle-based root validation.
- `src-tauri/src/smart_context.rs`: abertura e leitura de blob pelo handle seguro.
- `src-tauri/src/backup.rs`: `safe_blob_source`, `hash_file`, `create_project_backup`, `restore_project_backup`; copiar/hash via handle e publish no-replace.
- `src-tauri/src/advanced.rs`: `oneshot_capture`; criar blob exclusivo e impedir cleanup de conteúdo que outra operação referenciou.
- `src-tauri/src/lib.rs`: `ensure_blob_with_status`, `read_source_safely`; criação exclusiva/atômica de blob e import source.
- `src-tauri/src/limits.rs`: budgets usados pelo safe copy/read, sem duplicar constantes por módulo.

## Invariantes de segurança
- Toda leitura/cópia sensível parte de handle validado e permanece no mesmo objeto aberto.
- Nenhuma operação segue symlink/junction/reparse point sem política explícita.
- Toda publicação tem semântica declarada: no-replace ou replace atômico; nunca `exists + rename` como exclusão mútua.
- Caminhos de manifest são nomes relativos estritos e não podem escolher diretório arbitrário.
- Cleanup só remove inode/objeto criado pela operação, depois de verificar ownership e ausência de referências concorrentes.
- Falha em primitive segura é fail-closed, sem fallback para fs::copy/rename inseguro.

## Riscos e dependências
- FFI unsafe multiplataforma tem alto risco de bug; exigir review específico por SO.
- Hardlinks não são symlinks: identidade e política de link devem definir se hardlink externo é aceito; para blob content-addressed, SHA no handle protege conteúdo, mas não origem.
- Mount points/reparse tags e filesystem remoto podem ter semântica diferente.
- Refatorar vários módulos em uma wave aumenta regressão; sequenciar módulo safe_fs + testes, depois migrar consumidores em commits separados.
- Dependências diretas: 056 no-replace; 057 roots persistence; 051/055 bounded stream; 054 OneShot Capture como superfície adjacente.
- A função atual `open_verified` já compara identity, então não substituir por simples canonicalize ou regressão de segurança.

## Testes necessários
- Unitários por SO: path traversal, prefix collision, symlink, dangling symlink, junction, reparse point, hardlink, mount point, case folding, Unicode names.
- TOCTOU adversarial: processo concorrente troca componente/arquivo entre validação e open; resultado deve negar ou manter handle original dentro da raiz.
- Publish: no-replace contra target existente; replace atômico preserva arquivo antigo em falha.
- Blob: symlink swap entre canonicalize e read/copy; conteúdo hash mismatch; arquivo alterado enquanto aberto.
- Cleanup: staging próprio removido, target/arquivo alheio intacto.
- CI: Windows + Linux + macOS (se suportado), em filesystem local; documentar unsupported cases.
- Stress: operações simultâneas import/backup/restore/capture e root revoke.

## Critérios objetivos de aceite
- Zero path escape em testes adversariais; operação bloqueada quando primitive no-follow não existe.
- Todos os consumidores de blob/backup/restore usam helper handle-based, não canonicalize→reopen.
- Publicação no-replace passa corrida com processo externo.
- Replace de config nunca remove original antes do novo estar durável.
- Cleanup nunca remove arquivo que não pertence à operação.
- TESTE NÃO EXECUTADO: todos os testes dinâmicos, multi-SO, stress e TOCTOU.

## Limitações
Análise estática de arquivos selecionados, sem acesso a host adversarial nem CI local. A escolha final de APIs exige confirmação dos OS mínimos suportados, toolchain e review de FFI. Esta missão não certifica que toda superfície do produto está coberta até inventário completo dos usos de std::fs e paths.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- **arquivo:** novo `src-tauri/src/safe_fs.rs` | **função:** open child nofollow / identity / copy_hash / publish no-replace / atomic replace | **mudança:** primitives baseadas em handle e operações relativas ao parent | **teste:** symlink/junction/TOCTOU/no-replace por SO | **risco:** FFI unsafe e diferenças de filesystem.
- **arquivo:** `src-tauri/src/path_guard.rs` | **função:** `open_verified`, `canonical_without_redirect` | **mudança:** validar root e arquivo pelo mesmo conjunto de handles; manter identity checks atuais | **teste:** troca concorrente de root/file | **risco:** mudança de política para roots existentes.
- **arquivo:** `src-tauri/src/smart_context.rs` | **função:** `smart_context` | **mudança:** ler blob do handle seguro e com budget 051 | **teste:** blob symlink swap e budget | **risco:** regressão no retrieval.
- **arquivo:** `src-tauri/src/backup.rs` | **função:** `safe_blob_source`, `hash_file`, `create_project_backup`, `restore_project_backup` | **mudança:** handle-safe copy/hash e publicação 056; budgets 055 | **teste:** TOCTOU, manifest adversarial, restore collision | **risco:** portabilidade e compatibilidade.
- **arquivo:** `src-tauri/src/advanced.rs` | **função:** `oneshot_capture` | **mudança:** create_new blob, validação por handle e cleanup por ownership | **teste:** writers simultâneos e falha após blob | **risco:** blob órfão ou remoção indevida.
- **arquivo:** `src-tauri/src/lib.rs` | **função:** `ensure_blob_with_status`, `read_source_safely` | **mudança:** primitives compartilhadas para import/criação de blob | **teste:** import concorrente e symlink swap | **risco:** regressão de importação.
- **arquivo:** `src-tauri/Cargo.toml` | **função:** dependências de plataforma | **mudança:** selecionar no máximo uma abstração adicional após revisão | **teste:** build matriz de SO | **risco:** supply chain e suporte.

## Fontes consultadas e integridade
- Wave spec: `WAVE_001_IMPLEMENTATION_MISSIONS.md` SHA `6ac5f4213961fa991e272fd146708bf78d3570fd`.
- Protocolo: `CENTRAL.md` e `INSTRUCTIONS.md`.
- Relatórios anteriores individuais: `reports/AUTOMATION_AI_MISSION_063_CHATGPT_GPT6.md` (lido antes desta proposta); missões relacionadas consultadas conforme dependência: 054, 058, 064, 041 e 050.
- Código principal: hashes indicados nas seções de evidência. Nenhum arquivo do produto foi alterado.
- **TESTE NÃO EXECUTADO:** build, cargo test, CI, integração, stress e testes multi-plataforma.

**Decisão:** proposta técnica, não implementação. Depende de aprovação do GPT-6 integrador antes de qualquer patch.
