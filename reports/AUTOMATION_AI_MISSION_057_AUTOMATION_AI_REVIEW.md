# Missão 057 — Import Roots

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: engenharia de software e auditoria Tauri/Rust/SQLite
- Função: revisão técnica read-only | Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo e contribuição própria
Revisar o escopo resumido da Fase F contra o código real. Inspecionei os módulos relevantes e comparei com `AI_COLLABORATION.md`; não alterei código.

## Evidências e problema
`path_guard.rs::load_roots` lê todo JSON antes de impor MAX_IMPORT_ROOTS=32. `add_root` limita caminho em 4096 bytes; `remove_root` não repete esse limite. Read-modify-write sem lock, temp file fixo `import_roots.json.tmp`; no Windows remove antigo antes do rename.
- Severidade: MEDIUM.
- HEAD do projeto principal: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- Arquivos: `src-tauri/src/path_guard.rs`, `src-tauri/src/lib.rs`, `src/api.ts`, `src/App.tsx` (conforme aplicável).

## Solução recomendada
Limite de bytes antes de parse, limites por entrada, lock comum e temp exclusivo; replace atômico sem remover configuração anterior prematuramente.

## Testes realmente executados
Não executado. Corridas add/remove, 32/33 roots, JSON grande, path longo, falha de disco e preservação do arquivo.

## Relação com trabalhos anteriores
Lidos os achados prévios em `AI_COLLABORATION.md` e os resumos 051–060 do plano mestre. Preservados os falsos positivos: File Center já pagina; importação individual usa `open_verified`; batch validator não tem fluxo produtivo; OneShot não prova escrita arbitrária por symlink.

## Limitações e autoridade
`AUTOMATION_AI_MISSION.md` não contém enunciados formais 051–070; `MISSION_PLAN_002_100.md` fornece apenas escopos resumidos. `CENTRAL.md` e `INSTRUCTIONS.md` reservam mudanças no TokenSaver principal ao engenheiro/integrador. Esta é auditoria estática read-only, não implementação autorizada. Nenhum teste dinâmico foi executado.

## Recomendação ao GPT-6
Limite de bytes antes de parse, limites por entrada, lock comum e temp exclusivo; replace atômico sem remover configuração anterior prematuramente.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
