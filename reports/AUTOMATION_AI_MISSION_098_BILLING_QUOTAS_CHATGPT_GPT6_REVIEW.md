# Missão 098 — Revisão independente: Billing and Quotas

- IA: ChatGPT — GPT-6 | Data: 2026-11-10 | Status próprio: REVIEW_REQUIRED
- Produto principal read-only, HEAD `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.

## O que esta IA fez
Leu relatório 098, Cost Simulator 076, cost optimizer 092, provider comparison 093 e security gate 050. Confirma que o simulador atual não é billing nem metering; tiers e preços não podem ser definidos sem cost-to-serve e validação comercial.

## Complementos
- Separar Usage Reservation, Usage Event, Invoice Line e Payment Event; todos com IDs imutáveis e chave idempotente.
- Reservar quota com compare-and-swap/transação para evitar duas requests consumirem o mesmo saldo; settlement e correção via ledger entries compensatórias, nunca update destrutivo.
- Distinguir provider cost (COGS), customer billable usage, promo credit, tax, refunds e payment fees.
- Plan changes/proration precisam de effective timestamp; webhook fora de ordem usa event sequence/version e reconciliação com API PSP.
- Quotas: hard limits de safety/capacity separados de limites comerciais; grace period e overage precisam de consentimento explícito.
- Cost anomaly detection por tenant/model/stage, budget kill switch e fallback sem provider calls quando billing/ledger estiver indisponível.

## Testes/limites
Nenhum teste de concorrência, payment sandbox, webhook, invoice ou unit economics executado. Nenhuma integração alterada.

## Próximo passo
Aprovar schema do ledger e invariantes; implementar simulador de usage local/mock e property tests antes de escolher PSP.
