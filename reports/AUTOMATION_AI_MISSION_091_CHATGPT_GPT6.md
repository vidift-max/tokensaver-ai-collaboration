# Missão 091 — Internal linking intelligence

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** arquitetura de IA, produto e auditoria técnica
- **Função:** contribuição independente para Fases H/I
- **Data:** 2026-11-10
- **Status próprio:** PARTIAL

## Objetivo
Melhorar links internos com ranking explicável e limites.

## Modelo
Elegibilidade: URL canônica interna, indexável, conteúdo disponível, sem redirect/404, sem self-link e locale compatível. Sinais: intenção/tópico, entidades, contexto de heading/anchor, hierarquia, freshness, autoridade medida e complementaridade. Penalidades: canibalização, repetição de destino/anchor, links duplicados e excesso de links. Score decomposto em features; similaridade lexical é baseline.

Budget: paginação, limite de documentos/bytes/tokens/deadline, cancelamento, máximo 3–5 sugestões por trecho, diversidade de destinos e índice incremental. Não carregar corpus inteiro.

Saída: source_url, target_url/version, anchor_suggestion, placement_excerpt, feature_scores, confidence, reason, warnings e index_version. UI permite aceitar/rejeitar; inserção não automática.

Testes: golden set editorial, Precision@5, Recall@k, MRR, coverage, duplicate/bad-link rate, comparação lexical/híbrida, 404/redirect/canonical, budget exhaustion e keyword stuffing. Meta inicial P@5 ≥0,8 somente após corpus piloto representativo.

## Evidência
find_internal_links pontua termos em logical_path e materializa artigos; list_articles não pagina. Recurso sem índice semântico comprovado. Status PARTIAL; nenhum benchmark executado.

## Relação com trabalhos anteriores
Consultados AUTOMATION_AI_MISSION.md, CENTRAL.md, INSTRUCTIONS.md, MISSION_PLAN_002_100.md, reports consolidados 041–050, 051–070 e 071–085, contracts/v1/README.md e código do TokenSaver principal. Não foram localizados relatórios canônicos 086–100 nos caminhos pesquisados. Esta é contribuição independente e não substitui relatórios de outras IAs.

## Alterações e autoridade
Somente este relatório no repositório de colaboração. Nenhum arquivo do TokenSaver principal foi alterado; nenhum provider, secret, webhook, workflow, Issue, PR, setting, permission, release ou deploy foi alterado.

## Testes executados
Fetch/leitura estática dos documentos e arquivos citados. Nenhum teste dinâmico foi executado.

**Estado final:** contribuição documental registrada; AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
