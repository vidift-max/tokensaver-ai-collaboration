# Missão 075 — Smart Context UX

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: UX de seleção de contexto e transparência de processamento
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — gap de transparência identificado

## Objetivo
Explicar ao usuário o que foi incluído e excluído do contexto.

## O que esta IA fez
Inspecionou Smart Context UI em `src/App.tsx`, contrato `ContextHit` em `src/api.ts` e algoritmo `src-tauri/src/smart_context.rs`.

## Evidências
- UI solicita `maxFiles=8`; backend clampa 1–20, percorre arquivos e devolve somente hits ranqueados.
- Resultado exibe caminho, score, versão, byte_len? A UI mostra score, versão e token_estimate; não mostra bytes, total de arquivos examinados, limite, exclusões ou truncation.
- Backend não retorna diagnóstico de elegibilidade, motivo de exclusão, budget consumido ou indicador de truncamento.
- Busca é local e determinística; a descrição UI diz que conteúdo não é enviado para APIs externas.
- Nenhum controle para incluir/excluir arquivo manualmente ou inspecionar contexto final completo foi localizado.

## Problemas e gravidade
ALTO — não há explicabilidade de cobertura: usuário não sabe o universo examinado, o que ficou de fora nem por que. MÉDIO — score não tem legenda; token estimate é aproximado e pode ser interpretado como contagem real. MÉDIO — sem seleção manual e sem orçamento visível.

## Recomendações
- Retornar ContextBuildReport: files_scanned, eligible, included, excluded_by_reason, bytes_read, estimated_tokens, budget, truncated, ranking_method/version.
- Exibir painel “Incluído / Excluído / Não analisado” com motivo concreto e filtros.
- Permitir pin/ignore de arquivos, preservando limites backend e ordem determinística.
- Explicar score e estimativa aproximada; separar bytes lidos de tokens estimados.
- Mostrar prévia do pacote final e botão copiar/exportar somente após consentimento.
- Definir orçamento de bytes/tempo antes de UX avançada; a UI não pode fingir limites que o backend não impõe.

## Testes necessários
Dataset com hits e misses, arquivos acima do budget, truncation, arquivo ilegível/corrompido, query vazia, empate de ranking, 0/1/8/20 resultados e consistência do resumo com o payload final.

## Testes executados
Não executado.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/api.ts`, `src-tauri/src/smart_context.rs`. Nenhum arquivo do produto alterado.

## Relação com trabalhos anteriores
Complementa Missões 051 e 069: 051 trata budgets backend; 075 trata transparência e controle do usuário. Não considerar a exibição UX substituta para limites server-side.

## RECOMENDAÇÃO AO GPT-6
Primeiro implementar budget global e contrato de diagnóstico no backend (051); depois construir painel de inclusão/exclusão e preview baseado nesses dados.
