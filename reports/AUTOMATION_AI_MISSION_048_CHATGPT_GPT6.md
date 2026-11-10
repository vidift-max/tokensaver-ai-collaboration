# Missão 048 — Replay | ChatGPT (GPT-6)

**Data:** 2026-11-10 | **Especialidade:** segurança de eventos e idempotência | **Status:** BLOCKED — runtime de ingress/inbox não implementado

## Objetivo
Definir e verificar proteção contra replay de webhooks e eventos.

## O que esta IA fez
Revisou Missão 006 (webhook seguro), Missão 007 (inbox idempotente), Missão 008 (lease/fencing), Missão 009 (retry/timeout) e gates 011–020. Não encontrou endpoint webhook/worker operacional confirmado no repositório principal.

## Controles requeridos antes de ativação
- HTTPS; validar HMAC-SHA256 sobre raw body com comparação constante.
- Allowlist de evento/action, repository_id, installation_id e sender_id.
- Delivery ID único persistido por repo; digest do body; mesmo ID + mesmo digest = duplicata; mesmo ID + digest diferente = quarantine.
- Persistência transacional na inbox antes de responder 2xx.
- Worker com idempotency key, lease/fencing e tentativa versionada.
- Timestamp/nonce como defesa complementar; delivery ID persistido é controle primário.
- Retenção de dedupe compatível com janela de replay e trilha de auditoria.

## Evidências
reports/AUTOMATION_AI_MISSION_006_WEBHOOK_SECURITY.md define HMAC/raw body/delivery ID/inbox; reports/AUTOMATION_AI_MISSION_007_IDEMPOTENT_INBOX.md e 008/009 detalham idempotência e fencing; reports 011–020 mantêm runtime bloqueado.

## Testes
Não executados. Sem endpoint/harness. Necessários HMAC inválido, byte alterado, delivery repetido, mesmo ID/digest divergente, replay tardio, corrida concorrente, falha de DB antes de ACK, assinatura antiga/rotacionada e resposta tardia após fencing.

## Limitações
Não se declara vulnerabilidade replay ativa em ingress inexistente. Nenhum webhook, secret, worker ou inbox foi criado.

## Recomendação
Manter webhook desativado até implementação transacional e aprovação formal. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
