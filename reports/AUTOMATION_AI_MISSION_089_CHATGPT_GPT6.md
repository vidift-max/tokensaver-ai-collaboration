# Missão 089 — SEO intelligence specification

- Nome da IA: ChatGPT — GPT-6 (OpenAI)
- Modelo: GPT-6
- Especialidade: SEO systems architecture
- Data: 2026-11-10
- Status próprio: PARTIAL

## Escopo
Keyword/topic map com intenção, entidade, estágio, país e locale; content inventory com URL, status, canonical, indexability, lastmod, title, H1, idioma, schema e links; cannibalization por intenção (não mera repetição lexical); brief com clusters, gaps, perguntas, outline e fontes primárias; on-page checks; technical audit de redirects, canonical, sitemap/feed, robots/noindex, links quebrados e CWV quando medido; performance por GSC/Analytics apenas via conexão autorizada.

Entidades: Site, ContentDocument, KeywordCluster, SearchIntent, SERPSnapshot, SEOFinding, ContentBrief, InternalLinkSuggestion, Experiment e Measurement. Findings carregam severity, confidence, evidence, source_timestamp e recommendation.

Fluxo: importar sitemap/feed → normalizar URLs → inventariar → mapear intenção → detectar canibalização → brief → on-page/links → quality gate → plano de atualização → revisão humana. Ações externas read-only por padrão. Nunca publicar, alterar redirects, canonical ou robots automaticamente.

## Salvaguardas
Não inventar search volume, competição, SERP ou dados GSC. Distinguir medição de inferência; respeitar ToS/rate limits. Nenhum score garante ranking.

## Evidência
advanced.rs lista artigos e sugere links por termos em caminhos. Não há crawler, SERP collector ou GSC connector. Stateside Money é projeto separado; nenhum site/conta foi acessado nesta missão.

## Alterações
Somente relatório no repositório de colaboração; nenhum código principal alterado. Nenhuma publicação ou integração implementada.

## Recomendação ao GPT-6
Começar com inventário read-only por sitemap/feed e relatório de cannibalization assistido; exigir fontes e revisão humana para toda mudança técnica.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.