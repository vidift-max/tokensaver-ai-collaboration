import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 12_000;
const DEFAULT_MAX_PAGES = 20;

export class BridgeError extends Error {
  constructor(message, code = 'BRIDGE_ERROR', status = 0) {
    super(message);
    this.name = 'BridgeError';
    this.code = code;
    this.status = status;
  }
}

function requireString(value, name, max = 5000) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
    throw new BridgeError(`Invalid ${name}`, 'INVALID_ENVELOPE');
  }
}

function requireArray(value, name, max = 100) {
  if (!Array.isArray(value) || value.length > max) {
    throw new BridgeError(`Invalid ${name}`, 'INVALID_ENVELOPE');
  }
}

export function validateEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw new BridgeError('Envelope must be a JSON object', 'INVALID_ENVELOPE');
  }
  if (envelope.schema_version !== '1.0.0') {
    throw new BridgeError('Unsupported envelope schema_version', 'INVALID_ENVELOPE');
  }
  if (envelope.type === 'MISSION') {
    requireString(envelope.mission_id, 'mission_id', 100);
    if (!Number.isSafeInteger(envelope.revision) || envelope.revision < 1) throw new BridgeError('Invalid revision', 'INVALID_ENVELOPE');
    requireString(envelope.origin, 'origin', 120);
    requireString(envelope.destination, 'destination', 120);
    requireArray(envelope.rounds, 'rounds', 50);
    requireArray(envelope.constraints, 'constraints', 100);
    envelope.constraints.forEach((value, index) => requireString(value, `constraints[${index}]`, 2000));
    requireString(envelope.issued_at, 'issued_at', 64);
    requireString(envelope.expires_at, 'expires_at', 64);
    requireString(envelope.idempotency_key, 'idempotency_key', 200);
    const mission = envelope.mission;
    const requiredMissionFields = ['schema_version','mission_id','revision','title','created_at','created_by','assignee','priority','repository','objective','permissions','execution','budget','approval','status','inputs','deliverables'];
    if (!mission || typeof mission !== 'object' || Array.isArray(mission) || requiredMissionFields.some(key => !Object.hasOwn(mission, key))) {
      throw new BridgeError('Nested mission must satisfy the existing contracts/v1/mission.schema.json required fields', 'INVALID_ENVELOPE');
    }
    if (mission.schema_version !== '1.0.0' || mission.mission_id !== envelope.mission_id || mission.revision !== envelope.revision) {
      throw new BridgeError('Phone routing envelope does not match canonical Mission v1 identity', 'INVALID_ENVELOPE');
    }
    if (mission.created_at !== envelope.issued_at || mission.execution?.deadline !== envelope.expires_at) {
      throw new BridgeError('issued_at/expires_at must match canonical mission created_at/execution.deadline', 'INVALID_ENVELOPE');
    }
    requireString(mission.objective, 'mission.objective', 10_000);
    requireArray(mission.acceptance_criteria, 'mission.acceptance_criteria', 50);
    if (!Number.isFinite(Date.parse(envelope.issued_at)) || !Number.isFinite(Date.parse(envelope.expires_at)) || Date.parse(envelope.expires_at) <= Date.parse(envelope.issued_at)) {
      throw new BridgeError('Invalid mission validity window', 'INVALID_ENVELOPE');
    }
  } else if (envelope.type === 'REPORT') {
    requireString(envelope.report_id, 'report_id', 120);
    requireString(envelope.mission_id, 'mission_id', 100);
    requireString(envelope.station_id, 'station_id', 120);
    requireString(envelope.agent_id, 'agent_id', 120);
    requireArray(envelope.rounds, 'rounds', 50);
    for (const key of ['results', 'evidence', 'blockers', 'tests', 'changes', 'commits']) requireArray(envelope[key], key, 500);
    requireString(envelope.final_state, 'final_state', 100);
    requireString(envelope.idempotency_key, 'idempotency_key', 200);
    const result = envelope.agent_result;
    const requiredResultFields = ['schema_version','mission_id','revision','run_id','agent_id','attempt','status','summary','artifacts','evidence','tests','limitations','completed_at'];
    if (!result || typeof result !== 'object' || Array.isArray(result) || requiredResultFields.some(key => !Object.hasOwn(result, key))) {
      throw new BridgeError('Nested agent_result must satisfy the existing contracts/v1/agent-result.schema.json required fields', 'INVALID_ENVELOPE');
    }
    if (result.schema_version !== '1.0.0' || result.mission_id !== envelope.mission_id || result.run_id !== envelope.report_id || result.agent_id !== envelope.agent_id || result.status !== envelope.final_state) {
      throw new BridgeError('Report envelope does not match canonical Agent Result v1 identity/status', 'INVALID_ENVELOPE');
    }
  } else if (envelope.type === 'ACK') {
    requireString(envelope.message_id, 'message_id', 100);
    requireString(envelope.mission_id, 'mission_id', 100);
    requireString(envelope.idempotency_key, 'idempotency_key', 200);
    if (envelope.status !== 'RECEIVED') throw new BridgeError('ACK status must be RECEIVED', 'INVALID_ENVELOPE');
  } else {
    throw new BridgeError('Unsupported envelope type', 'INVALID_ENVELOPE');
  }
  return envelope;
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function emptyState() {
  return { version: 1, outbox: [], inbox: {}, cursors: {}, seen: {} };
}

function readState(file) {
  if (!fs.existsSync(file)) return emptyState();
  let value;
  try { value = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { throw new BridgeError('Local bridge state is corrupt; refusing to overwrite', 'STATE_CORRUPT'); }
  if (!value || value.version !== 1 || !Array.isArray(value.outbox) || !value.inbox || typeof value.inbox !== 'object' || !value.cursors || typeof value.cursors !== 'object' || !value.seen || typeof value.seen !== 'object') {
    throw new BridgeError('Unsupported local bridge state schema', 'STATE_INVALID');
  }
  return value;
}

function writeState(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  const fd = fs.openSync(temp, 'wx', 0o600);
  try {
    fs.writeFileSync(fd, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(temp, file);
}

function validateUuid(value, name) {
  if (typeof value !== 'string' || !UUID_RE.test(value)) throw new BridgeError(`${name} must be a UUID`, 'CONFIG_INVALID');
}

export class TeamRoomPrivateBridge {
  constructor({ apiUrl, token, roomId, expectedPrincipalId, statePath, fetchImpl = globalThis.fetch, maxPages = DEFAULT_MAX_PAGES }) {
    if (!apiUrl || !token || !roomId || !expectedPrincipalId || !statePath || typeof fetchImpl !== 'function') {
      throw new BridgeError('apiUrl, token, roomId, expectedPrincipalId, statePath and fetchImpl are required', 'CONFIG_REQUIRED');
    }
    let parsed;
    try { parsed = new URL(apiUrl); } catch { throw new BridgeError('apiUrl must be an absolute URL', 'CONFIG_INVALID'); }
    if (!['https:', 'http:'].includes(parsed.protocol) || (parsed.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname))) {
      throw new BridgeError('Team Room API must use HTTPS except loopback development', 'INSECURE_API_URL');
    }
    validateUuid(roomId, 'roomId');
    validateUuid(expectedPrincipalId, 'expectedPrincipalId');
    if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 100) throw new BridgeError('maxPages must be 1..100', 'CONFIG_INVALID');
    this.baseUrl = parsed.toString().replace(/\/+$/, '');
    this.token = token;
    this.roomId = roomId;
    this.expectedPrincipalId = expectedPrincipalId;
    this.statePath = path.resolve(statePath);
    this.fetchImpl = fetchImpl;
    this.maxPages = maxPages;
  }

  async request(method, route, body, query = '') {
    let response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${route}${query}`, {
        method,
        headers: {
          authorization: `Bearer ${this.token}`,
          accept: 'application/json',
          ...(body === undefined ? {} : { 'content-type': 'application/json' })
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(10_000)
      });
    } catch {
      throw new BridgeError('Team Room request failed; local outbox/inbox state was preserved', 'NETWORK_FAILURE');
    }
    const raw = await response.text();
    let payload = {};
    if (raw) {
      try { payload = JSON.parse(raw); }
      catch { throw new BridgeError('Team Room returned invalid JSON', 'INVALID_RESPONSE', response.status); }
    }
    if (!response.ok) throw new BridgeError(`Team Room rejected ${method} ${route} (HTTP ${response.status})`, 'HTTP_ERROR', response.status);
    return payload;
  }

  async authenticate() {
    const identity = await this.request('GET', '/auth/me');
    if (identity.room_id !== this.roomId || identity.principal_id !== this.expectedPrincipalId || !identity.session_id || !identity.execution_id) {
      throw new BridgeError('Authenticated identity does not match configured room/session schema', 'IDENTITY_MISMATCH', 403);
    }
    return identity;
  }

  loadState() { return readState(this.statePath); }
  saveState(state) { writeState(this.statePath, state); }

  async send(peerPrincipalId, envelope) {
    validateUuid(peerPrincipalId, 'peerPrincipalId');
    validateEnvelope(envelope);
    const identity = await this.authenticate();
    if (peerPrincipalId === identity.principal_id) throw new BridgeError('Private bridge peer must be a different principal', 'INVALID_PEER');
    const body = JSON.stringify(envelope);
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) throw new BridgeError('Envelope exceeds Team Room message body limit', 'MESSAGE_TOO_LARGE');
    const digest = hash(body);
    const state = this.loadState();
    let item = state.outbox.find(x => x.peer_principal_id === peerPrincipalId && x.idempotency_key === envelope.idempotency_key);
    if (item) {
      if (item.payload_sha256 !== digest) throw new BridgeError('Idempotency key was reused with different content', 'IDEMPOTENCY_CONFLICT', 409);
    } else {
      item = {
        peer_principal_id: peerPrincipalId,
        idempotency_key: envelope.idempotency_key,
        payload_sha256: digest,
        client_message_id: crypto.randomUUID(),
        body,
        status: 'PENDING',
        server_message_id: null,
        created_at: new Date().toISOString()
      };
      state.outbox.push(item);
      this.saveState(state);
    }
    if (item.status === 'SENT') return { duplicate: true, ...item };
    const result = await this.request('POST', `/team-room/${this.roomId}/private/${peerPrincipalId}/messages`, {
      client_message_id: item.client_message_id,
      body: item.body,
      parent_message_id: null
    });
    item.status = 'SENT';
    item.server_message_id = result.message_id || null;
    item.sent_at = new Date().toISOString();
    this.saveState(state);
    return { duplicate: false, ...item };
  }

  async poll(peerPrincipalId) {
    validateUuid(peerPrincipalId, 'peerPrincipalId');
    const identity = await this.authenticate();
    if (peerPrincipalId === identity.principal_id) throw new BridgeError('Private bridge peer must be a different principal', 'INVALID_PEER');
    const state = this.loadState();
    const cursor = state.cursors[peerPrincipalId] || null;
    const collected = [];
    let before = null;
    let cursorFound = false;
    let pageCount = 0;
    let hasMore = true;

    while (hasMore) {
      if (pageCount >= this.maxPages) throw new BridgeError('History pagination limit reached; cursor not advanced', 'PAGINATION_LIMIT');
      const query = new URLSearchParams({ limit: '100' });
      if (before) {
        query.set('before_created_at', before.created_at);
        query.set('before_message_id', before.message_id);
      }
      const page = await this.request('GET', `/team-room/${this.roomId}/private/${peerPrincipalId}/messages`, undefined, `?${query}`);
      if (!Array.isArray(page.items)) throw new BridgeError('Private history response is missing items', 'INVALID_RESPONSE');
      if (before && page.items.length === 0 && page.has_more) throw new BridgeError('Private history returned an empty page while claiming more rows', 'INVALID_RESPONSE');
      collected.unshift(...page.items);
      pageCount += 1;
      hasMore = Boolean(page.has_more);
      if (cursor && page.items.some(m => m.message_id === cursor.message_id)) cursorFound = true;
      if (!cursor && !hasMore) cursorFound = true;
      if (cursorFound || !hasMore || page.items.length === 0) break;
      before = { created_at: page.items[0].created_at, message_id: page.items[0].message_id };
    }
    if (!cursorFound) throw new BridgeError('Stored cursor was not found within bounded history scan; refusing to skip messages', 'CURSOR_NOT_FOUND');

    const seen = new Set(state.seen[peerPrincipalId] || []);
    const ordered = collected.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || String(a.message_id).localeCompare(String(b.message_id)));
    const fresh = [];
    for (const message of ordered) {
      if (message.sender_principal_id !== peerPrincipalId || seen.has(message.message_id)) continue;
      let envelope;
      let status = 'RECEIVED';
      let blocked_reason = null;
      try {
        envelope = JSON.parse(message.body);
        validateEnvelope(envelope);
        if (envelope.type === 'MISSION' && Date.parse(envelope.expires_at) <= Date.now()) {
          status = 'EXPIRED';
          blocked_reason = 'Mission expires_at is in the past';
        }
      } catch (error) {
        envelope = envelope || { type: 'UNPARSED', raw: message.body };
        status = 'BLOCKED_INVALID';
        blocked_reason = error instanceof Error ? error.message : 'Invalid envelope';
      }
      const entry = {
        message_id: message.message_id,
        peer_principal_id: peerPrincipalId,
        created_at: message.created_at,
        envelope,
        status,
        blocked_reason
      };
      state.inbox[message.message_id] = entry;
      fresh.push(entry);
      seen.add(message.message_id);
    }
    if (ordered.length) {
      const newest = ordered[ordered.length - 1];
      state.cursors[peerPrincipalId] = { message_id: newest.message_id, created_at: newest.created_at };
    }
    state.seen[peerPrincipalId] = [...seen].slice(-10_000);
    this.saveState(state);
    const pending = Object.values(state.inbox).filter(x => x.peer_principal_id === peerPrincipalId && x.status === 'RECEIVED');
    const blocked = Object.values(state.inbox).filter(x => x.peer_principal_id === peerPrincipalId && ['EXPIRED', 'BLOCKED_INVALID'].includes(x.status));
    return { new_messages: fresh, pending_messages: pending, blocked_messages: blocked, pages_read: pageCount };
  }

  async acknowledge(peerPrincipalId, messageId, missionId) {
    validateUuid(peerPrincipalId, 'peerPrincipalId');
    validateUuid(messageId, 'messageId');
    const state = this.loadState();
    const item = state.inbox[messageId];
    if (!item || item.peer_principal_id !== peerPrincipalId) throw new BridgeError('Message is not in this peer inbox', 'MESSAGE_NOT_FOUND');
    if (item.status === 'ACKED') return { duplicate: true, ...item };
    if (item.status !== 'RECEIVED') throw new BridgeError('Expired or invalid messages cannot be ACKed as received', 'MESSAGE_NOT_EXECUTABLE');
    const ackEnvelope = {
      schema_version: '1.0.0',
      type: 'ACK',
      mission_id: missionId,
      message_id: messageId,
      status: 'RECEIVED',
      idempotency_key: `ack:${messageId}`
    };
    const sent = await this.send(peerPrincipalId, ackEnvelope);
    const latestState = this.loadState();
    const latestItem = latestState.inbox[messageId];
    if (!latestItem || latestItem.peer_principal_id !== peerPrincipalId) throw new BridgeError('Inbox changed while acknowledging message', 'STATE_CONFLICT');
    latestItem.status = 'ACKED';
    latestItem.ack_message_id = sent.server_message_id;
    latestItem.acknowledged_at = new Date().toISOString();
    this.saveState(latestState);
    return { duplicate: false, ...latestItem };
  }
}
