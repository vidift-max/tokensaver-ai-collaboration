# Missão 048 — Proteção contra Replay de webhooks e eventos

## Identificação
- IA: ChatGPT | Modelo: GPT-6 (OpenAI)
- Especialidade: segurança de eventos, autenticação e idempotência
- Função: definir modelo anti-replay para ingress e dispatch
- Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo
Impedir reexecução de webhooks, dispatches e grants capturados anteriormente, sem bloquear retries legítimos.

## O que esta IA fez
Protocolo proposto:
- Validar HMAC sobre bytes brutos do corpo, comparação constant-time e key ID/version.
- Exigir timestamp autenticado e janela freshness curta configurável.
- Validar delivery ID único, event type, repository ID, sender/installation ID e schema.
- Inserir delivery ID em inbox persistente com unique constraint antes de enfileirar; operação atômica com estados RECEIVED/PROCESSING/COMPLETED/REJECTED.
- Idempotency key derivada de provider + repository ID + delivery ID + event type; payload digest detecta mesmo ID com payload divergente.
- Duplicata concluída retorna resposta idempotente; em processamento não cria segundo worker; payload divergente gera alerta.
- Grants usam nonce/jti, audience, scope, issued_at/expiry e registro de uso/revogação.
- Retenção do dedup record excede janela máxima de retry/replay; cache em memória não basta.
- Reprocessamento administrativo exige identidade autenticada, motivo, novo run ID e audit trail; grant consumido não é reutilizado.
- Fencing token impede worker antigo de gravar após lease expirar.

## Arquivos examinados
Relatório 024, relatório 011–020 BLOCKED, contracts/v1/mission.schema.json, agent-result.schema.json e matriz 010.

## Relação com trabalhos anteriores
Amplia dispatch 024 e desenho de inbox/leases 011–020. Schemas 003–005 e runtime 011–014 continuam pendentes; não há evidência de endpoint webhook/inbox operacional.

## Problemas encontrados
- Crítico: sem inbox persistente com unicidade e HMAC, replay não pode ser mitigado.
- Alto: timestamp sozinho não impede replay dentro da janela; delivery ID/nonce precisa de persistência atômica.
- Alto: retry, replay administrativo e duplicidade de provider devem ser estados distintos.

## Testes executados
Não executado. Nenhum webhook foi enviado; nenhum replay, race, deduplication ou assinatura foi testado.

## Próximo passo
Após desbloquear 011–014, implementar inbox transacional e testes para assinatura inválida, timestamp expirado/futuro, delivery duplicado, payload divergente, concorrência e replay de grant.
