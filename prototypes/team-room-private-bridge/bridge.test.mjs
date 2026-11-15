import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { TeamRoomPrivateBridge, BridgeError } from './bridge.mjs';

const roomId = '11111111-1111-4111-8111-111111111111';
const selfId = '22222222-2222-4222-8222-222222222222';
const peerId = '33333333-3333-4333-8333-333333333333';

function canonicalMission() {
  return {
    schema_version: '1.0.0', mission_id: 'P223-MISSION-001', revision: 1,
    title: 'P2.23 private bridge test', created_at: '2026-11-15T00:00:00.000Z', created_by: 'gpt6-integrator',
    assignee: { agent_id: 'AI-PHONE-02', provider: 'openai', capability_profile: 'android-executor' },
    priority: 'high', repository: { full_name: 'vidift-max/tokensaver-ai-collaboration', ref: 'mission/ai-phone-02-p2-23', scope: 'collaboration_write', allowed_paths: [] },
    objective: 'Validate private channel delivery', acceptance_criteria: ['Persist before ACK'],
    permissions: { repository_read: true, collaboration_repo_write: false, main_repo_write: false, execute_code: false, network_allowlist: [], secrets_access: [], operations: ['read'] },
    execution: { timeout_seconds: 300, max_attempts: 2, max_parallel_runs: 1, retry_policy: 'safe_idempotent', deadline: '2026-11-16T00:00:00.000Z' },
    budget: { currency: 'USD', max_cost: 0 },
    approval: { required_before_execution: true, required_before_main_repo_write: true, approver: 'gpt6-integrator' },
    status: 'QUEUED', inputs: [{ kind: 'text', content: 'Transport fixture only', trust: 'untrusted_data' }],
    deliverables: [{ type: 'json', required: true, description: 'Bridge test result' }]
  };
}

function mission(idempotencyKey = 'mission:p223:1') {
  return {
    schema_version: '1.0.0', type: 'MISSION', mission_id: 'P223-MISSION-001', revision: 1,
    origin: 'AI-PHONE-01', destination: 'AI-PHONE-02', rounds: [{ id: 1, objective: 'Receive and persist' }],
    constraints: ['No secrets'], issued_at: '2026-11-15T00:00:00.000Z', expires_at: '2026-11-16T00:00:00.000Z',
    idempotency_key: idempotencyKey, mission: canonicalMission()
  };
}

function canonicalAgentResult(reportId = 'P223-REPORT-001') {
  return {
    schema_version: '1.0.0', mission_id: 'P223-MISSION-001', revision: 1, run_id: reportId,
    agent_id: 'test-executor', attempt: 1, status: 'DELIVERED', summary: 'Bridge report transport fixture',
    artifacts: [], evidence: [], tests: [], limitations: [], completed_at: '2026-11-15T00:00:00.000Z'
  };
}

function report(idempotencyKey = 'report:p223:1') {
  return {
    schema_version: '1.0.0', type: 'REPORT', report_id: 'P223-REPORT-001', mission_id: 'P223-MISSION-001',
    station_id: 'AI-PHONE-02', agent_id: 'test-executor', rounds: [], results: [], evidence: [], blockers: [],
    tests: [], changes: [], commits: [], final_state: 'DELIVERED', idempotency_key: idempotencyKey,
    agent_result: canonicalAgentResult('P223-REPORT-001')
  };
}

async function fixture(t) {
  const messages = [];
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    const url = new URL(req.url, 'http://127.0.0.1');
    const send = (status, value) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(value)); };
    if (req.headers.authorization !== 'Bearer test-session') return send(401, { error: 'unauthorized' });
    if (url.pathname === '/auth/me' && req.method === 'GET') return send(200, { room_id: roomId, principal_id: selfId, session_id: crypto.randomUUID(), execution_id: crypto.randomUUID() });
    const route = `/team-room/${roomId}/private/${peerId}/messages`;
    if (url.pathname !== route) return send(404, { error: 'not found' });
    if (req.method === 'POST') {
      const body = JSON.parse(raw);
      let row = messages.find(x => x.sender_principal_id === selfId && x.client_message_id === body.client_message_id);
      if (row && (row.body !== body.body || row.parent_message_id !== body.parent_message_id)) return send(409, { error: 'idempotency conflict' });
      if (!row) {
        row = { message_id: crypto.randomUUID(), sender_principal_id: selfId, body: body.body, parent_message_id: body.parent_message_id, client_message_id: body.client_message_id, created_at: new Date(Date.now() + messages.length * 1000).toISOString() };
        messages.push(row);
      }
      return send(201, row);
    }
    if (req.method === 'GET') {
      const limit = Math.min(100, Number(url.searchParams.get('limit') || 50));
      const before = url.searchParams.get('before');
      let rows = messages.filter(x => x.sender_principal_id === peerId || x.sender_principal_id === selfId);
      if (before) rows = rows.filter(x => Date.parse(x.created_at) < Date.parse(before));
      rows.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.message_id.localeCompare(b.message_id));
      const hasMore = rows.length > limit;
      const items = rows.slice(-limit);
      return send(200, { channel_id: crypto.randomUUID(), items, has_more: hasMore, unread_count: 0 });
    }
    return send(405, {});
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'team-room-bridge-'));
  const statePath = path.join(dir, 'state.json');
  const bridge = new TeamRoomPrivateBridge({ apiUrl: `http://127.0.0.1:${address.port}`, token: 'test-session', roomId, expectedPrincipalId: selfId, statePath });
  t.after(() => { server.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return { bridge, messages, statePath };
}

function peerMessage(body, index) {
  return {
    message_id: crypto.randomUUID(), sender_principal_id: peerId, body: JSON.stringify(body), parent_message_id: null,
    created_at: new Date(Date.UTC(2026, 10, 14, 0, 0, index)).toISOString()
  };
}

test('private send persists outbox before network and retries idempotently', async t => {
  const { bridge, messages, statePath } = await fixture(t);
  const first = await bridge.send(peerId, mission());
  const second = await bridge.send(peerId, mission());
  assert.equal(first.status, 'SENT');
  assert.equal(second.duplicate, true);
  assert.equal(messages.length, 1);
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.equal(state.outbox.length, 1);
  assert.equal(state.outbox[0].status, 'SENT');
  assert.equal(JSON.stringify(state).includes('test-session'), false);
});

test('same idempotency key with changed payload is rejected', async t => {
  const { bridge } = await fixture(t);
  await bridge.send(peerId, mission());
  await assert.rejects(() => bridge.send(peerId, { ...mission(), mission: { ...canonicalMission(), objective: 'changed' } }), e => e instanceof BridgeError && e.code === 'IDEMPOTENCY_CONFLICT');
});

test('poll persists inbox and returns pending messages until application ACK', async t => {
  const { bridge, messages, statePath } = await fixture(t);
  messages.push(peerMessage(mission('from-phone-02'), 1));
  const first = await bridge.poll(peerId);
  assert.equal(first.new_messages.length, 1);
  assert.equal(first.pending_messages.length, 1);
  const restarted = new TeamRoomPrivateBridge({ apiUrl: bridge.baseUrl, token: bridge.token, roomId: bridge.roomId, expectedPrincipalId: selfId, statePath });
  const afterRestart = await restarted.poll(peerId);
  assert.equal(afterRestart.new_messages.length, 0);
  assert.equal(afterRestart.pending_messages.length, 1);
  const again = await bridge.poll(peerId);
  assert.equal(again.new_messages.length, 0);
  assert.equal(again.pending_messages.length, 1);
  const messageId = first.new_messages[0].message_id;
  const ack = await bridge.acknowledge(peerId, messageId, 'P223-MISSION-001');
  assert.equal(ack.status, 'ACKED');
  const duplicateAck = await bridge.acknowledge(peerId, messageId, 'P223-MISSION-001');
  assert.equal(duplicateAck.duplicate, true);
  assert.equal(messages.filter(x => x.sender_principal_id === selfId).length, 1);
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.equal(state.inbox[messageId].status, 'ACKED');
});

test('poll paginates backward to find a stored cursor without losing new messages', async t => {
  const { bridge, messages, statePath } = await fixture(t);
  const cursorMessage = peerMessage(mission('cursor'), 0);
  messages.push(cursorMessage);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({ version: 1, outbox: [], inbox: {}, cursors: {}, seen: {} }));
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.cursors[peerId] = { message_id: cursorMessage.message_id, created_at: cursorMessage.created_at };
  state.seen[peerId] = [cursorMessage.message_id];
  fs.writeFileSync(statePath, JSON.stringify(state));
  for (let i = 1; i <= 205; i++) messages.push(peerMessage(mission(`bulk:${i}`), i));
  const result = await bridge.poll(peerId);
  assert.equal(result.new_messages.length, 205);
  assert.equal(result.pages_read, 3);
  assert.equal(result.pending_messages.length, 205);
});

test('invalid mission envelope is rejected before network I/O', async t => {
  const { bridge, messages } = await fixture(t);
  const bad = mission();
  bad.expires_at = '2026-11-13T00:00:00Z';
  await assert.rejects(() => bridge.send(peerId, bad), e => e instanceof BridgeError && e.code === 'INVALID_ENVELOPE');
  assert.equal(messages.length, 0);
});

test('ambiguous network failure leaves a durable outbox item and retry reuses its client ID', async t => {
  const { bridge, messages, statePath } = await fixture(t);
  const originalFetch = bridge.fetchImpl;
  let failPost = true;
  bridge.fetchImpl = async (url, options) => {
    if (options.method === 'POST' && failPost) {
      failPost = false;
      throw new TypeError('simulated connection reset after request start');
    }
    return originalFetch(url, options);
  };
  await assert.rejects(() => bridge.send(peerId, mission('ambiguous:1')), e => e instanceof BridgeError && e.code === 'NETWORK_FAILURE');
  const pending = JSON.parse(fs.readFileSync(statePath, 'utf8')).outbox[0];
  assert.equal(pending.status, 'PENDING');
  const clientMessageId = pending.client_message_id;
  const result = await bridge.send(peerId, mission('ambiguous:1'));
  assert.equal(result.client_message_id, clientMessageId);
  assert.equal(result.status, 'SENT');
  assert.equal(messages.length, 1);
});

test('first poll backfills the full bounded history instead of silently truncating at 100', async t => {
  const { bridge, messages } = await fixture(t);
  for (let i = 1; i <= 205; i++) messages.push(peerMessage(mission(`initial:${i}`), i));
  const result = await bridge.poll(peerId);
  assert.equal(result.new_messages.length, 205);
  assert.equal(result.pages_read, 3);
});

test('expired and invalid inbound missions are retained as blocked, never returned as executable', async t => {
  const { bridge, messages } = await fixture(t);
  const expiredMission = mission('expired:1');
  expiredMission.issued_at = '2019-01-01T00:00:00.000Z';
  expiredMission.expires_at = '2020-01-01T00:00:00.000Z';
  expiredMission.mission.created_at = expiredMission.issued_at;
  expiredMission.mission.execution.deadline = expiredMission.expires_at;
  messages.push(peerMessage(expiredMission, 1));
  messages.push(peerMessage({ schema_version: '0.1.0', type: 'MISSION', mission_id: 'bad' }, 2));
  const result = await bridge.poll(peerId);
  assert.equal(result.pending_messages.length, 0);
  assert.equal(result.blocked_messages.length, 2);
  assert.deepEqual(result.blocked_messages.map(x => x.status).sort(), ['BLOCKED_INVALID', 'EXPIRED']);
  await assert.rejects(() => bridge.acknowledge(peerId, result.blocked_messages[0].message_id, 'P223-MISSION-001'), e => e instanceof BridgeError && e.code === 'MESSAGE_NOT_EXECUTABLE');
});

test('invalid bearer is rejected before private history access', async t => {
  const { bridge } = await fixture(t);
  bridge.token = 'invalid-token';
  await assert.rejects(() => bridge.poll(peerId), e => e instanceof BridgeError && e.code === 'HTTP_ERROR' && e.status === 401);
});

test('report envelope uses the same transport and idempotency path', async t => {
  const { bridge, messages } = await fixture(t);
  const result = await bridge.send(peerId, report());
  assert.equal(result.status, 'SENT');
  assert.equal(messages.length, 1);
  assert.equal(JSON.parse(messages[0].body).type, 'REPORT');
});


test('same-timestamp backlog fails closed when timestamp-only cursor cannot continue', async t => {
  const { bridge, messages, statePath } = await fixture(t);
  for (let i = 0; i < 205; i++) messages.push({ ...peerMessage(mission(`same-time:${i}`), i), created_at: '2026-11-15T00:00:00.000Z' });
  await assert.rejects(() => bridge.poll(peerId), e => e instanceof BridgeError && e.code === 'CURSOR_AMBIGUOUS');
  assert.equal(fs.existsSync(statePath), false);
});

test('valid bearer for the wrong principal is rejected', async t => {
  const { bridge } = await fixture(t);
  bridge.expectedPrincipalId = '44444444-4444-4444-8444-444444444444';
  await assert.rejects(() => bridge.poll(peerId), e => e instanceof BridgeError && e.code === 'IDENTITY_MISMATCH');
});
