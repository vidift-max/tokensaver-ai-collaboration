# Team Room Private Bridge — isolated prototype

This prototype is a client-side adapter for the existing authenticated Team Room private-message API. It does **not** implement a second backend, alter the TokenSaver repository, provision identity, or claim a deployed channel.

## API contract reused

- `GET /auth/me` — authenticate the local opaque session and confirm the configured room.
- `POST /team-room/{room_id}/private/{peer_principal_id}/messages` — publish a JSON mission/report envelope as a private message.
- `GET /team-room/{room_id}/private/{peer_principal_id}/messages?limit=100&before=...` — recover durable private history.

The server requires both principals to be active members of the same room and to hold `private_chat`. It persists messages in PostgreSQL and deduplicates sends by `(channel_id, sender_principal_id, client_message_id)`. The bridge stores the outgoing item locally before network I/O and reuses the same `client_message_id` after ambiguous failures. The history API has only a timestamp `before` cursor, not a compound `(created_at,message_id)` cursor. The prototype fails closed on an empty ambiguous page boundary, but a partial same-timestamp boundary can still be skipped by the server; a composite cursor/sequence is a production prerequisite for a strict no-loss guarantee.

The existing collaboration contracts remain canonical: `contracts/v1/mission.schema.json` and `contracts/v1/agent-result.schema.json`. The phone bridge adds only transport/routing metadata (`origin`, `destination`, `rounds`, `constraints`, `expires_at`, `idempotency_key`, and report station fields); it nests the canonical `mission` and `agent_result` objects and checks their required fields/identity mapping. It does not create replacement JSON Schema files. This prototype does not yet run a full Draft 2020-12 validator; production integration must validate the nested objects against the canonical schemas with a compliant validator.

## Run tests

Node.js 22, no third-party packages:

```sh
node --test prototypes/team-room-private-bridge/bridge.test.mjs
```

The 12 tests use a local in-process HTTP fixture. They validate the adapter's request construction, local outbox persistence, idempotent retry after an ambiguous network failure, idempotency conflict rejection, private-history pagination (including a 205-message backlog), inbox persistence across a new client instance, application-level ACK, invalid/expired mission blocking, invalid bearer rejection, report-envelope transport, wrong-principal rejection, and fail-closed handling of an ambiguous timestamp-only page boundary. They do not contact a live Team Room or PostgreSQL service.

## Use from an authorized Phone-01/Phone-02 runtime

Import `TeamRoomPrivateBridge` and construct it with:

- `apiUrl`: deployed Team Room HTTPS URL (HTTP only for loopback development);
- `token`: opaque session bearer injected from a secure runtime store; never save it in bridge state;
- `roomId`: room UUID;
- `expectedPrincipalId`: exact principal UUID expected from `/auth/me`;
- `statePath`: local persistent state file, protected with OS permissions.

Example:

```js
import { TeamRoomPrivateBridge } from './bridge.mjs';

const bridge = new TeamRoomPrivateBridge({
  apiUrl: process.env.TEAM_ROOM_API_URL,
  token: process.env.TEAM_ROOM_SESSION_TOKEN,
  roomId: process.env.TEAM_ROOM_ROOM_ID,
  expectedPrincipalId: process.env.TEAM_ROOM_PRINCIPAL_ID,
  statePath: process.env.TEAM_ROOM_BRIDGE_STATE
});

// Phone-01: await bridge.send(phone02PrincipalId, missionEnvelope);
// Phone-02: const { pending_messages } = await bridge.poll(phone01PrincipalId);
// After durable local persistence: await bridge.acknowledge(phone01PrincipalId, messageId, missionId);
// Phone-02: await bridge.send(phone01PrincipalId, reportEnvelope);
// Phone-01: const { pending_messages } = await bridge.poll(phone02PrincipalId);
```

`poll()` saves newly received messages before returning. Expired or invalid envelopes are retained as blocked and are not returned as executable. The executor must still validate mission identity, revision, expiry, schema and grants before execution. ACK is an application-level reply message; Team Room private chat does not expose the phone mailbox's dedicated ACK state machine.

## Envelope fields

`MISSION` includes `mission_id`, `revision`, `origin`, `destination`, `rounds`, `constraints`, `issued_at`, `expires_at`, and `idempotency_key`, plus the canonical nested `mission` object (which supplies `objective` and `acceptance_criteria`). The bridge requires `issued_at == mission.created_at` and `expires_at == mission.execution.deadline`.

`REPORT` includes `report_id`, `mission_id`, `station_id`, `agent_id`, `rounds`, `results`, `evidence`, `blockers`, `tests`, `changes`, `commits`, `final_state`, and `idempotency_key`, plus the canonical nested `agent_result` object. `report_id` maps to `agent_result.run_id`; `final_state` maps to `agent_result.status`.

`ACK` is a protocol reply with `message_id`, `mission_id`, `status=RECEIVED`, and `idempotency_key`.

## Hard limitations

- The bridge is a tested client prototype, not an always-on service or a ChatGPT connector.
- The current ChatGPT/GPT-6 session cannot be assumed to poll or post to a private Team Room endpoint in the background.
- Both phones need separately authenticated OIDC-backed principals, active room membership and explicit `private_chat` permission.
- The Team Room service needs a reachable HTTPS deployment and PostgreSQL. No such deployment/URL is configured or proven by this prototype.
- Phone-02 still needs its Android endpoint/app, durable local inbox/outbox and a real executor adapter.
- This uses the shared private chat channel, not the AI-PHONE-01 `phone_messages` mailbox. That mailbox's current send handler only lets an authenticated principal send to the phone mapped to that same principal; it is not a cross-phone send API.
- No model/provider call is made. The bridge transports data only.
