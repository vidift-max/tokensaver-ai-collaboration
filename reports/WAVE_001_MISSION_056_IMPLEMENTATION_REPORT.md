# Wave 001 — Mission 056 Implementation Report

## Status

**IMPLEMENTED — TESTS PENDING**

Mission 056 (Restore Destination) was implemented after Mission 063's minimal no-replace publication primitive became available.

## Product changes

Product repository: `vidift-max/tokensaver-ai`
Branch: `v2-saas-alpha`

### 1. Restore publication

File:
- `src-tauri/src/backup.rs`

Change:
- Replaced the restore check-then-`fs::rename(stage, target)` publication with `filesystem::publish_noreplace(&stage, &target)`.
- Restore therefore no longer relies on a prior existence check as the correctness mechanism.
- If the destination is already claimed, publication fails instead of replacing it.
- The error is fail-closed when the platform primitive is unavailable.

Commit:
`5fdb90438111c311f6d606ec57e527a0acbf90d2`

### 2. Project initialization claim

File:
- `src-tauri/src/lib.rs`

Change:
- `initialize_project` now first attempts to create the project directory with `fs::create_dir`.
- A successful creation claims the destination.
- `AlreadyExists` is handled only after validating that the existing entry is a regular directory, rejecting symlinks/non-directories.
- Existing project initialization continues to create `blobs/` and open the project database.

This makes initialization and restore compete for the same directory claim: whichever operation claims the project directory first wins; the other operation must not replace it.

Commit:
`46a0908e4777210f5e376203332184a7c5c6d0ce`

## Important limitation

This is the **minimal Mission 056 implementation**, not a claim that all filesystem TOCTOU risks are solved. Mission 063 remains partially implemented and still requires broader adoption/re-audit.

## Tests

**TESTE NÃO EXECUTADO**

Required verification before Wave 001 can be considered complete:
- Rust unit tests.
- Concurrent restore attempts targeting the same project.
- Restore racing with `initialize_project`.
- Existing-target refusal.
- Linux runtime verification.
- Windows runtime verification.
- Failure/cleanup behavior for staging directories.
- Same-filesystem publication behavior.

No test result is being claimed without execution.

## Acceptance criteria

- [x] Restore no longer publishes with ordinary check-then-rename.
- [x] Restore uses the centralized no-replace primitive from Mission 063.
- [x] Initialization participates in the same destination-claim protocol.
- [x] Existing symlink/non-directory target is rejected.
- [ ] Concurrency tests executed.
- [ ] Cross-platform runtime tests executed.
- [ ] Re-audit completed.

## Next dependency

Mission 056 now requires verification before broader filesystem hardening. After tests, re-audit Mission 056 and Mission 063 before extending the primitive to other consumers.

**STATUS: IMPLEMENTATION COMPLETE — VERIFICATION REQUIRED**


## Adendo — teste de concorrência restore × initialize (2026-11-10)

- Produto commit: `73addafc9247dd7504e90ca79b43e2226579e48a`.
- Arquivo alterado: `src-tauri/src/project_storage.rs`.
- Novo teste: `restore_publication_racing_project_initialization_never_replaces_winner`.
- O teste sincroniza duas threads: uma tenta reivindicar o diretório via `claim_project_root`; a outra publica um diretório de staging com `filesystem::publish_noreplace`. Verifica que a restauração nunca substitui um destino já reivindicado e que o staging permanece intacto quando perde.
- A cobertura é de concorrência entre as primitivas de claim/publicação, não um teste ponta a ponta da command Tauri `restore_project_backup` (que depende de AppHandle/storage fixture).
- **TESTE NÃO EXECUTADO:** sem execução local; CI/status do commit consultado retornou lista vazia. Linux e Windows permanecem pendentes.
- Restore × restore já possui cobertura concorrente genérica em `filesystem.rs` (`concurrent_publication_never_replaces_winner`), mas ainda falta harness de restauração ponta a ponta.
- Status: IMPLEMENTED — VERIFICATION REQUIRED.
