# Missão 064 — Resource exhaustion

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: engenharia de software, Tauri/Rust/SQLite e segurança de produto
- Função: revisão técnica read-only independente | Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo e contribuição própria
Revisar o escopo resumido da Fase F contra o código real do TokenSaver principal, branch `v2-saas-alpha`. Li os relatórios anteriores e produzi avaliação independente. Nenhum código foi alterado.

## Evidências e achados
Riscos de exaustão confirmados em múltiplos caminhos: Smart Context lê todos os blobs sem orçamento; Restore carrega manifesto integral e processa quantidade/bytes ilimitados; Backup e Integrity Guardian percorrem todos os blobs sem budget global; templates/articles devolvem coleções completas; Project Memory pode chegar a 1000 entradas de 100 KB cada; Import Roots lê JSON inteiro antes do limite de contagem. File Center e importação individual têm limites/paginação já implementados.
- Severidade: HIGH.
- HEAD consultado: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- Arquivos examinados: `src-tauri/src/db.rs`, `src-tauri/src/error.rs`, `src-tauri/src/lib.rs`, `src-tauri/src/advanced.rs`, `src-tauri/src/backup.rs`, `src-tauri/src/path_guard.rs`, `src-tauri/src/tests.rs`, `src/App.tsx`, `src/api.ts`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `.github/workflows/ci.yml` conforme escopo.

## Solução recomendada
Definir orçamento por operação (bytes, itens, CPU/deadline, memória indireta, disco), validar antes de materializar e expor truncamento/cancelamento; preservar limites existentes e não usar `max_results` como limite de trabalho.

## Testes realmente executados
Não executado. Stress tests com blobs/artigos/templates/memória/manifestos grandes, disco cheio, cancellation e concorrência; medir RSS/CPU/latência.

## Relação com trabalhos anteriores
Consultei `AI_COLLABORATION.md`, `CENTRAL.md`, `INSTRUCTIONS.md` e `MISSION_PLAN_002_100.md`. A revisão preserva correções e falsos positivos anteriores: importação individual e File Center têm proteções; o CI #193 passou nos dois jobs; isso não substitui testes específicos de segurança, integração ou release.

## Limitações e autoridade
`AUTOMATION_AI_MISSION.md` não contém enunciados formais 051–070; o plano mestre contém somente descrições resumidas. `CENTRAL.md`/ `INSTRUCTIONS.md` reservam mudanças no produto principal ao integrador/engenheiro responsável. Esta é revisão read-only, sem autorização para implementar. Não houve execução local, testes dinâmicos ou release.

## Recomendação ao GPT-6
Definir orçamento por operação (bytes, itens, CPU/deadline, memória indireta, disco), validar antes de materializar e expor truncamento/cancelamento; preservar limites existentes e não usar `max_results` como limite de trabalho.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
