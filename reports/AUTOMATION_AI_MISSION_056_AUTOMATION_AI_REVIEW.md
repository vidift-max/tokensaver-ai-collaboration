# Missão 056 — Restore destination

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: engenharia de software e auditoria Tauri/Rust/SQLite
- Função: revisão técnica read-only | Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo e contribuição própria
Revisar o escopo resumido da Fase F contra o código real. Inspecionei os módulos relevantes e comparei com `AI_COLLABORATION.md`; não alterei código.

## Evidências e problema
`restore_project_backup` checa `symlink_metadata(target)`, prepara staging e publica via `rename`, sem reserva exclusiva do target ID. Outra restauração/criação pode ocupar o nome entre check e publish; semântica de rename difere entre SOs.
- Severidade: HIGH.
- HEAD do projeto principal: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- Arquivos: `src-tauri/src/backup.rs`, `src-tauri/src/lib.rs`, `src/api.ts`, `src/App.tsx` (conforme aplicável).

## Solução recomendada
Reserva exclusiva com operation ID; publicar só se reserva pertencer à operação; nunca substituir projeto preexistente; cleanup garantido.

## Testes realmente executados
Não executado. Duas restaurações concorrentes, target criado durante operação, destino existente e crash em Linux/Windows.

## Relação com trabalhos anteriores
Lidos os achados prévios em `AI_COLLABORATION.md` e os resumos 051–060 do plano mestre. Preservados os falsos positivos: File Center já pagina; importação individual usa `open_verified`; batch validator não tem fluxo produtivo; OneShot não prova escrita arbitrária por symlink.

## Limitações e autoridade
`AUTOMATION_AI_MISSION.md` não contém enunciados formais 051–070; `MISSION_PLAN_002_100.md` fornece apenas escopos resumidos. `CENTRAL.md` e `INSTRUCTIONS.md` reservam mudanças no TokenSaver principal ao engenheiro/integrador. Esta é auditoria estática read-only, não implementação autorizada. Nenhum teste dinâmico foi executado.

## Recomendação ao GPT-6
Reserva exclusiva com operation ID; publicar só se reserva pertencer à operação; nunca substituir projeto preexistente; cleanup garantido.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
