# Wave 001 — Mission 057 Implementation Report

## Status

**IMPLEMENTED — TESTS PENDING**

Mission 057 received the planned first-pass hardening for Import Roots.

## Changes

Repository: `vidift-max/tokensaver-ai`
Branch: `v2-saas-alpha`

Files:
- `src-tauri/src/path_guard.rs`
- `src-tauri/Cargo.toml`

Implemented:
- cross-process advisory lock around add/remove read-modify-write operations;
- Unix `flock`;
- Windows `LockFileEx` / `UnlockFileEx`;
- bounded JSON read before parsing;
- maximum persisted JSON size: 160 KiB;
- central 4,096-byte path-length validation for persisted roots;
- maximum root count remains enforced before mutation;
- unique temporary filename using UUID;
- atomic replacement without deleting the existing file first on Windows;
- write-through replacement on Windows;
- cleanup/error handling for temporary files;
- persistent lock-file pathname so process crashes release the OS lock rather than leaving an orphaned lock state.

Commits:
- `1c62add1e6455b61d057d61b3aae322dfeb10bae`
- `89188847243644abcb319fed665fb3ed7c2c87a5`
- `4637364fe3571f46e9cde373edb7a5e0632a94bf`

## Important design choice

The lock is an OS-level advisory lock held across the complete load → modify → save transaction. The lock file itself is intentionally retained; deleting the pathname on unlock would allow another process to open a different inode and bypass the lock.

## Preserved behavior

- Existing Import Root validation remains.
- Existing maximum root count remains.
- Path canonicalization/link protections remain.
- No migration to SQLite was introduced.
- No frontend contract was changed.

## Tests

**TESTE NÃO EXECUTADO**

Required verification:
- two concurrent add operations without lost updates;
- concurrent add/remove;
- 32-root boundary;
- oversized JSON;
- oversized path;
- process interruption during write;
- temporary-file collision;
- Windows replacement while destination exists;
- Linux and Windows runtime;
- normal list/open behavior after changes.

## Acceptance

- [x] Read-modify-write serialized.
- [x] JSON bounded before parse.
- [x] Root count bounded.
- [x] Path length bounded on persisted data.
- [x] Temporary filename unique.
- [x] Existing file is not deleted before Windows replacement.
- [x] OS lock released automatically when process exits.
- [ ] Tests executed.
- [ ] Cross-platform verification.
- [ ] Re-audit completed.

**STATUS: IMPLEMENTATION COMPLETE — VERIFICATION REQUIRED**


## Adendo — teste cross-process GPT-6 (2026-11-10)

- Extraída a função interna `acquire_roots_lock(file, timeout)`, mantendo `Duration::from_secs(5)` no caminho de produção.
- Adicionados `roots_lock_cross_process_child` e `roots_lock_is_exclusive_across_processes`: processo pai mantém o lock e o subprocesso deve falhar ao tentar obter o mesmo lock após timeout curto.
- Produto commit: `907d6ddf6376cbc73a2a32ca6fbc7fdbc92a9406`.
- O teste foi adicionado, mas ainda NÃO EXECUTADO/VALIDADO pelo CI na hora deste adendo. Missão 057 continua IMPLEMENTED — VERIFICATION REQUIRED.
- Nenhuma outra API, persistência ou comportamento de produto foi alterado.
