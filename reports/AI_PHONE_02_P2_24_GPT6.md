# AI-PHONE-02 P2.24 — Technical Readiness Plan for the First Real Phone Channel

**Verdict:** `READY FOR CONTROLLED PROVISIONING — LIVE CHANNEL NOT OPERATIONAL`  
**Scope:** read-only audit of `vidift-max/tokensaver-ai`; documentation-only deliverable in `vidift-max/tokensaver-ai-collaboration`.  
**Collaboration branch:** `mission/ai-phone-02-p2-24`  
**Base:** P2.23 branch HEAD `98ae64fa8a5f5520022d925d3274d67df28f1f29`  
**Main repository baseline audited:** `v2-saas-alpha` at `b143fd4fe63de672b2d1e968da11dbfbd50ef49f`.  
**No main-repository edits, deployment, credentials, paid resources, migrations, or device installation were performed.**

## Executive conclusion

P2.24 confirms that the Team Room private messaging API is real source code and has passed a PostgreSQL-backed integration test in GitHub Actions. This corrects the over-cautious wording in the P2.23 report: the private API is not merely documentation.

However, there is still no deployed/reachable Team Room instance, no provisioned external identities for Phone-01 and Phone-02, no Phone-01 bridge process connected to the GPT-6 conversation, no Android Phone-02 app, and no model executor. Therefore the live Phone-01 ↔ Phone-02 cycle remains blocked.

The P2.23 adapter is a working client prototype against a local HTTP fixture. Its 12/12 result is not a live-service test. This audit also identifies adapter-level routing/ACK validation gaps and a real timestamp-pagination loss case that the existing 12 tests do not fully cover.

Recommended lowest-cost trial stack, subject to owner approval:

- **Render Free Web Service** for the existing Dockerized Axum API and managed HTTPS;
- **Neon Free Postgres** as the durable database (not Render's 30-day Free Postgres);
- **Auth0 Free** as a managed OIDC candidate, configured for the RFC 9068 access-token profile and a custom API scope.

This stack is a reversible test candidate, not a production recommendation. Render Free sleeps after 15 minutes of inactivity and has an ephemeral filesystem; Neon scales compute to zero after inactivity. Auth0 token claims must pass a conformance test against this service before selection is final.

## Round 1 — Exact P2.23 adapter audit

### Branch and files

P2.23 branch comparison against its base:

- Base: `42de3e2eaca2d38dc69f5a91ee3c729968c56771`
- P2.23 HEAD audited: `98ae64fa8a5f5520022d925d3274d67df28f1f29`
- 12 commits ahead, 0 behind.
- Exactly four files added:
  - `prototypes/team-room-private-bridge/bridge.mjs`
  - `prototypes/team-room-private-bridge/bridge.test.mjs`
  - `prototypes/team-room-private-bridge/README.md`
  - `reports/AI_PHONE_02_P2_23_GPT6.md`

No P2.24 changes were made to those prototype files.

### Inputs and outputs

Constructor inputs:

- `apiUrl`: absolute Team Room URL; HTTPS required except loopback development.
- `token`: opaque Team Room session bearer, supplied by the runtime.
- `roomId`: UUID.
- `expectedPrincipalId`: UUID checked against `GET /auth/me`.
- `statePath`: local JSON state file.
- Optional `fetchImpl` and `maxPages`.

Public operations:

- `authenticate()` → verifies `room_id`, `principal_id`, `session_id`, `execution_id`.
- `send(peerPrincipalId, envelope)` → persist outbox, POST private message, mark SENT.
- `poll(peerPrincipalId)` → read private history, validate envelopes, persist inbox/cursor, return pending and blocked messages.
- `acknowledge(peerPrincipalId, messageId, missionId)` → send an application-level ACK message and mark local inbox item ACKED.

Transport endpoints:

- `GET /auth/me`
- `POST /team-room/{room_id}/private/{other_principal_id}/messages`
- `GET /team-room/{room_id}/private/{other_principal_id}/messages?limit=100&before=...`

Messages are JSON serialized inside the Team Room `body` text field. Existing canonical Mission v1 and Agent Result v1 objects are nested inside `MISSION` and `REPORT` envelopes. The adapter does not implement a second JSON Schema set and does not yet perform complete Draft 2020-12 validation.

### Persistence and retry

Local JSON state contains:

- `outbox[]`: peer, idempotency key, SHA-256 payload digest, stable `client_message_id`, body, PENDING/SENT state and server message ID;
- `inbox{}`: durable message entries and their local status;
- `cursors{}`: last message ID and timestamp per peer;
- `seen{}`: deduplication IDs per peer.

Writes use a temporary file, fsync of the file, atomic rename, directory mode 0700 and file mode 0600. The bearer token is not stored in this state file.

A request timeout is 10 seconds. On network failure, the local outbox remains PENDING and a later caller retry reuses the same `client_message_id`. The server's unique key is `(channel_id, sender_principal_id, client_message_id)`; same-content retries return the canonical row, while changed content returns HTTP 409.

**Limitations:**

1. No background retry worker exists in this adapter. A caller must invoke `send()` again.
2. The JSON state file is not encrypted; filesystem modes are not encryption.
3. No file lock protects concurrent bridge processes from read/modify/write races.
4. File rename is atomic, but the parent directory is not fsynced; power-loss durability is not equivalent to a transactional database.
5. The `seen` list is capped at 10,000 IDs; inbox growth/retention is not managed.
6. The adapter does not refresh/reacquire an expired session token.
7. HTTP error bodies are not surfaced; all non-2xx responses become generic HTTP_ERROR.
8. The adapter accepts a peer UUID at each call but does not bind the envelope's `origin` and `destination` fields to the authenticated local/remote principal mapping.
9. `acknowledge()` does not check that its supplied `missionId` equals the mission ID stored in the referenced inbox envelope.
10. A successful send marks SENT even if the response omitted `message_id`; the actual Team Room implementation returns it, but the client should fail closed if it is absent.
11. There is no validation that the incoming mission's `destination` maps to this authenticated Phone-02 principal or that `origin` maps to the peer principal.

### ACK semantics

ACK is a normal private message with `type=ACK`, `status=RECEIVED`, `message_id`, `mission_id`, and an idempotency key. It is **not** the Team Room phone mailbox's server-side ACK state machine. The adapter marks the local inbox item ACKED only after the ACK message POST succeeds.

### P2.23 test evidence

P2.23 reports 12/12 tests passing against an in-process HTTP fixture using a non-secret placeholder bearer. P2.24 did not re-run them. They are local adapter tests, not live Team Room, external PostgreSQL, Android, or hardware tests.

## Round 2 — Team Room source and PostgreSQL audit

Audited immutable source baseline: `b143fd4fe63de672b2d1e968da11dbfbd50ef49f`.

### Actual routes and implementation

The service composes `communication::router(state.pool)` into the main Axum router.

The communication router exposes:

- `GET /team-room/{room_id}/messages`
- `POST /team-room/{room_id}/messages`
- `GET /team-room/{room_id}/private/{other}/messages`
- `POST /team-room/{room_id}/private/{other}/messages`
- `GET /team-room/{room_id}/participants`
- `GET /team-room/{room_id}/tasks`
- `GET /team-room/{room_id}/decisions`
- `POST /team-room/{room_id}/decisions`
- `GET /team-room/{room_id}/attachments`
- `POST /team-room/{room_id}/attachments`
- `POST /team-room/{room_id}/ws-ticket`
- `GET /team-room/{room_id}/ws`

The private conversation is created lazily by `private_channel()`. It requires the recipient to be an active room member, both principals to have active `private_chat` permission, and the channel ACL to include exactly the two principals. A PostgreSQL advisory transaction lock serializes creation for a normalized principal pair.

### Authentication and authorization

- `POST /auth/exchange` validates a signed upstream OIDC access token.
- `GET /auth/me` validates the local opaque bearer session.
- OIDC verification pins RS256 and checks issuer, audience, expiry, not-before when present, subject, `jti`, issue time, and `team_room:connect` scope.
- The exact `issuer + subject` maps to an enabled workload identity and principal.
- The upstream `jti` is consumed once in PostgreSQL; replay is rejected.
- Local bearer sessions are room-bound and capped at 15 minutes or upstream token expiry.
- Revoked/disabled workload identities invalidate local sessions on the next authenticated request.
- Room membership and permissions are independent. Both principals need active room membership and explicit `private_chat`; private history additionally checks channel membership.
- No public admin grant endpoint exists. Principal/workload registration and permissions require a controlled administrative DB process.

The service does not prove that a token was produced by GPT-6, a particular Android binary, or a specific hardware device. It proves only the trusted issuer's assertion and the registered subject mapping.

### PostgreSQL resources

Migration `0009_team_room_communication.sql` creates:

- `team_room_channels`
- `team_room_channel_members`
- `team_room_messages`
- `team_room_message_reads`
- `team_room_decisions`
- `team_room_attachment_refs`
- `team_room_ws_tickets`

Messages have a UUID primary key and a unique constraint on `(channel_id, sender_principal_id, client_message_id)`. The history index is `(channel_id, created_at DESC, message_id DESC)`. Message creation and `outbox_events` insertion occur in one PostgreSQL transaction. A trigger emits a PostgreSQL NOTIFY containing only the outbox event UUID. WebSocket subscribers fetch the durable outbox row and filter private events by channel membership and active permission.

### CI evidence: real PostgreSQL-backed API tests

GitHub Actions run `43222078880` on PR #7 HEAD `fcdbd9f913e016a5a50610e0d6c675f72e5c8974` includes the `ai-team-room-service` job. Its logs show:

- `communication::postgres_tests::postgres_general_private_acl_and_message_idempotency ... ok`
- 9 service unit/integration tests passed, 0 failed.
- The communication integration test creates actors in PostgreSQL, sends a private message A→B, reads it as B, rejects third-party C from the private history, tests WebSocket message delivery, and verifies a non-member does not receive private-channel events.
- The same test verifies duplicate general-room sends return the same canonical message and create one outbox event. It does not explicitly repeat the duplicate-send assertion for a private message.
- The same CI run has a Keycloak OIDC smoke job that starts an ephemeral Keycloak, obtains a real client-credentials JWT, validates JWKS/signature, exchanges the token, and proves session/authorization/admission against the CI PostgreSQL instance.

This is **PROVEN CI integration evidence**, not evidence of an externally deployed Team Room service or real Phone-01/Phone-02 identities.

### Documentation inconsistency

At the audited source SHA, `services/ai-team-room/README.md` contains contradictory historical statements: its later Communication Layer section describes the private routes and migration 0009, while an earlier limitations paragraph still says private-chat/message endpoints do not exist. The source router and `communication.rs` implementation are authoritative for this audit; the README should be reconciled in a separately authorized documentation change.

### Team Room matrix

| Capability | Exists | Tested | Not tested / blocked |
|---|---|---|---|
| Axum Team Room service | YES | Build and CI service tests | No external deployment |
| OIDC token exchange | YES | Ephemeral Keycloak CI smoke | No real Phone-01/02 issuer subjects |
| Private conversation creation | YES | PostgreSQL CI integration | No production room setup |
| Private send/read | YES | PostgreSQL CI integration | No phone clients |
| Private channel ACL | YES | Third-party denial tested | No real identities |
| PostgreSQL message persistence | YES | CI PostgreSQL integration | No production DB |
| Message idempotency | YES | General message duplicate test; shared persistence function | Private duplicate case not separately asserted |
| WebSocket ticket/event path | YES | CI communication test | No production WebSocket |
| Message history pagination | YES | Endpoint exists; adapter fixture pagination | No deterministic equal-timestamp boundary test |
| Push notifications / FCM | NO | — | Absent |
| External service URL / TLS deployment | NO | — | Blocked |
| Cross-phone autonomous runner | NO | — | Blocked |

## Round 3 — Cursor correctness

### Existing behavior

Private history SQL:

- filters with `created_at < before`;
- orders by `created_at DESC, message_id DESC`;
- takes `limit + 1`;
- reverses the selected rows for chronological display.

The index already includes both `created_at` and `message_id`, but the cursor only sends `before=timestamp`.

### Defect

The secondary ordering by UUID makes ordering deterministic, but it does **not** make the timestamp-only cursor lossless. If a page boundary cuts through messages sharing the same `created_at`, the next page's strict `created_at < before` predicate skips every remaining message with that timestamp.

P2.23's test with 205 messages all sharing one timestamp only proves that an empty next page is rejected. It does not test a partial tie group where older timestamps remain. In that case, the current adapter can continue and silently skip the rest of the tied group.

### Smallest safe correction (not implemented)

Keep the existing schema and message IDs. Change only the history cursor/API:

- accept `before_created_at` and `before_message_id`;
- query with lexicographic row comparison: `(created_at, message_id) < ($before_created_at, $before_message_id)`;
- retain `ORDER BY created_at DESC, message_id DESC`;
- for forward incremental sync, optionally add `after_created_at` and `after_message_id` with the inverse tuple comparison and ascending order;
- use the existing composite history index;
- return the full cursor pair in each page or a server-generated opaque cursor;
- test boundary ties with a mixed dataset: 100+ rows at the same timestamp plus older/newer rows, across multiple pages, and prove every message appears exactly once.

No SQL or code change was made to the main repository in P2.24.

## Round 4 — Minimum-cost deployment candidate

### Recommended trial stack

| Layer | Candidate | Why it fits | Free-tier limitation |
|---|---|---|---|
| Axum service | Render Free Web Service using existing Dockerfile | Supports Docker/Rust, public HTTPS, managed TLS | Sleeps after 15 minutes idle; 512 MB RAM; ephemeral filesystem; not for production |
| PostgreSQL | Neon Free | Native PostgreSQL; 1 GB/project and 100 CU-hours/month at current published tier | Compute scales to zero after inactivity; free-tier quotas; no production SLA |
| OIDC | Auth0 Free, RFC 9068 token profile | Managed issuer/JWKS; free tier includes 1,000 M2M authentications; no-card signup shown on Free plan | Must verify exact claims required by Team Room; rate/plan limits |
| Phone clients | HTTPS polling initially | No extra broker or Firebase required | No always-on push; latency depends on polling and Render cold start |

Why not Render Postgres: Free databases expire after 30 days, have no backups and are unsuitable as the durable source of record. Use Neon for the test database instead.

Why not Supabase Free: it offers 500 MB and pauses projects after a week of low activity. Neon currently offers 1 GB and a larger compute allowance for this use case.

Why not Cloudflare Workers/Durable Objects: a rewrite would be required to replace the existing Rust/Axum + PostgreSQL service; that creates a second backend and protocol implementation, contrary to the minimum-change goal.

Why not Oracle Always Free: the provider requires credit/debit card information for account verification, so it does not meet the no-card preference.

### Render configuration constraints

The existing Dockerfile is at `services/ai-team-room/Dockerfile`, builds the service from the repository root, and sets a default bind of `0.0.0.0:8081`.

For a Render Web Service:

- Dockerfile path: `services/ai-team-room/Dockerfile`;
- build context: repository root;
- configure `TEAM_ROOM_BIND=0.0.0.0:10000` if the Render service port is 10000;
- provide `DATABASE_URL`, `OIDC_ISSUER`, `OIDC_AUDIENCE`, `OIDC_JWKS_URL` through Render environment secrets;
- use the Render HTTPS URL; no custom domain is necessary;
- keep all state in PostgreSQL, never in the Render filesystem.

The current service runs migrations at startup. Therefore the first deployment must point only at a disposable, newly created test database. Do not point a trial service at any production or existing user database.

Render Free web services are publicly reachable; private messaging is enforced by bearer authentication, room membership, `private_chat` grants and channel-member ACLs. This is not private network ingress. Do not expose any admin/database endpoint.

### Cost conclusion

A controlled test can plausibly remain at **$0/month** within current free quotas and with no paid add-ons. It is not a reliable 24/7 production service. Avoid custom domains, over-quota usage, paid compute, paid database plans and payment-method upgrades. If a provider requires a card or proposes a paid upgrade, stop and ask for approval.

## Round 5 — Three separate identities

| Identity | Recommended representation | Credential location | What it proves |
|---|---|---|---|
| Phone-01 bridge | Dedicated server-side OAuth workload client; unique issuer+subject mapped to Phone-01 principal | Secret manager/runtime only; never in repository or Android APK | A registered bridge process obtained a token |
| Phone-02 device | Native app using Device Authorization or Authorization Code + PKCE; dedicated subject mapped to Phone-02 principal; device key enrollment required before production | Refresh/session token encrypted in app storage; private key non-exportable in Android Keystore | A registered app/device session, not model identity |
| Executor/model | Separate provider adapter identity, scoped to executor service and provider account | Server-side secret manager only | Which provider adapter was authorized to call the model |

The current ChatGPT/GPT-6 conversation is **not** the Phone-01 workload identity and cannot be assumed to be a persistent process or a caller of the Team Room API. A separately running Phone-01 bridge and an authorized invocation path from GPT-6 to that bridge are still required.

Auth0's native Device Flow is a candidate for one-time Phone-02 enrollment; it does not by itself cryptographically bind a bearer token to a specific physical device. A production device-binding step should generate a non-exportable signing key in Android Keystore, register its public key against the Phone-02 principal, and require a server-verified challenge signature for enrollment/session renewal or signed mission receipts. The current Team Room API does not implement this proof-of-possession binding.

### Impersonation, replay, rotation and wrong-recipient controls

Already implemented server-side:

- exact trusted issuer and subject mapping;
- RS256/JWKS validation;
- expiry/issuer/audience/scope checks;
- one-time `jti` consumption during exchange;
- local session expiry and revocation checks;
- explicit room membership and per-principal permissions;
- private channel membership ACL;
- idempotent message key.

Still required before live operation:

- separate Phone-01 and Phone-02 principals; no shared credential;
- verify the JWT audience is exactly the single configured Team Room API audience;
- use Auth0 RFC 9068 profile to obtain `jti`; the default Auth0 access-token profile does not include `jti`;
- bind envelope `origin` and `destination` to authenticated principal IDs, not just display station names;
- bind ACK `mission_id` to the exact persisted mission and message;
- enroll and revoke Phone-02's public key;
- rotate/revoke sessions and refresh tokens; never accept an old device key after re-enrollment;
- add signed receipts/nonces for high-assurance device-to-server proof.

## Round 6 — Operational state machine using existing schemas

Do not create replacement Mission or Agent Result schemas. Use the existing canonical objects and persist transport/execution state separately.

| State | Transition owner | Durable write / condition |
|---|---|---|
| `MISSION_CREATED` | Phone-01 mission builder | Canonical Mission v1 + stable idempotency key stored locally |
| `SENT` | Phone-01 bridge | Team Room returns canonical message ID; outbox row becomes SENT |
| `RECEIVED` | Phone-02 communication layer | Message committed to Room inbox transaction before exposure to executor |
| `ACK` | Phone-02 communication layer | ACK reply posted; contains exact message ID, mission ID/revision and idempotency key |
| `EXECUTING` | Executor scheduler | Executor claims mission with a durable local execution record and policy grant |
| `REPORT_READY` | Executor | Canonical Agent Result v1 persisted locally; report ID stable across retry |
| `REPORT_SENT` | Phone-02 bridge | Team Room confirms report message ID; outbox becomes SENT |
| `REPORT_ACK` | Phone-01 bridge | Phone-01 reads report, validates exact mission/revision/agent, persists receipt |

The current Team Room chat API stores messages; it does not enforce this entire mission state machine. ACK is a normal chat message. State transitions above belong in the bridge/Android local stores and must not be represented as if the server already enforces them.

### Retry and timeout policy

- Network timeout: keep outbox PENDING; retry with same `client_message_id` and same payload hash.
- HTTP 401: reacquire/refresh identity; do not create a new message ID until authenticated retry.
- HTTP 403: terminal BLOCKED pending grant review; no blind retry.
- HTTP 409: idempotency conflict; quarantine and require operator/review.
- 5xx/network unavailable: exponential backoff with jitter; bounded retry count then RETRY_REQUIRED/DLQ record.
- Duplicate mission: unique `mission_id + revision + idempotency_key`; do not execute twice.
- Duplicate report: stable report ID/idempotency key; return existing canonical message.
- Expired mission: persist as EXPIRED, never execute.
- Process restart: recover PENDING outbox and RECEIVED inbox from Room/SQLite; re-check expiry/grants before execution.
- Revoked identity/device key: stop polling and sending; preserve local evidence, mark AUTH_REVOKED.

## Round 7 — Android Phone-02 specification

No APK was built or installed. No physical device was identified.

Proposed implementation:

- Kotlin + AndroidX;
- Room/SQLite for `inbox_messages`, `outbox_messages`, `mission_state`, `sync_cursor`, `execution_history`, and device-key metadata;
- unique constraints for server message ID, mission/revision/idempotency key and report ID;
- Room transactions for inbox persistence + cursor advancement;
- WorkManager one-time work with exponential backoff for recoverable synchronization;
- foreground polling/foreground WebSocket while app is active; do not claim 24/7 polling;
- Android Keystore non-exportable key for device proof-of-possession;
- encrypted token/refresh-token storage; never embed a client secret in the APK;
- local notification only after durable mission commit;
- offline queue and retry on network recovery;
- app startup reconciliation of PENDING outbox, RECEIVED inbox and unfinished mission state.

Do not use FCM in the first transport test. FCM can be added later as a wake-up signal, never as the durable source of mission state or ACK.

`USER_ACTION_REQUIRED — fabricante/modelo do Phone-02 + versão Android`.

## Round 8 — Executor/model separation

The communication adapter must expose an interface such as:

```kotlin
interface MissionExecutor {
    suspend fun execute(
        mission: CanonicalMission,
        context: ExecutionContext,
        cancellation: CancellationSignal
    ): ExecutionResult
}
```

Provider-specific implementation sits behind a separate `ModelProvider` interface. The communication layer only transports canonical mission/result objects; it must never receive provider API keys or call a model directly.

Executor requirements:

- validate mission schema, identity, revision, expiry, approval and grants;
- enforce tool allowlist, repository scope, network allowlist and cost budget;
- persist execution start/checkpoints/results;
- support cancellation and timeout;
- return structured Agent Result v1 with evidence, tests and limitations;
- separate model/provider identity from Phone-02 device identity.

**`EXECUTOR BLOQUEADO`** — no provider/model adapter is selected or authorized, and no real model call can be made by the P2.23 bridge.

## Round 9 — First real test plan (not executed)

### Preconditions

1. Owner approves a disposable free deployment and creates Render, Neon and Auth0 accounts/tenant, if not already available.
2. Provision a disposable Neon database and configure Auth0 API with RFC 9068 profile, exact audience and `team_room:connect` scope.
3. Verify an issued access token satisfies the exact current Team Room claims before provisioning any principal.
4. Register separate Phone-01 and Phone-02 issuer+subject mappings and least-privilege room permissions.
5. Deploy only the existing Team Room source to a test Render service and point it only at the disposable database.
6. Build an authorized Phone-01 bridge invocation path and a Phone-02 Android app; identify the physical Phone-02 before APK build/install.
7. For the first transport test only, use a deterministic `TestExecutor` that produces a clearly labeled simulated result. A real model test is a separate acceptance gate.

### Test sequence

1. Phone-01 publishes one valid mission; record request ID, Team Room message ID and server timestamp.
2. Phone-02 polls, validates sender/destination/mission/revision/expiry and commits the message in Room.
3. Phone-02 posts ACK; Phone-01 reads and validates the exact ACK.
4. TestExecutor executes a harmless no-side-effect task and persists a simulated Agent Result v1.
5. Phone-02 sends report; Phone-01 reads and persists REPORT_ACK.
6. Repeat with same mission/message ID and verify one execution only.
7. Keep Phone-02 offline, publish mission, reconnect and verify exactly-once local acceptance.
8. Force-stop/restart Phone-02 and verify inbox/outbox/cursor recovery.
9. Simulate request timeout after server commit and retry with the same client_message_id.
10. Test invalid/revoked bearer, wrong principal, wrong destination, expired mission, repeated report and cursor-boundary tie group.
11. Only after the TestExecutor cycle passes, run a separately authorized real-model provider test.

Evidence required: redacted request/response IDs, database row counts/unique-key behavior, Android logs, app build fingerprint, provider call ID (for real model test), report hash and Phone-01 receipt. Never record bearer tokens, refresh tokens, client secrets or private key material.

**Not executed in P2.24:** deployment, external PostgreSQL, Auth0 tenant, Android build/install, hardware, real model call, or live end-to-end test.

## Round 10 — Final required matrix

| Item | State | Evidence / blocker |
|---|---|---|
| Team Room API | `PROVADO` | Source routes plus PostgreSQL CI private-message/ACL/WebSocket integration test; no live deployment |
| PostgreSQL | `PROVADO` | CI PostgreSQL integration test; no user-owned hosted database |
| HTTPS | `BLOQUEADO` | No external service URL/TLS deployment |
| Identidade Phone-01 | `BLOQUEADO` | No persistent bridge principal or GPT-6 invocation path |
| Identidade Phone-02 | `BLOQUEADO` | No registered subject/device key or Android enrollment |
| Cursor seguro | `CORREÇÃO NECESSÁRIA` | Timestamp-only `before` can skip partial equal-timestamp groups |
| Adaptador P2.23 | `PROVADO` | 12/12 reported local HTTP-fixture tests only; live service untested; adapter hardening gaps remain |
| Android | `PLANEJADO` | Kotlin/Room/WorkManager specification only |
| Executor | `BLOQUEADO` | No provider adapter/model credentials/runtime |
| Primeiro teste ponta a ponta | `BLOQUEADO` | No deployment, identities, Phone-01 bridge, Android app or executor |
| Custo | `GRATUITO` | Candidate stack fits current free tiers for a small trial; not 24/7/production |
| Ação necessária do usuário | `USER_ACTION_REQUIRED` | Approve disposable free provider accounts/deployment; identify Phone-02; approve a persistent Phone-01 invocation bridge; complete one-time Phone-02 enrollment |

## Minimal user actions — only indispensable

1. **Authorize a disposable free test environment**: Render + Neon + Auth0, or explicitly choose another existing provider account. No payment method or paid upgrade should be supplied for this test.
2. **Provide Phone-02 manufacturer/model and Android version** (no IMEI, serial, phone number or MAC).
3. **Authorize the Phone-01 bridge model**: a separate persistent process/connector that GPT-6 can invoke. The current ChatGPT session is not itself that process.
4. **Approve one-time Phone-02 enrollment** through a browser/device-code flow and a dedicated device identity.

Do not send secrets to chat. Credentials must be entered directly into the provider's secret manager/dashboard by the owner.

## Scope and safety confirmation

- Main repository `vidift-max/tokensaver-ai` was read-only.
- Main branch `v2-saas-alpha` was not modified.
- No PR, merge, deployment, database creation, migration, SQL write, workflow dispatch or rerun was performed by P2.24.
- No token, API key, password, private key or provider credential was created/read/published.
- No paid service or billing upgrade was selected.
- No APK was built or installed.
- Phone-03 was not started.

**Final P2.24 verdict:** the server-side private messaging foundation is implemented and PostgreSQL-CI-tested; the P2.23 adapter is locally fixture-tested. The safe cursor correction, adapter routing/ACK hardening, free test deployment, separate identities, GPT-6-to-Phone-01 invocation bridge, Android app and executor remain outstanding. A real Phone-01 ↔ Phone-02 communication claim is therefore not justified yet.
