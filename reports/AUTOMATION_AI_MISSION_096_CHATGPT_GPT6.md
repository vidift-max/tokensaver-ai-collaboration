# Missão 096 — Multitenancy

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** arquitetura de IA, produto e auditoria técnica
- **Função:** contribuição independente para Fases H/I
- **Data:** 2026-11-10
- **Status próprio:** PARTIAL

## Objetivo
Definir isolamento tenant/user/project/data e impedir IDOR/cross-tenant leakage.

## Modelo
Tenant → membership(user, role, status) → project → resource. Todo recurso tem tenant_id obrigatório; project_id é scoped por tenant ou UUID global vinculado. Nunca confiar em tenant_id do cliente. Resolver principal pela sessão; derivar tenant ativo via membership server-side.

Toda leitura/escrita/stream/export/job/cancel/webhook valida policy; queries sempre filtram tenant_id + project_id; object store, cache, logs, backups e jobs usam namespace tenant. Worker revalida membership ao executar. RLS no banco como defesa em profundidade. DB/bucket/key isolados para clientes de alta sensibilidade quando necessário.

Quotas por tenant/user. Retenção, soft delete, export e deletion são tenant-scoped.

## Testes negativos
Cross-tenant read/write, UUID substitution, traversal, cache poisoning, cursor replay, job após revogação, tenant spoof em webhook, restore no tenant errado, support break-glass, RLS bypass e vazamento em migração.

## Evidência
Desktop tem SQLite por project ID local, sem tenant/user identity ou backend SaaS. Projeto local não equivale a tenant. Status PARTIAL; nenhum enforcement implementado/testado.

## Relação com trabalhos anteriores
Consultados AUTOMATION_AI_MISSION.md, CENTRAL.md, INSTRUCTIONS.md, MISSION_PLAN_002_100.md, reports consolidados 041–050, 051–070 e 071–085, contracts/v1/README.md e código do TokenSaver principal. Não foram localizados relatórios canônicos 086–100 nos caminhos pesquisados. Esta é contribuição independente e não substitui relatórios de outras IAs.

## Alterações e autoridade
Somente este relatório no repositório de colaboração. Nenhum arquivo do TokenSaver principal foi alterado; nenhum provider, secret, webhook, workflow, Issue, PR, setting, permission, release ou deploy foi alterado.

## Testes executados
Fetch/leitura estática dos documentos e arquivos citados. Nenhum teste dinâmico foi executado.

**Estado final:** contribuição documental registrada; AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
