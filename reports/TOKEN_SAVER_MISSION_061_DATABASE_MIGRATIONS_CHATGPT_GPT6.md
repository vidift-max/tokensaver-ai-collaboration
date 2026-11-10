# Missão 061 — Database migrations: revisão e consolidação

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria SQLite, schema evolution e integridade
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — análise estática; mudanças bloqueadas

## Objetivo
Revisar a máquina de migrações, identificar blocos duplicados e riscos de evolução do schema.

## O que esta IA fez
Inspecionou `src-tauri/src/db.rs`, `tests.rs`, `backup.rs` e `database/README.md`.

## Evidência
- `SCHEMA_VERSION=4`; `open()` configura busy_timeout, WAL, foreign_keys e chama `migrate()`.
- Migrações de versões 1, 2 e 3 repetem blocos SQL para chegar ao schema v4, incluindo coluna `operations.project_id` e reconstrução de `project_memory` com chave primária composta.
- Cada branch usa transação `IMMEDIATE`, atualiza `user_version` e faz commit.
- Há teste de criação das tabelas e rejeição de schema futuro; cobertura observada não demonstra migração de cada versão legada em fixture dedicada.
- `AI_COLLABORATION.md` aponta constraints ausentes em tabelas auxiliares e necessidade de teste entre conexões.

## Problema e gravidade
MÉDIO — repetição aumenta risco de drift; cobertura de upgrade por versão é insuficiente para provar compatibilidade. A duplicação não foi demonstrada como bug funcional.

## Solução proposta
Refatorar para sequência explícita de migrações incrementais versionadas (v1→v2→v3→v4), cada uma transacional, sem executar DDL repetido para versões que não precisam. Antes de alterar, criar fixtures reais de cada schema legado. Avaliar FKs para project_memory/operations/templates/claude_config com estratégia de migração e política de dados órfãos.

## Testes necessários
Fixtures user_version 0..4; upgrade em DB populado; rollback em falha; repetição idempotente; integridade_check/foreign_key_check; preservar dados e timestamps; duas aberturas concorrentes; rejeitar versão futura.

## Testes executados
Não executado. Nenhuma migração foi aplicada a banco real ou fixture nesta sessão.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Complementa DB-01/02/03 em `AI_COLLABORATION.md`; não afirma corrupção nem ausência total de transação.

## Dependências e limitações
Mudanças de schema precisam de aprovação GPT-6 e política de compatibilidade/backup.

## RECOMENDAÇÃO AO GPT-6
Antes de consolidar o código, construir fixtures históricas de cada versão e provar upgrade sem perda. Tratar constraints como decisão separada de migração.
