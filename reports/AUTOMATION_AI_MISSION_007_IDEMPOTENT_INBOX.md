# Missão 007 — Inbox idempotente e deduplicação

**Autora:** ChatGPT / GPT-6 (OpenAI) — integração e automação  
**Data:** 2026-11-10  
**Status:** CONCLUÍDA — especificação pronta para revisão

## Modelo de dados mínimo

`webhook_inbox`:
- id (PK);
- provider;
- delivery_id;
- repository_id;
- event_type;
- action;
- payload_sha256;
- received_at;
- processing_status (RECEIVED, PROCESSING, PROCESSED, IGNORED, QUARANTINED, FAILED);
- attempts;
- next_attempt_at;
- processed_at;
- last_error_code.

Índice único: (provider, repository_id, delivery_id). Index secundário por status/next_attempt_at.

`outbox`:
- outbox_id;
- aggregate_type / aggregate_id;
- event_type;
- payload_json;
- created_at;
- published_at;
- publish_attempts;
- idempotency_key.

Índice único em idempotency_key.

## Algoritmo de ingestão

Transação única:
1. inserir evento na inbox;
2. se conflito na unique key e hash idêntico, retornar DUPLICATE_NOOP;
3. se conflito e hash diferente, marcar incidente/quarantine;
4. criar evento outbox associado apenas no primeiro insert;
5. commit;
6. só então responder 202.

Worker reivindica item por transação/claim atômico; não mantém transação aberta durante chamadas externas. Estado PROCESSING tem lease/claim associado e expiração.

## Camadas de idempotência

- delivery: mesmo webhook nunca cria novo efeito.
- domínio: unique mission_id + revision + run policy impede execução paralela acidental.
- efeito: chave por comentário, artifact ou mudança GitHub para publisher idempotente.

O sistema entrega eventos pelo menos uma vez; idempotência fornece efeito lógico único. Não prometer exactly-once distribuído entre banco, GitHub e provedor LLM.

## Reconciliação e recuperação

- RECEIVED parado é elegível para claim.
- PROCESSING com lease expirado volta a RECEIVED/RETRYABLE após validar se houve efeito parcial.
- Outbox pendente é republicada com a mesma idempotency_key.
- Publicação GitHub deve buscar marcador determinístico antes de criar comentário repetido.
- Eventos inválidos ficam IGNORED ou QUARANTINED, nunca descartados silenciosamente.
- Retenção proposta: payload bruto mínimo/criptografado por 7 dias; metadados e digest por 90 dias, sujeito à política de privacidade.

## Testes necessários

Concorrência N workers no mesmo delivery, replay depois de restart, conflito de hash, crash entre inbox e outbox, crash após publish antes de marcar publicado, entrega duplicada, ordenação de eventos e evento antigo de revisão supersedida.

## Limitações

Especificação; nenhuma tabela, fila, transação ou worker foi implementado. SQLite é aceitável para protótipo single-worker; operação multiworker deve usar banco com locking/claims transacionais testados.

### RECOMENDAÇÃO AO GPT-6

Aprovar semântica at-least-once + idempotência. Implementar inbox/outbox transacional antes do worker de IA e testar crash points com falhas injetadas.
