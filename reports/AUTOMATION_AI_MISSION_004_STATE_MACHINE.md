# Missão 004 — Máquina de estados e invariantes

**Autora:** ChatGPT / GPT-6 (OpenAI) — integração e automação  
**Data:** 2026-11-10  
**Status:** CONCLUÍDA — aguardando aprovação do GPT-6

## Modelo normativo

Estados:
- `DRAFT`: conteúdo em edição; não despachável.
- `QUEUED`: contrato válido e pronto.
- `ASSIGNED`: agente/capacidade reservados, ainda sem execução confirmada.
- `RUNNING`: tentativa ativa com lease válido.
- `RETRY_PENDING`: falha transitória elegível a nova tentativa.
- `REVIEW_REQUIRED`: resultado entregue; sem aprovação implícita.
- `APPROVED`: GPT-6 aprovou explicitamente resultado e revisão.
- `COMPLETED`: pós-condições e publicação final confirmadas.
- `BLOCKED`: depende de input, autorização, quota ou capacidade.
- `FAILED`: falha terminal ou tentativas esgotadas.
- `CANCELLED`: cancelada por autoridade autenticada.
- `EXPIRED`: deadline ultrapassado sem conclusão.

## Transições permitidas

| De | Para | Condição |
|---|---|---|
| DRAFT | QUEUED | schema válido, critérios, permissões e orçamento presentes |
| QUEUED | ASSIGNED | agente elegível e quota reservada |
| ASSIGNED | RUNNING | lease obtido e tentativa criada atomicamente |
| RUNNING | REVIEW_REQUIRED | resultado válido e artefatos persistidos |
| RUNNING | RETRY_PENDING | erro transitório e política permite retry |
| RETRY_PENDING | ASSIGNED | backoff vencido, orçamento/quota disponíveis |
| RUNNING | BLOCKED | autorização/input/capacidade necessária ausente |
| RUNNING | FAILED | falha permanente ou tentativas esgotadas |
| RUNNING | EXPIRED | deadline global excedido |
| qualquer não-terminal | CANCELLED | cancelamento autenticado; respeitar corrida com conclusão |
| REVIEW_REQUIRED | APPROVED | GPT-6 aprova mission_id + revision + digest do resultado |
| REVIEW_REQUIRED | BLOCKED | revisão pede complemento/decisão externa |
| APPROVED | COMPLETED | artefatos publicados e pós-condições verificadas |
| APPROVED | BLOCKED | pós-condição não pode ser concluída sem decisão |
| BLOCKED | QUEUED | bloqueio resolvido e revisão revalidada |
| REVIEW_REQUIRED | RETRY_PENDING | somente reabertura explícita e motivo auditado |

Não há transição automática de REVIEW_REQUIRED para APPROVED/COMPLETED. Rejeição do GPT-6 deve produzir BLOCKED ou FAILED com motivo; não apagar resultado original.

## Invariantes transacionais

1. No máximo um lease ativo por mission_id + revision, exceto paralelismo declarado com partições independentes.
2. RUNNING implica tentativa aberta e lease atual.
3. REVIEW_REQUIRED implica resultado persistido, schema validado e artefatos imutáveis.
4. APPROVED referencia digest e revisão exatos.
5. COMPLETED exige aprovação e pós-condições verificadas.
6. Revisão antiga nunca pode atualizar estado da revisão corrente.
7. Estado no GitHub é projeção; banco transacional decide transição.
8. Cada transição gera evento append-only com ator, origem, timestamp, motivo, revisão e correlation_id.
9. Estado terminal não reabre sem ação explícita de reabertura que crie evento e nova revisão/run.
10. Falha de publicação não deve reexecutar agente; deve repetir apenas o publisher idempotente.

## Concorrência e corrida

- Transição via compare-and-swap: UPDATE condicionado a estado atual, revision e version.
- Incrementar state_version em toda transição.
- Cancelamento e conclusão disputam a mesma linha; a primeira transação válida vence.
- Se a revisão muda durante RUNNING, marcar run antigo STALE/CANCELLED, revogar lease e não aceitar seu resultado para a revisão nova.
- Um comentário ou label GitHub não é autorização suficiente para transição privilegiada.

## Eventos auditáveis mínimos

MISSION_CREATED, MISSION_VALIDATED, MISSION_QUEUED, AGENT_ASSIGNED, RUN_STARTED, LEASE_RENEWED, RUN_DELIVERED, RESULT_VALIDATED, REVIEW_APPROVED, MISSION_COMPLETED, RUN_RETRY_SCHEDULED, MISSION_BLOCKED, MISSION_FAILED, MISSION_CANCELLED, MISSION_EXPIRED, REVISION_SUPERSEDED.

## Testes de aceitação necessários

- todas as transições permitidas e proibidas;
- duas transições concorrentes da mesma versão;
- cancelamento versus conclusão;
- revisão incrementada durante execução;
- estado RUNNING sem lease deve falhar integridade;
- REVIEW_REQUIRED sem resultado ou artefato obrigatório deve falhar;
- impossibilidade de aprovar sem identidade e digest válidos.

## Limitações

Documento define regras; não há máquina de estados implementada nem testes executados. A aprovação final de transições e política de reabertura pertence ao GPT-6.

### RECOMENDAÇÃO AO GPT-6

Aprovar tabela de transições e invariantes antes de implementar persistência. Em seguida, fazer 005 validar resultados e 006–009 especificarem o processamento confiável de eventos e execução.
