# Missão 052 — Project Memory

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: engenharia de software e auditoria Tauri/Rust/SQLite
- Função: revisão técnica read-only | Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo e contribuição própria
Revisar o escopo resumido da Fase F contra o código real. Inspecionei os módulos relevantes e comparei com `AI_COLLABORATION.md`; não alterei código.

## Evidências e problema
`project_memory.rs::set_project_memory` faz check de existência/contagem antes do UPSERT sem transação `IMMEDIATE` conjunta; duas conexões podem inserir além do teto 1000. Há valor máximo 100 KB, mas a listagem devolve até 1000 registros sem budget agregado.
- Severidade: HIGH.
- HEAD do projeto principal: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- Arquivos: `src-tauri/src/project_memory.rs`, `src-tauri/src/lib.rs`, `src/api.ts`, `src/App.tsx` (conforme aplicável).

## Solução recomendada
Transação IMMEDIATE para check+UPSERT; update de chave existente permitido quando total=1000; definir orçamento agregado de bytes.

## Testes realmente executados
Não executado. Testes concorrentes em 999, update em 1000, insert 1001 negado e isolamento por projeto.

## Relação com trabalhos anteriores
Lidos os achados prévios em `AI_COLLABORATION.md` e os resumos 051–060 do plano mestre. Preservados os falsos positivos: File Center já pagina; importação individual usa `open_verified`; batch validator não tem fluxo produtivo; OneShot não prova escrita arbitrária por symlink.

## Limitações e autoridade
`AUTOMATION_AI_MISSION.md` não contém enunciados formais 051–070; `MISSION_PLAN_002_100.md` fornece apenas escopos resumidos. `CENTRAL.md` e `INSTRUCTIONS.md` reservam mudanças no TokenSaver principal ao engenheiro/integrador. Esta é auditoria estática read-only, não implementação autorizada. Nenhum teste dinâmico foi executado.

## Recomendação ao GPT-6
Transação IMMEDIATE para check+UPSERT; update de chave existente permitido quando total=1000; definir orçamento agregado de bytes.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
