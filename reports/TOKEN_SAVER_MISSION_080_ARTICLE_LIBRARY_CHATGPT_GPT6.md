# Missão 080 — Article library

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: UX de biblioteca de conteúdo e recuperação de documentos
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — inspeção estática

## Objetivo
Auditar biblioteca de artigos e links internos.

## O que esta IA fez
Inspecionou Article Library/Internal Links em `src/App.tsx`, contratos `src/api.ts` e consultas/ranking em `src-tauri/src/advanced.rs`.

## Evidências
- Article Library chama `list_articles(projectId, query)` e lista path, versão, bytes e prefixo SHA.
- Não há paginação no contrato atual de list_articles; backend retorna todos os registros.
- UI não oferece preview/read, edição, status editorial, tags/categorias, ordenação ou filtros além do caminho.
- Internal Links recebe query e sugere por coincidência de termos no caminho lógico, com peso por termo; não analisa conteúdo do artigo nem destino/canonical.
- Ranking usa todos os artigos antes de limitar resultados; máximo é clamped no backend.
- Não há ação UI de inserir/copiar link ou registrar decisão editorial.

## Problemas e gravidade
ALTO — escalabilidade da biblioteca e ausência de paginação/preview. MÉDIO — relevância limitada de links, pois ranking se baseia em path, não no conteúdo semântico. MÉDIO — ausência de workflow/metadados editoriais.

## Recomendações
- Adicionar paginação, filtros por extensão/status/data e ordenação determinística.
- Preview em chunks com metadados de integridade e opção de abrir em modo somente leitura.
- Definir metadados editoriais opcionais (title, slug, category, status, updated_at) sem depender exclusivamente do filename.
- Melhorar links por conteúdo/extract de termos com explicação de score e excluir self-link/duplicatas; manter top-k e budget.
- Mostrar âncora sugerida, destino, motivo e contexto; usuário confirma antes de aplicar.
- Manter ranking lexical explicável antes de introduzir embeddings/modelos.

## Testes necessários
10k artigos sintéticos; paginação estável; query wildcard; self-link; ranking empatado; nomes duplicados; arquivo ausente/corrompido; projeto vazio; filtros combinados.

## Testes executados
Não executado.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/api.ts`, `src-tauri/src/advanced.rs`. Nenhum arquivo do produto alterado.

## Relação com trabalhos anteriores
Reitera ART-01 e Missões 053/069; a análise não confunde paginação do File Center com a biblioteca de artigos.

## RECOMENDAÇÃO AO GPT-6
Priorizar paginação/preview e metadados mínimos. Evoluir Internal Links com explicabilidade e avaliação offline de precisão antes de qualquer IA externa.
