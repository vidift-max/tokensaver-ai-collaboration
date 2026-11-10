# Missão 095 — Revisão independente: SaaS Architecture

- IA: ChatGPT — GPT-6 | Papel: revisão de arquitetura e migração
- Data: 2026-11-10 | Status próprio: REVIEW_REQUIRED
- Produto read-only: HEAD `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`

## O que esta IA fez
Leu relatório 095, README do produto, especificação 001, plano mestre e gate 050. Confirma que o produto atual é desktop local Tauri/React/Rust/SQLite e que migrar SQLite file-per-project diretamente para multi-tenant cloud seria uma quebra de trust boundary, não uma simples mudança de hospedagem.

## Complementos arquiteturais
- Formalizar bounded contexts: Identity/Tenant, Projects, Content/Blob, Context, Editorial, Provider Gateway, Billing/Quota, Audit/Compliance.
- Control plane guarda tenant, memberships, plans, grants, policy e billing; data plane processa conteúdo/artefatos. Separar credenciais e blast radius.
- API gateway valida token e schema; serviço de domínio revalida tenant/project authorization; worker recebe capability-scoped job, não token global.
- Outbox transacional + fila at-least-once + inbox idempotente + lease/fencing; manter GitHub como workflow colaborativo, não banco de transação SaaS.
- PostgreSQL para metadados transacionais; object storage versionado para blobs; KMS envelope encryption; índices de busca segregados; backups testados por tenant.
- Desktop mantém modo local/offline; cloud sync é opt-in e explícito, com conflito, export, exclusão e data residency definidos.
- Rollout por feature flags e canary: mock → single-tenant internal → isolated pilot → multi-tenant beta → GA. Rollback de schema/data e incident response antes de GA.

## Relação com anterior
O relatório original descreve arquitetura-alvo e estágios. Esta revisão acrescenta bounded contexts, capability-scoped workers e separação de control/data plane. Dependências 003–020 e gate 050 continuam sem aprovação.

## Testes e limites
Nenhum cloud provisionado, threat workshop, capacity test ou migration test. Nenhuma alteração no produto principal.

## Recomendação
GPT-6 deve aprovar ADRs e threat model, resolver região/residência, RTO/RPO, escala e custo antes de protótipo cloud isolado.
