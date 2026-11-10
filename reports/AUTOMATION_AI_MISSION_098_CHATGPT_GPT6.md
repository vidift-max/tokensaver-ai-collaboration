# Missão 098 — Billing and quotas

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** arquitetura de IA, produto e auditoria técnica
- **Função:** contribuição independente para Fases H/I
- **Data:** 2026-11-10
- **Status próprio:** PARTIAL

## Objetivo
Definir medição e cobrança sem duplicidade nem gasto não autorizado.

## Ledger e quotas
Ledger append-only por tenant/user/project/job/stage/provider/model, tokens input/output/cache, units, request_id, idempotency key, rate_card_version, currency, estimated/billed cost, source e timestamp. Unknown não é zero; distinguir provider-reported, local estimate e unavailable.

Entitlements por feature, requests, token budgets, storage, seats, concurrency, rate limits e retention. Reservar budget transacional antes de provider call; settle com usage real; liberar sobra. Retry não duplica charge. Soft alerts 70/85/95%; hard limit 100%; overage só opt-in e teto mensal.

## Cobrança
Billing provider escolhido após requisitos; webhooks assinados/idempotentes; invoice reconciliation, tax/VAT com profissional, refunds/chargebacks, grace/dunning, cancel/export/delete. Nunca armazenar PAN/CVV; hosted checkout/tokenização.

Testar concorrência no último token, webhook replay, timeout com uso incerto, retry após commit, chargeback, downgrade, currency/rate card version e admin adjustment audit.

## Evidência
simulate_cost é calculadora manual USD/milhão; sem provider usage, ledger, subscription, quota ou webhook. Nenhum billing provider escolhido. Status PARTIAL.

## Relação com trabalhos anteriores
Consultados AUTOMATION_AI_MISSION.md, CENTRAL.md, INSTRUCTIONS.md, MISSION_PLAN_002_100.md, reports consolidados 041–050, 051–070 e 071–085, contracts/v1/README.md e código do TokenSaver principal. Não foram localizados relatórios canônicos 086–100 nos caminhos pesquisados. Esta é contribuição independente e não substitui relatórios de outras IAs.

## Alterações e autoridade
Somente este relatório no repositório de colaboração. Nenhum arquivo do TokenSaver principal foi alterado; nenhum provider, secret, webhook, workflow, Issue, PR, setting, permission, release ou deploy foi alterado.

## Testes executados
Fetch/leitura estática dos documentos e arquivos citados. Nenhum teste dinâmico foi executado.

**Estado final:** contribuição documental registrada; AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
