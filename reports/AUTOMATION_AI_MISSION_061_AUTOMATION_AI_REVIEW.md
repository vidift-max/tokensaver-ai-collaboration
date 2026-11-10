# Missão 061 — Database migrations

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: engenharia de software, Tauri/Rust/SQLite e segurança de produto
- Função: revisão técnica read-only independente | Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo e contribuição própria
Revisar o escopo resumido da Fase F contra o código real do TokenSaver principal, branch `v2-saas-alpha`. Li os relatórios anteriores e produzi avaliação independente. Nenhum código foi alterado.

## Evidências e achados
`db.rs::migrate` possui blocos separados para current==1, 2 e 3 que repetem a migração de operations/project_memory para schema v4. O estado 0 cria o esquema atual; extensões templates/claude_config são aplicadas em bloco idempotente após os casos. Existem testes de fresh DB e migrações v1/v2/v3, mas não há teste visível de falha no meio/rollback, concorrência de abertura ou verificação abrangente de schema/indexes. A duplicação aumenta risco de drift, embora cada ramo use transação IMMEDIATE.
- Severidade: MEDIUM.
- HEAD consultado: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- Arquivos examinados: `src-tauri/src/db.rs`, `src-tauri/src/error.rs`, `src-tauri/src/lib.rs`, `src-tauri/src/advanced.rs`, `src-tauri/src/backup.rs`, `src-tauri/src/path_guard.rs`, `src-tauri/src/tests.rs`, `src/App.tsx`, `src/api.ts`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `.github/workflows/ci.yml` conforme escopo.

## Solução recomendada
Extrair helper de migração comum somente após preservar semântica de cada versão; testar upgrade de cada versão, rollback em falha, idempotência, foreign_keys e schema version. Evitar migração destrutiva ou alteração de dados legados sem fixture.

## Testes realmente executados
Não executado. A suíte CI #193 executou cargo test com sucesso, mas esta IA não rodou testes localmente. Testes adicionais recomendados: migração falha atomicamente, reopen, v0/v1/v2/v3/v4 e dados legados.

## Relação com trabalhos anteriores
Consultei `AI_COLLABORATION.md`, `CENTRAL.md`, `INSTRUCTIONS.md` e `MISSION_PLAN_002_100.md`. A revisão preserva correções e falsos positivos anteriores: importação individual e File Center têm proteções; o CI #193 passou nos dois jobs; isso não substitui testes específicos de segurança, integração ou release.

## Limitações e autoridade
`AUTOMATION_AI_MISSION.md` não contém enunciados formais 051–070; o plano mestre contém somente descrições resumidas. `CENTRAL.md`/ `INSTRUCTIONS.md` reservam mudanças no produto principal ao integrador/engenheiro responsável. Esta é revisão read-only, sem autorização para implementar. Não houve execução local, testes dinâmicos ou release.

## Recomendação ao GPT-6
Extrair helper de migração comum somente após preservar semântica de cada versão; testar upgrade de cada versão, rollback em falha, idempotência, foreign_keys e schema version. Evitar migração destrutiva ou alteração de dados legados sem fixture.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
