# Missão 058 — Auditoria unificada de limites

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: engenharia de software e auditoria Tauri/Rust/SQLite
- Função: revisão técnica read-only | Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo e contribuição própria
Revisar o escopo resumido da Fase F contra o código real. Inspecionei os módulos relevantes e comparei com `AI_COLLABORATION.md`; não alterei código.

## Evidências e problema
`limits.rs`: MAX_FILE_BYTES 10 MiB, MAX_FILES_PER_BATCH 100, MAX_BATCH_BYTES 100 MiB, MAX_PATH_DEPTH 32, timeout 300 s, MAX_IMPORT_ROOTS 32. Aplicação inconsistente: Smart Context/Restore sem budget agregado; templates/articles sem paginação; Project Memory 1000 x 100 KB; `remove_root` difere de `add_root`; profundidade customizada em advanced.rs. File Center/importação individual já têm limites.
- Severidade: HIGH.
- HEAD do projeto principal: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- Arquivos: `src-tauri/src/limits.rs`, `src-tauri/src/lib.rs`, `src/api.ts`, `src/App.tsx` (conforme aplicável).

## Solução recomendada
Matriz comando→bytes/contagem/profundidade/tempo/saída; validar antes de alocar/ler; não alterar limites base sem análise.

## Testes realmente executados
Não executado. Boundary tests zero/max/max+1, Unicode, overflow e limites agregados por comando.

## Relação com trabalhos anteriores
Lidos os achados prévios em `AI_COLLABORATION.md` e os resumos 051–060 do plano mestre. Preservados os falsos positivos: File Center já pagina; importação individual usa `open_verified`; batch validator não tem fluxo produtivo; OneShot não prova escrita arbitrária por symlink.

## Limitações e autoridade
`AUTOMATION_AI_MISSION.md` não contém enunciados formais 051–070; `MISSION_PLAN_002_100.md` fornece apenas escopos resumidos. `CENTRAL.md` e `INSTRUCTIONS.md` reservam mudanças no TokenSaver principal ao engenheiro/integrador. Esta é auditoria estática read-only, não implementação autorizada. Nenhum teste dinâmico foi executado.

## Recomendação ao GPT-6
Matriz comando→bytes/contagem/profundidade/tempo/saída; validar antes de alocar/ler; não alterar limites base sem análise.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
