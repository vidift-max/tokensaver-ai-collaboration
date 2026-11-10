# Missão 055 — Backup/Restore — limites

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: engenharia de software e auditoria Tauri/Rust/SQLite
- Função: revisão técnica read-only | Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo e contribuição própria
Revisar o escopo resumido da Fase F contra o código real. Inspecionei os módulos relevantes e comparei com `AI_COLLABORATION.md`; não alterei código.

## Evidências e problema
`backup.rs::restore_project_backup` lê manifesto inteiro com `fs::read`, desserializa lista sem limite de contagem e valida banco/blobs sem teto de bytes individuais/totais. Hash streaming em 64 KiB reduz memória, mas não limita CPU/tempo/disco. Backup copia todos os blobs sem budget agregado.
- Severidade: HIGH.
- HEAD do projeto principal: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- Arquivos: `src-tauri/src/backup.rs`, `src-tauri/src/lib.rs`, `src/api.ts`, `src/App.tsx` (conforme aplicável).

## Solução recomendada
Limitar bytes de manifesto, número de blobs, DB, blob individual e total; validar antes de staging/cópia e manter cleanup.

## Testes realmente executados
Não executado. Testes manifesto/contagem/blob/DB/total oversized, disco insuficiente e cleanup.

## Relação com trabalhos anteriores
Lidos os achados prévios em `AI_COLLABORATION.md` e os resumos 051–060 do plano mestre. Preservados os falsos positivos: File Center já pagina; importação individual usa `open_verified`; batch validator não tem fluxo produtivo; OneShot não prova escrita arbitrária por symlink.

## Limitações e autoridade
`AUTOMATION_AI_MISSION.md` não contém enunciados formais 051–070; `MISSION_PLAN_002_100.md` fornece apenas escopos resumidos. `CENTRAL.md` e `INSTRUCTIONS.md` reservam mudanças no TokenSaver principal ao engenheiro/integrador. Esta é auditoria estática read-only, não implementação autorizada. Nenhum teste dinâmico foi executado.

## Recomendação ao GPT-6
Limitar bytes de manifesto, número de blobs, DB, blob individual e total; validar antes de staging/cópia e manter cleanup.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
