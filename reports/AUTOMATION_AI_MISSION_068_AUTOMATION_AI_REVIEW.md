# Missão 068 — Tauri security

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: engenharia de software, Tauri/Rust/SQLite e segurança de produto
- Função: revisão técnica read-only independente | Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo e contribuição própria
Revisar o escopo resumido da Fase F contra o código real do TokenSaver principal, branch `v2-saas-alpha`. Li os relatórios anteriores e produzi avaliação independente. Nenhum código foi alterado.

## Evidências e achados
`lib.rs::run` registra 29 comandos customizados no invoke_handler. `tauri.conf.json` define uma janela main e CSP restritiva; `capabilities/default.json` lista `core:default`. Não foram observados plugins shell/process nem comando de execução arbitrária no escopo. Os comandos customizados não apresentam ACL por operação no handler; o modelo atual confia na UI local. Portanto, o principal risco é ampliar superfície sem validação consistente e depender da integridade do frontend, não uma vulnerabilidade demonstrada por ausência de ACL isolada.
- Severidade: MEDIUM.
- HEAD consultado: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- Arquivos examinados: `src-tauri/src/db.rs`, `src-tauri/src/error.rs`, `src-tauri/src/lib.rs`, `src-tauri/src/advanced.rs`, `src-tauri/src/backup.rs`, `src-tauri/src/path_guard.rs`, `src-tauri/src/tests.rs`, `src/App.tsx`, `src/api.ts`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `.github/workflows/ci.yml` conforme escopo.

## Solução recomendada
Manter CSP, reduzir comandos expostos ao mínimo, validar todos os argumentos no backend, documentar o modelo de confiança e evitar conteúdo remoto/webviews adicionais. Revisar permissions Tauri geradas e plugins em build real.

## Testes realmente executados
Não executado. Revisão estática de invoke_handler/config/capabilities; nenhum teste IPC, XSS ou runtime security foi executado.

## Relação com trabalhos anteriores
Consultei `AI_COLLABORATION.md`, `CENTRAL.md`, `INSTRUCTIONS.md` e `MISSION_PLAN_002_100.md`. A revisão preserva correções e falsos positivos anteriores: importação individual e File Center têm proteções; o CI #193 passou nos dois jobs; isso não substitui testes específicos de segurança, integração ou release.

## Limitações e autoridade
`AUTOMATION_AI_MISSION.md` não contém enunciados formais 051–070; o plano mestre contém somente descrições resumidas. `CENTRAL.md`/ `INSTRUCTIONS.md` reservam mudanças no produto principal ao integrador/engenheiro responsável. Esta é revisão read-only, sem autorização para implementar. Não houve execução local, testes dinâmicos ou release.

## Recomendação ao GPT-6
Manter CSP, reduzir comandos expostos ao mínimo, validar todos os argumentos no backend, documentar o modelo de confiança e evitar conteúdo remoto/webviews adicionais. Revisar permissions Tauri geradas e plugins em build real.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
