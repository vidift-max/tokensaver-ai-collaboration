# Missão 052 — Project Memory: atomicidade do limite de entradas

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria SQLite e concorrência
- Data: 2026-11-10
- Status: PARTIAL — auditoria concluída; implementação bloqueada

## Objetivo
Eliminar a corrida que permite ultrapassar o limite de 1.000 entradas por projeto.

## O que esta IA fez
Inspecionou `src-tauri/src/project_memory.rs`, `db.rs`, `src/api.ts`, `src/App.tsx` e o achado PM-01 em `AI_COLLABORATION.md`.

## Evidência
- `MAX_PROJECT_MEMORY_ENTRIES = 1000`.
- `set_project_memory()` consulta existência da chave e conta entradas em queries separadas, antes do UPSERT.
- A checagem e a escrita não estão dentro de uma única transação `IMMEDIATE`.
- O índice/chave composta `(project_id,key)` protege unicidade da chave, não a cardinalidade máxima.
- Atualização de chave existente deve continuar permitida quando o limite estiver cheio.

## Problema e gravidade
ALTO — duas conexões podem observar 999 entradas e inserir chaves diferentes, ultrapassando o limite.

## Solução proposta
Abrir transação `TransactionBehavior::Immediate`; verificar existência e count dentro da transação; rejeitar somente nova chave quando count >= 1000; executar UPSERT e commit. Preservar atualização de chave existente. Considerar timeout/busy handling e erro estável.

## Testes necessários
999 entradas + duas conexões independentes tentando chaves diferentes: exatamente um sucesso e total 1000; update de chave existente com 1000; 1001ª chave rejeitada; duas atualizações concorrentes; isolamento entre project_id.

## Testes executados
Não executado. Nenhum teste de concorrência foi disparado.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Confirma PM-01 em `AI_COLLABORATION.md`; não foi localizada correção integrada no arquivo examinado.

## Dependências e limitações
Alteração em código principal bloqueada pela regra de aprovação do plano mestre. O gate 003–010 continua REVIEW_REQUIRED no registro central.

## RECOMENDAÇÃO AO GPT-6
Priorizar transação IMMEDIATE e teste concorrente com duas conexões; exigir evidência do total máximo sob corrida, não apenas teste sequencial.
