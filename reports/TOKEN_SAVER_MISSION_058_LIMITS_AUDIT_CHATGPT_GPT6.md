# Missão 058 — Limits audit: inventário central de limites

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: revisão transversal de limites, validação de entradas e budgets
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — inventário documental concluído

## Objetivo
Unificar e revisar limites de todos os módulos sem alterar valores arbitrariamente.

## O que esta IA fez
Comparou `src-tauri/src/limits.rs` com validações em `lib.rs`, `advanced.rs`, `smart_context.rs`, `project_memory.rs`, `path_guard.rs`, `backup.rs` e `file_center.rs`.

## Inventário observado
- `MAX_FILE_BYTES = 10 MiB`; `MAX_FILES_PER_BATCH = 100`; `MAX_BATCH_BYTES = 100 MiB`; `MAX_PATH_DEPTH = 32`; `LONG_OPERATION_TIMEOUT_SECONDS = 300`; `MAX_IMPORT_ROOTS = 32`.
- Outros limites estão hardcoded nos módulos: query Smart Context 512 bytes; `max_files` 1–20; Project Memory 1.000 entradas, key 128 bytes, value 100.000 bytes; template name 128, content 200.000; article query 512; texto editorial 2 MB; OneShot 2 MB.
- `advanced.rs::validate_logical_path` permite até 64 componentes, divergindo de `MAX_PATH_DEPTH=32` aplicado em `lib.rs`.
- `remove_root` não repete o limite de 4096 bytes de `add_root`.
- `LONG_OPERATION_TIMEOUT_SECONDS` é declarado, mas não há integração visível com deadline/cancelamento nos fluxos analisados.
- File Center já limita página a 100 e chunks; não classificar como ausência total de limites.

## Problema e gravidade
MÉDIO — limites fragmentados e divergentes tornam difícil provar um envelope global coerente.

## Solução proposta
Criar matriz única por comando: entrada, bytes, cardinalidade, saída, tempo, filesystem e concorrência. Reutilizar constantes nomeadas, documentar unidades e distinguir limite de request, limite de resultado e orçamento de processamento. Não alterar limites sem justificativa e testes.

## Testes necessários
Boundary tests para zero, limite, limite+1, Unicode/UTF-8, overflow, cardinalidade, payload e outputs; assegurar consistência entre API e backend.

## Testes executados
Não executado. Auditoria estática apenas.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Consolida TAI-02/03, EXT-01, ART-01, BK-01, IMP-02, PM-01 e limites já descritos em `AI_COLLABORATION.md`.

## Dependências e limitações
A matriz é inventário parcial do código consultado; não substitui instrumentação de runtime nem teste de todos os comandos.

## RECOMENDAÇÃO AO GPT-6
Aprovar matriz de limites como contrato técnico antes de consolidar constantes; preservar limites atuais até que os testes e impactos estejam claros.
