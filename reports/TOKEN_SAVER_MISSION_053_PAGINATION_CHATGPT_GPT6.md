# Missão 053 — Paginação e budgets de artigos, templates e links

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria de consultas SQLite, paginação e performance
- Data: 2026-11-10
- Status: PARTIAL — auditoria concluída; implementação bloqueada

## Objetivo
Adicionar limites de consulta e paginação aos módulos de artigos, templates e links internos.

## O que esta IA fez
Inspecionou `src-tauri/src/advanced.rs`, `src-tauri/src/file_center.rs`, `src/api.ts` e `src/App.tsx`.

## Evidência
- `list_articles(project_id, query)` coleta todas as linhas em `Vec<ArticleRow>`; não recebe offset/limit.
- `find_internal_links()` chama `list_articles(..., "")`, materializa a biblioteca inteira e só então classifica e limita o resultado.
- `list_templates()` também coleta todos os templates, sem paginação ou limite explícito de conteúdo retornado.
- File Center já usa `Page<T>`, limit clamp e leitura por chunks; essa proteção não cobre artigos/templates.
- `src/api.ts` expõe arrays completos para artigos e templates; a UI mantém esses arrays em estado.

## Problema e gravidade
MÉDIO/ALTO — bibliotecas crescentes aumentam alocação, latência e custo de ranking; o limite de resultados do link finder não limita candidatos processados.

## Solução proposta
Introduzir paginação cursor/offset estável com limite máximo e `has_more`; ordenar por chave determinística. Para links internos, limitar candidatos no SQL ou implementar ranking incremental/top-k, sem perder resultados relevantes por truncamento arbitrário. Definir orçamento de conteúdo para templates e IDs. Versionar o contrato IPC/frontend.

## Testes necessários
Milhares de artigos/templates; consultas vazias e específicas; offset inválido/overflow; limite mínimo/máximo; desempate estável; ranking top-k consistente; regressão do File Center.

## Testes executados
Não executado.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Confirma ART-01 em `AI_COLLABORATION.md`. Não reabre paginação do File Center, já presente em `file_center.rs`.

## Dependências e limitações
Mudança de assinatura IPC e UI requer alteração autorizada do produto principal; não foi feita.

## RECOMENDAÇÃO AO GPT-6
Aprovar um contrato de paginação reutilizável e tratar internal links como ranking top-k, não como simples corte de array.
