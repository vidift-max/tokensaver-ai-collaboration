# Missão 060 — Batch validation: integração no fluxo produtivo

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria de validação de lote e fluxo de importação
- Data: 2026-11-10
- Status: PARTIAL — validação isolada encontrada; integração não demonstrada

## Objetivo
Determinar se a validação batch está ligada a um fluxo de produção e especificar integração segura.

## O que esta IA fez
Inspecionou `src-tauri/src/commands.rs`, `limits.rs`, `lib.rs`, `src/api.ts`, workflow e testes consultados.

## Evidência
- `commands::validate_batch(file_count,total_bytes)` rejeita acima de 100 arquivos e 100 MiB.
- A função está em módulo `commands`, mas não aparece no `generate_handler!` do Tauri.
- O fluxo exposto `import_text_file` importa um arquivo por chamada e lê até `MAX_FILE_BYTES+1` antes de validar tamanho/UTF-8.
- Não foi localizado fluxo de importação batch no API/frontend nem chamada produtiva para `validate_batch`.
- A existência da função isolada não prova que importação em lote esteja implementada; também não prova que importação individual careça de limites.

## Problema e gravidade
MÉDIO — helper de validação não participa de fluxo produtivo observável. O risco é regressão futura se uma batch import for criada sem integrá-lo.

## Solução proposta
Não criar batch import sem requisito explícito. Se aprovada, validar quantidade/bytes agregados antes de ler/gravar; validar cada arquivo com limites individuais, paths, extensão e UTF-8; executar writes com estratégia transacional/compensatória; limitar concorrência e produzir resultado por item.

## Testes necessários
0/1/100/101 arquivos; 0/10MiB/10MiB+1 individual; 100MiB/100MiB+1 agregado; duplicatas, falha parcial, path traversal, arquivo mutado entre stat/read e rollback.

## Testes executados
Não executado.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Confirma o falso positivo explicitado em `AI_COLLABORATION.md`: validate_batch existe e tem limite, mas não é fluxo de importação ativo.

## Dependências e limitações
Missão não autoriza criar produto batch. Qualquer nova interface exige escopo e autorização do GPT-6.

## RECOMENDAÇÃO AO GPT-6
Manter o helper como validação preparatória; decidir explicitamente se batch import faz parte do produto antes de expor o comando.
