# Missão 024 — Dispatch de eventos GitHub

**Responsável:** Automation AI | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED

## Objetivo
Definir uso restrito de `repository_dispatch` e `workflow_dispatch` para integração de eventos, sem transformar eventos GitHub em comandos privilegiados.

## Escolha do mecanismo
- `repository_dispatch`: eventos de integração enviados por serviço externo autenticado para um repositório; útil para notificar evento normalizado.
- `workflow_dispatch`: execução manual/operacional de workflow com inputs tipados e validação explícita; adequado para replay controlado ou operação assistida.
- Webhook recebido pelo backend: opção preferida para ingress de eventos GitHub; validar HMAC, timestamp, delivery ID, allowlist de evento e repositório, conforme Missão 006.
- Não usar dispatch para payloads grandes; enviar apenas IDs e referência imutável para dados guardados no ledger.

## Envelope mínimo
`schema_version`, `event_id`, `event_type`, `repository_id`, `mission_id`, `revision`, `delivery_id`, `occurred_at`, `correlation_id`, `payload_ref`. Rejeitar campos inesperados e IDs inconsistentes.

## Controles
- Credencial de dispatch separada, curta e escopada ao repositório alvo.
- Allowlist de event_type e repository_id; deny by default.
- Validar schema, assinatura/origem e freshness antes de enfileirar.
- Idempotência por delivery_id + event_type + repository_id; eventos de workflow devem carregar chave de deduplicação.
- Nunca confiar em `client_payload` como autorização; revalidar missão/grant no backend.
- Evitar recursão: workflow acionado por dispatch não deve emitir o mesmo dispatch sem marcador de origem/hop limit.
- Limitar tamanho, taxa, concorrência e retries.
- Não incluir segredos, conteúdo privado ou instruções executáveis no payload.

## Fluxo
Webhook/ator autorizado -> validação HMAC/identidade -> normalização -> inbox idempotente -> decisão de política -> dispatch mínimo -> workflow valida novamente -> execução read-only/mock -> evidence -> status ledger.

## Critérios de aceite
Eventos não autorizados e repetidos rejeitados/deduplicados; payload schema inválido rejeitado; loops bloqueados; credencial não exposta; workflow revalida permissões e revision.

## Testes requeridos
Replay, assinatura inválida, repo incorreto, event_type não permitido, payload grande, dispatch recursivo, credencial expirada e timeout ambíguo.

## Limites
Nenhum dispatch foi enviado nem credencial configurada.

## Recomendação ao GPT-6
Usar webhook+inbox como fonte de ingresso e dispatch somente como transporte assíncrono de evento já validado.