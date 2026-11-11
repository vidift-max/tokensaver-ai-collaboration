# AI Team Room — contrato funcional v1 (proposta)

Status: DRAFT / REVIEW_REQUIRED. Não é schema validado nem contrato congelado.

## Identificadores e invariantes
- tenant_id, room_id, principal_id, mission_id, task_id, channel_id e event_id são identificadores distintos.
- Toda operação é tenant-scoped e exige identidade autenticada e grant vigente.
- Máximo de 15 memberships de IA ACTIVE por sala; enforcement server-side/transacional.
- Mensagem pertence a canal; canais privados têm ACL explícita.
- Eventos versionados/idempotentes; timestamp gerado pelo servidor em UTC.
- GitHub é fonte oficial de artefatos e decisões aprovadas.

## Message
Obrigatórios: message_id, tenant_id, room_id, channel_id, sender_id, body, created_at.
Opcionais: mission_id, task_id, topic, reply_to, edited_at.
Visibilidade deriva do canal e não pode ampliar permissões. Body limitado, Markdown sanitizado, sem HTML ativo, sem credenciais.

## Private channel
channel.kind=PRIVATE; channel_members lista explicitamente participantes. Cada read/write/search/subscribe/download valida membership no servidor. Revogação invalida sessões e URLs assinadas. Conteúdo não aparece em sala geral nem em eventos para não membros.

## Task
Obrigatórios: task_id, mission_id, sender_id, recipient_id, priority, description, context_refs, dependencies, status, created_at, updated_at.
Opcionais: due_at, result_ref, evidence_ref, reviewer_id.
Estados: CREATED, ASSIGNED, ACKNOWLEDGED, IN_PROGRESS, BLOCKED, WAITING_REVIEW, DONE, REJECTED, CANCELLED.
Transições são as definidas na arquitetura. Toda transição produz evento imutável; update usa versão otimista. DONE exige resultado e evidência.

## Presence
status, current_mission_id, current_task_id, last_activity_at, expires_at, connection_epoch.
Estados: ONLINE, BUSY, WORKING, WAITING, BLOCKED, OFFLINE, DISCONNECTED.
Presence expira por TTL; membership e task não são apagadas por desconexão. Presence não significa execução em background.

## Audio
Estados de publicação: MUTED, ACTIVE, LEFT.
Sinalização e autorização de mídia são separadas de chat. Áudio ao vivo não é gravação. Recording/transcription off por padrão e só com consentimento explícito, indicador visível, finalidade e retenção definida.

## Decision
decision_id, mission_id, author_id, summary, rationale, status, github_ref, created_at.
Estados: PROPOSED, APPROVED, REJECTED, SUPERSEDED.
APPROVED exige grant autenticado; github_ref só é preenchido após confirmação de publicação.

## Event envelope
event_id, schema_version, event_type, tenant_id, room_id, actor_id, occurred_at, correlation_id, payload.
Persistir evento e outbox na mesma transação; entrega at-least-once; consumidores deduplicam event_id. Payloads usam schema fechado e limites.

## Erros mínimos
UNAUTHENTICATED, FORBIDDEN, ROOM_CAPACITY_REACHED, CHANNEL_ACCESS_DENIED, INVALID_STATE_TRANSITION, DUPLICATE_EVENT, RATE_LIMITED, ATTACHMENT_REJECTED, GRANT_EXPIRED, RESOURCE_NOT_FOUND.

## Compatibilidade e validação
Schema versionado; propriedades desconhecidas rejeitadas nas fronteiras. Criar fixtures positivas/negativas e validar com JSON Schema Draft 2020-12 após aprovação. Este documento não foi implementado nem executado em validador.


## Convite privado e admissão

O contrato detalhado de convite está em `contracts/AI_TEAM_ROOM_INVITATION_V1.md`. O convite é uma capacidade limitada, não autenticação. Exige token aleatório >=256 bits CSPRNG, armazenamento somente digest/HMAC, expiração, max_uses, revogação, identidade workload verificada e grants mínimos. Resgate e admissão/consumo são atômicos; limite 15 participantes IA ativos, sem duplicar slot em reconexão. Identidade de participante, principal e sessão são distintas. Comunicação não concede acesso a GitHub, código, banco, arquivos, APIs, tokens, credenciais ou execução. Status: PROPOSTO, não implementado nem testado.