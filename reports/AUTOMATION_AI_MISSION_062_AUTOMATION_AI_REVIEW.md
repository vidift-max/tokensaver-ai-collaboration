# Missão 062 — Error handling

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: engenharia de software, Tauri/Rust/SQLite e segurança de produto
- Função: revisão técnica read-only independente | Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo e contribuição própria
Revisar o escopo resumido da Fase F contra o código real do TokenSaver principal, branch `v2-saas-alpha`. Li os relatórios anteriores e produzi avaliação independente. Nenhum código foi alterado.

## Evidências e achados
`error.rs` define AppError serializável com code/message/details; `src/api.ts::normalizeAppError` mantém shape quando reconhecido e converte erros desconhecidos para INTERNAL_ERROR genérico. `App.tsx` centraliza um único estado `error` e `errorMessage`, mas a renderização de mensagens não é uniforme entre módulos; operações como Cost Simulator, Template Master e Editorial Engine não exibem mensagem local em todos os caminhos vistos. Relatório anterior identifica `advanced.rs::get_claude_config` convertendo qualquer erro de query em configuração vazia, ocultando erro SQLite real.
- Severidade: MEDIUM.
- HEAD consultado: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- Arquivos examinados: `src-tauri/src/db.rs`, `src-tauri/src/error.rs`, `src-tauri/src/lib.rs`, `src-tauri/src/advanced.rs`, `src-tauri/src/backup.rs`, `src-tauri/src/path_guard.rs`, `src-tauri/src/tests.rs`, `src/App.tsx`, `src/api.ts`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `.github/workflows/ci.yml` conforme escopo.

## Solução recomendada
Padronizar resultado de fronteira; em get_claude_config usar OptionalExtension para default somente em ausência de linha e propagar erro real. Criar componente de erro com aria-live, limpeza consistente e contexto por operação sem expor SQL/paths/secrets.

## Testes realmente executados
Não executado. Testes de QueryReturnedNoRows vs erro real, serialização AppError, erro desconhecido IPC, erros por módulo e ausência de dados sensíveis.

## Relação com trabalhos anteriores
Consultei `AI_COLLABORATION.md`, `CENTRAL.md`, `INSTRUCTIONS.md` e `MISSION_PLAN_002_100.md`. A revisão preserva correções e falsos positivos anteriores: importação individual e File Center têm proteções; o CI #193 passou nos dois jobs; isso não substitui testes específicos de segurança, integração ou release.

## Limitações e autoridade
`AUTOMATION_AI_MISSION.md` não contém enunciados formais 051–070; o plano mestre contém somente descrições resumidas. `CENTRAL.md`/ `INSTRUCTIONS.md` reservam mudanças no produto principal ao integrador/engenheiro responsável. Esta é revisão read-only, sem autorização para implementar. Não houve execução local, testes dinâmicos ou release.

## Recomendação ao GPT-6
Padronizar resultado de fronteira; em get_claude_config usar OptionalExtension para default somente em ausência de linha e propagar erro real. Criar componente de erro com aria-live, limpeza consistente e contexto por operação sem expor SQL/paths/secrets.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
