# AI Team Room — arquitetura proposta (Missão 106)

Status: PROPOSED / REVIEW_REQUIRED. Escopo documental; nenhum runtime implementado.

## 1. Auditoria inicial

O repositório de colaboração contém a missão, um README de área e contratos multiagente em draft/review. Não foi encontrada implementação de sala, presença, chat, áudio, DM, fila de tarefas ou serviço persistente da Team Room.

O TokenSaver principal (vidift-max/tokensaver-ai, branch v2-saas-alpha) é desktop Tauri 2 + React/TypeScript + Rust + SQLite local por projeto. package.json contém React/Tauri/Vite, sem SDK de provider ou cliente realtime; src/api.ts expõe IPC local; src-tauri/src/lib.rs registra comandos Tauri locais; tauri.conf.json limita connect-src a self/IPC. README declara ausência de chamadas reais a providers.

O registry contracts/adapters/v1/provider-registry.json marca OpenAI, Anthropic e Kimi como not_configured, mock como not_implemented, e todos os agentes enabled=false/not_connected. A matriz 010 é proposta default-deny; Security Gate 050 está BLOCKED_FOR_PRODUCTION. Missões 095–098 são desenhos SaaS em REVIEW_REQUIRED; 099 não foi localizado no caminho individual consultado; 100 está BLOCKED.

O arquivo BLOGGER_INTELLIGENCE_MASTER_PLAN.md solicitado no briefing não foi localizado no branch. Foi lido MISSION_PLAN_002_100.md, o plano mestre de missões existente.

## 2. Arquitetura recomendada

PROPOSTO: serviço de colaboração separado do desktop TokenSaver, com API HTTPS e gateway realtime. Não acoplar presença/chat/áudio à SQLite local nem habilitar rede no desktop antes de auth, egress e security gates aprovados.

Componentes:
1. Web client / Team Room UI: Geral, Tarefas, Privados, Áudio, Decisões, Arquivos/Referências, Participantes e Auditoria.
2. API Gateway/BFF: autenticação, autorização, validação, rate limits e versionamento.
3. Identity & Policy: OIDC Authorization Code + PKCE para humanos; workload/service identity para agentes; grants por missão, sala, ação e prazo. Nome/modelo declarado nunca autentica agente.
4. Room Service: membros, capacidade, presença e permissões.
5. Messaging Service: mensagens públicas/privadas, threads, busca e referências.
6. Task Service: atribuição, dependências, estados, handoff e revisão.
7. Realtime Gateway: WebSocket autenticado para mensagens/eventos/presença; reconexão com cursor.
8. Audio Signaling + SFU: sinalização autorizada e mídia WebRTC via SFU a escolher. Áudio ao vivo separado de gravação/transcrição.
9. Persistence: PostgreSQL transacional como fonte de estado; outbox transacional; Redis somente para presença efêmera/pub-sub/cache; object storage privado para anexos.
10. GitHub Integration: publicar decisões/artefatos autorizados via GitHub App mínima; GitHub continua fonte oficial.
11. Audit/Observability: trilha append-only com room_id/mission_id/task_id/actor_id/request_id.

Cloud, região, SFU, IdP e provedor de banco permanecem PENDENTES; missões 095–099 não aprovam essas escolhas.

## 3. Modelo de dados mínimo

Todas as entidades persistentes são tenant-scoped; tenant_id deriva da sessão autenticada, nunca do body.

- tenants(id, ...)
- rooms(id, tenant_id, slug, status, capacity_limit, created_at)
- principals(id, tenant_id, kind, provider, external_subject, display_name, enabled)
- room_memberships(id, tenant_id, room_id, principal_id, principal_type, role, status, joined_at, last_seen_at, revoked_at)
- channels(id, tenant_id, room_id, kind, created_by, mission_id, task_id)
- channel_members(channel_id, principal_id, permission)
- messages(id, tenant_id, room_id, channel_id, sender_id, body, mission_id, task_id, topic, created_at, edited_at, deleted_at)
- tasks(id, tenant_id, room_id, mission_id, sender_id, assignee_id, priority, description, context_refs, dependencies, status, result_ref, evidence_ref, due_at, version, created_at, updated_at)
- task_events(id, tenant_id, task_id, actor_id, from_status, to_status, reason, event_id, created_at)
- decisions(id, tenant_id, room_id, mission_id, task_id, author_id, summary, rationale, github_ref, status, created_at)
- attachments(id, tenant_id, room_id, uploader_id, object_key, media_type, size_bytes, sha256, scan_status, created_at)
- presence(room_id, principal_id, status, current_mission_id, current_task_id, last_activity_at, connection_epoch, expires_at)
- audit_events(id, tenant_id, actor_id, action, resource_type, resource_id, outcome, request_id, metadata_redacted, created_at)
- outbox_events(id, tenant_id, aggregate_type, aggregate_id, event_type, payload, created_at, published_at)

Constraints: membership unique por tenant/room/principal; FKs tenant-aware; índices para room/time, mission, task, sender e status; mensagens privadas nunca consultadas sem membership no canal.

## 4. Limite obrigatório de 15 IAs

capacity_limit é fixado em 15 pelo servidor. Entrada ocorre em transação serializável ou lock de linha da sala:
1. autenticar principal e validar grant;
2. bloquear a linha da sala;
3. contar memberships IA ACTIVE;
4. se count >= 15, rejeitar ROOM_CAPACITY_REACHED;
5. inserir membership e incrementar versão;
6. commit e emitir evento pela outbox.

Índice único impede duplicação. Serialização evita que entradas simultâneas excedam 15. Saída/revogação libera slot na mesma transação. Substituição é saída/revogação + nova entrada auditadas. Teste concorrente é requisito antes de validação.

## 5. Identidade e permissões

Papéis de UX (ORCHESTRATOR, ARCHITECT, EDITORIAL, SECURITY, QA, RESEARCH, DEVELOPER, REVIEWER) não concedem grants automaticamente.

Permissões granulares: room.read, room.join, message.create, channel.create_private, channel.read, task.create, task.assign, task.transition, decision.propose, decision.approve, attachment.upload, audio.publish, audio.subscribe, participant.revoke, audit.read, github.publish.

Default deny. Toda requisição e assinatura realtime avalia tenant + room + membership + resource + action + grant + TTL + status. Agente usa workload identity autenticada; display_name e prompt não são identidade. Aprovação GPT-6 é ação externa autenticada, não texto gerado.

DM: canal PRIVATE com lista explícita de participantes. Leitura, busca, notificações, eventos e anexos verificam membership server-side. Revogação fecha conexões e invalida tokens/caches de autorização.

## 6. Mensagens e eventos

Envelope versionado: event_id idempotente, schema_version, event_type, tenant_id, room_id, channel_id, actor_id/type, mission_id?, task_id?, correlation_id?, occurred_at UTC do servidor, payload validado.

Eventos: message.created/edited/deleted, presence.changed, task.created/assigned/acknowledged/status_changed, decision.proposed/approved, participant.revoked, audio.speaking_changed, attachment.quarantined.

Persistir primeiro com outbox na mesma transação; publicar depois. Consumidores deduplicam event_id. Mensagens paginadas por cursor; reconexão busca eventos posteriores ao último cursor autorizado. Entrega at-least-once com idempotência, sem alegar exactly-once.

Contexto missão/tarefa/assunto é referência validada, não instrução confiável. Sanitizar Markdown, limitar bytes/links, rate limit por principal e sala, anti-spam e edição/deleção auditável.

## 7. Tarefas e estados

Estados: CREATED, ASSIGNED, ACKNOWLEDGED, IN_PROGRESS, BLOCKED, WAITING_REVIEW, DONE, REJECTED, CANCELLED.

Transições:
- CREATED → ASSIGNED | CANCELLED
- ASSIGNED → ACKNOWLEDGED | REJECTED | CANCELLED
- ACKNOWLEDGED → IN_PROGRESS | BLOCKED | REJECTED | CANCELLED
- IN_PROGRESS → BLOCKED | WAITING_REVIEW | CANCELLED
- BLOCKED → IN_PROGRESS | CANCELLED
- WAITING_REVIEW → DONE | IN_PROGRESS | REJECTED
- DONE, REJECTED, CANCELLED são terminais; reabrir exige nova tarefa vinculada.

Toda transição valida ator/grant, usa version/CAS, grava task_events e outbox. DONE exige resultado e evidência referenciáveis. Dependências devem ser acíclicas. Handoff troca assignee com evento e pacote mínimo de contexto + referências GitHub.

## 8. Presença e continuidade

Status: ONLINE, BUSY, WORKING, WAITING, BLOCKED, OFFLINE, DISCONNECTED. last_activity_at, missão e tarefa atual são observacionais. Presence é lease efêmero com TTL/epoch; heartbeat perdido marca DISCONNECTED, não apaga membership nem tarefa. Reconexão reautentica, valida grant e retoma pelo cursor. Handoff é explícito e auditado. Registro de presença não mantém agente vivo; sem worker real, não há trabalho em background.

## 9. Áudio

Áudio ao vivo via WebRTC/SFU. Sinalização valida membership e grants audio.publish/audio.subscribe; tokens de mídia curtos, room-scoped e revogáveis. UI exibe ÁUDIO ATIVO/MUDO e quem fala. Mute altera publicação; fechar áudio encerra publicação/assinatura e sessão de mídia.

Gravação não é implementada por padrão. Recording/transcription são subsistemas separados, desligados por padrão, exigem consentimento explícito dos participantes afetados, indicador visível, finalidade, retenção/deleção e ACL. Sem consentimento, nenhum áudio é gravado/transcrito. Auditoria registra somente metadados mínimos de sessão/consentimento.

## 10. Anexos, decisões e GitHub

Anexos: allowlist, limite de tamanho, hash, antivírus/quarentena, nomes gerados pelo servidor, storage privado e URLs assinadas curtas; bloquear executáveis, macros e HTML ativo. Nunca incluir credenciais.

Decisões: PROPOSED/APPROVED/REJECTED/SUPERSEDED. Aprovação exige grant autenticado. Aprovação na sala é intenção até registro no GitHub. Ação de publicação cria/atualiza ADR, Issue ou documento via GitHub App mínima, salva github_ref somente após confirmação. Falha de publicação não altera status.

## 11. Segurança e operação

- OIDC + PKCE para humanos; workload identity com credenciais curtas para agentes.
- RBAC + ABAC; tenant/room scoping em queries, busca, cache, jobs e object keys.
- TLS, secret manager, rotação/revogação, egress allowlist, SSRF protection.
- Rate limits por IP/principal/room; quotas de mensagens, tarefas, anexos e conexões.
- CSRF/origin validation, CORS allowlist, CSP, proteção XSS/Markdown.
- Audit append-only com redaction; nunca registrar tokens, chaves, conteúdo privado fora do escopo ou áudio.
- Backups criptografados, restore testado, retention/deletion, incident response.
- Testes negativos: IDOR, cross-tenant, DM leakage, replay, capacity race, stale grant, revoked token, malware em anexos e reconnect abuse.
- Break-glass time-bound, justificativa, dupla aprovação e auditoria.

## 12. UX

Navegação: Geral | Tarefas | Privados | Áudio | Decisões | Arquivos | Participantes | Auditoria. Header mostra n/15, conexão e missão ativa. Mensagem mostra identidade autenticada, timestamp do servidor, missão, tarefa e assunto. Filtros por IA, missão, tarefa, assunto e período. Privados identificam participantes e privacidade. Áudio mostra falantes, mute e leave. Status mostra última atividade.

## 13. Plano incremental

G0 aprovar arquitetura, cloud/região/IdP, política de dados, retenção e SFU; desbloquear contratos 003–010 e security gate.
G1 schemas versionados e fixtures para principal, room, membership, message, channel, task, event, presence, decision, attachment e consent.
G2 auth/grants, room/membership, transação limite 15, chat persistente, outbox e audit.
G3 ACL de privados, busca autorizada, máquina de estados, handoff e decisões.
G4 WebSocket, heartbeat, cursor replay, rate limits, reconexão e concorrência.
G5 SFU e sinalização; gravação fora do escopo inicial.
G6 tenant isolation, pentest, carga, restore, observability, CI e incident drills.
G7 integração desktop opcional após API/auth aprovadas; desktop segue offline-first.

## 14. Critérios de aceite

- 15 entradas concorrentes aceitas; 16ª rejeitada em todas as interleavings.
- chat geral persiste e pagina por cursor sem duplicação após reconnect.
- DM não vaza via API, busca, notificações, websocket, anexos ou logs.
- transições inválidas rejeitadas; eventos idempotentes; DONE exige evidência.
- audio publish/mute/leave e speaker indicator testados; sem gravação default.
- token revogado não reconecta; membership removida perde acesso imediatamente.
- audit correlaciona actor/action/resource/outcome sem secrets.
- publicação GitHub gera referência verificável.
- nenhuma alegação de agente background sem worker persistente comprovado.

## 15. Bloqueios e recomendação

BLOQUEADO para implementação runtime nesta missão: o texto da missão exige autorização explícita para código, mas não há autorização explícita para implementar o serviço. Contratos 003–010 e Security Gate 050 não aprovados; agentes/providers desativados; IdP/cloud/SFU não escolhidos; nenhum backend de colaboração ou banco provisionado.

GO somente para revisão/aprovação documental. NO-GO para afirmar ou lançar sala operacional, áudio, privados, agentes conectados ou SaaS.
