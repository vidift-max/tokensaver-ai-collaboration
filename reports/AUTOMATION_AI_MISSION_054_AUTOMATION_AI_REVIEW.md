# Missão 054 — OneShot Capture

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: engenharia de software e auditoria Tauri/Rust/SQLite
- Função: revisão técnica read-only | Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo e contribuição própria
Revisar o escopo resumido da Fase F contra o código real. Inspecionei os módulos relevantes e comparei com `AI_COLLABORATION.md`; não alterei código.

## Evidências e problema
`advanced.rs::oneshot_capture` duplica a lógica de `lib.rs::ensure_blob_with_status`; `exists/metadata/read` seguem symlink. Compara bytes, então não há prova estática de escrita arbitrária no alvo, mas pode aceitar referência symlink externa com conteúdo igual e sofre TOCTOU.
- Severidade: MEDIUM.
- HEAD do projeto principal: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- Arquivos: `src-tauri/src/advanced.rs`, `src-tauri/src/lib.rs`, `src/api.ts`, `src/App.tsx` (conforme aplicável).

## Solução recomendada
Reutilizar helper seguro, rejeitar symlink com symlink_metadata, validar hash/tamanho e fechar TOCTOU; não declarar exploração de escrita sem teste.

## Testes realmente executados
Não executado. Testar symlink igual/diferente, dangling, corrida de writers, falha antes do commit e ausência de alteração externa.

## Relação com trabalhos anteriores
Lidos os achados prévios em `AI_COLLABORATION.md` e os resumos 051–060 do plano mestre. Preservados os falsos positivos: File Center já pagina; importação individual usa `open_verified`; batch validator não tem fluxo produtivo; OneShot não prova escrita arbitrária por symlink.

## Limitações e autoridade
`AUTOMATION_AI_MISSION.md` não contém enunciados formais 051–070; `MISSION_PLAN_002_100.md` fornece apenas escopos resumidos. `CENTRAL.md` e `INSTRUCTIONS.md` reservam mudanças no TokenSaver principal ao engenheiro/integrador. Esta é auditoria estática read-only, não implementação autorizada. Nenhum teste dinâmico foi executado.

## Recomendação ao GPT-6
Reutilizar helper seguro, rejeitar symlink com symlink_metadata, validar hash/tamanho e fechar TOCTOU; não declarar exploração de escrita sem teste.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
