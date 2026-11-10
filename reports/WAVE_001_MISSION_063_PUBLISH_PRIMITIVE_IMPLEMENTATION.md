# Wave 001 — Mission 063 — Filesystem Hardening Implementation Report

**Status:** IMPLEMENTED — TESTS PENDING

## Scope
Incremental filesystem hardening continued from the minimal no-replace publication primitive. The implementation intentionally avoids a global filesystem rewrite and adds small reusable primitives used by backup/restore.

## Product repository
Repository: vidift-max/tokensaver-ai
Branch: v2-saas-alpha

### Relevant implementation commits
- 075d9e2e32ea78c307dccab8c1c8ddb5ef28b8ec — Unix libc dependency
- 926fbaf89cd9d9b211da70a7094b7572a07e3a46 — filesystem module registration
- 65d2f338289f21089b639967ba042d2928e9f6e5 — atomic no-replace publication
- 144085e8f604d628ec102fb2c4bae18515404e8e — bounded SHA-256 file hashing
- a7ac1c3cd563e613da70698c1a7e88abe1c89e01 — bounded file copy primitive
- d813a4798b0e3df9dc1bc8297c6219c790814b6d — backup integration

## Implemented primitives

### 1. publish_noreplace(stage, target)
- Linux: renameat2(..., RENAME_NOREPLACE).
- Windows: MoveFileExW without replacement.
- Unsupported platforms fail closed.
- The existence check is only an early optimization; correctness depends on the native operation.

### 2. sha256_file_limited(path, max_bytes)
- Reads in bounded chunks.
- Counts actual bytes read.
- Rejects when the real byte count exceeds the configured limit.
- Does not trust filesystem metadata as the resource budget.

### 3. copy_file_limited(source, target, max_bytes)
- Copies in bounded chunks.
- Counts actual bytes copied.
- Rejects oversized files before allowing the copy to complete.
- Calls sync_all() on the destination.
- Added a unit test for rejection of an oversized source.

## Consumers hardened

### Backup
Mission 055 backup flow now:
- uses copy_file_limited for blob copies instead of unrestricted fs::copy;
- verifies copied length against the subsequently hashed length;
- uses publish_noreplace for final backup publication instead of ordinary fs::rename.

Mission 056 restore was previously migrated to publish_noreplace, and initialize_project now claims an absent project directory with create_dir before proceeding.

## Verification status
**TESTE NÃO EXECUTADO.**

The following still require real execution:
- Rust unit tests / compilation;
- concurrent no-replace publication race;
- Linux runtime verification;
- Windows runtime verification;
- backup oversized-file and corruption cases;
- restore vs initialization race;
- same-filesystem publication behavior;
- failure/staging cleanup behavior.

No test result is being claimed.

## Remaining Mission 063 work
This is not the complete filesystem audit. Remaining consumers still require review, especially:
- OneShot Capture;
- blob creation/publication in lib.rs;
- File Center reads;
- import path verification;
- remaining backup/restore path surfaces;
- symlink/junction/reparse and TOCTOU behavior across supported operating systems.

The next safe step is to run the actual test suite and then extend the primitives only where the tests and code audit demonstrate a need.

### PATCH PLAN
1. Execute Rust tests and compile checks.
2. Fix only verified compilation/test failures.
3. Run concurrency/resource-limit verification.
4. Re-audit 051/055/056/057/063.
5. Continue Mission 063 remaining consumers incrementally.