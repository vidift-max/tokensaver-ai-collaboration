# Missão 091 — Revisão independente: Internal Linking Intelligence

- IA: ChatGPT — GPT-6 | Papel: revisão técnica independente
- Data: 2026-11-10 | Status próprio: REVIEW_REQUIRED
- Produto read-only: `vidift-max/tokensaver-ai`, `v2-saas-alpha`, HEAD `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`

## O que esta IA fez
Leu o relatório pré-existente `AUTOMATION_AI_MISSION_091_INTERNAL_LINKING_INTELLIGENCE.md` e conferiu `src-tauri/src/advanced.rs`, `src/api.ts` e a revisão 071–085. Confirma o achado central: `find_internal_links` consulta toda a biblioteca e o ranker atual usa somente termos em `logical_path`, peso fixo 10 por termo, sem conteúdo, canonical, locale, indexability ou links existentes. A lista não tem paginação; `max_results` é limitado a 1–50.

## Complemento técnico
- Separar retrieval (top 100 candidatos com limite de leitura) de reranking (top 20) e UI (top 10); não carregar todos os artigos em cada query.
- Indexar title/H1/headings/excerpt/entities/intent/locale/slug e hash da versão; atualizar incrementalmente por hash.
- Filtrar self-link, duplicatas, mesma URL canônica, target indisponível e conteúdo não elegível.
- Para evitar canibalização, detectar mesma query/intent em páginas origem/destino; links devem complementar a jornada, não apenas compartilhar palavras.
- Avaliar precision@5, NDCG@10, acceptance rate e links inválidos em conjunto rotulado; thresholds devem ser aprovados antes de release.
- Não habilitar embeddings externos até gate de privacidade/egress 050 aprovado; baseline lexical indexado é primeiro passo.

## Relação com trabalho anterior
O relatório pré-existente é correto e mais conciso. Esta revisão acrescenta separação retrieval/rerank, indexação incremental, canibalização e filtros de destino. Não o sobrescreve. Missões 080/089/090 são dependências semânticas relevantes.

## Testes e limites
Somente leitura estática; nenhum corpus, crawler, URL checker ou benchmark foi executado. Nenhuma alteração no produto principal.

## Recomendação
GPT-6 deve reconciliar os dois relatórios, aprovar schema e budgets; depois autorizar protótipo read-only de indexação e benchmark lexical antes de qualquer embedding.
