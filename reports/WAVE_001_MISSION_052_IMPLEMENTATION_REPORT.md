# Wave 001 — Mission 052 — Implementation Report

**Status:** IMPLEMENTED — TESTS PENDING

## Scope
Mission 052 (Project Memory): eliminate the race between existence check, 1000-entry count check, and UPSERT.

## Authorized change
Applied to `vidift-max/tokensaver-ai`, branch `v2-saas-alpha`.

Commit:
`31052a54ec0b9ce5eaee251c83c801d48fb5bbb4`

File changed:
- `src-tauri/src/project_memory.rs`

## Implementation
`set_project_memory` now:
1. opens the project database;
2. starts a SQLite `TransactionBehavior::Immediate` transaction;
3. performs the existing-key check inside that transaction;
4. performs the per-project count check inside the same transaction;
5. performs the INSERT/UPSERT inside the same transaction;
6. commits before returning success.

This closes the previously identified check-then-write race where two writers could both observe 999 entries and both insert.

## Preserved behavior
- Updating an existing key remains allowed at the 1000-entry limit.
- New keys are rejected at/above the limit.
- Project scoping remains unchanged.
- No schema change.
- No frontend contract change.

## Tests
**TESTE NÃO EXECUTADO** in this environment.

Required next verification:
- two independent SQLite connections concurrently writing new keys at 999 entries;
- assert the final count never exceeds 1000;
- verify updates to an existing key still succeed at 1000;
- verify different projects remain isolated;
- run the relevant Rust test suite.

## Risks / limitations
- The transaction removes the logical race, but SQLite lock contention/error mapping still needs runtime verification.
- This commit does not yet introduce a dedicated stable transient error code for SQLITE_BUSY/LOCKED.

## Next gate
After tests pass, re-audit Mission 052 and proceed to the Phase B publish primitive (063 minimal no-replace primitive) before Mission 056.
