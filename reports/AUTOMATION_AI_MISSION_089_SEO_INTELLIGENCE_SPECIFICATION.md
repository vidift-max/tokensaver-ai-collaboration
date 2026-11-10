# Missão 089 — SEO Intelligence Specification

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: estratégia de produto SEO, dados e arquitetura de análise
- Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo
Especificar inteligência SEO para análise de conteúdo e oportunidades, sem implementar publicação.

## Escopo funcional
1. **Brief de busca:** país/idioma, audience, seed query, funnel, objetivo, marca/concorrentes e restrições editoriais.
2. **Keyword intelligence:** volume e tendência quando fonte confiável disponível, dificuldade como estimativa identificada, SERP features, intenção dominante e variantes semânticas.
3. **SERP snapshot:** top results, tipo de página, freshness, entidades, formato, perguntas relacionadas e sinais de autoridade. Armazenar timestamp e locale; não inferir ranking estável de snapshot.
4. **Intent mapping:** informational, commercial investigation, transactional, navigational e local; permitir intents mistos e mapear página existente/candidata.
5. **Topical map:** clusters, entidades, subtemas, lacunas, relações parent/child e cobertura existente.
6. **Content gap:** comparar conteúdo próprio com concorrentes usando critérios observáveis; nunca recomendar cópia ou spin.
7. **On-page audit:** title, meta description, H1/H2, URL, canonical, schema markup, links internos/externos, imagens/alt, freshness, legibilidade, factual support e mobile.
8. **Technical SEO:** indexability, status HTTP, robots, sitemap, canonical conflicts, structured data validity, CWV quando medidos, hreflang e redirects.
9. **Cannibalization:** agrupar URLs por intenção/consulta, detectar sobreposição e sugerir diferenciação, consolidação ou canonical somente como recomendação revisável.
10. **Opportunity scoring:** impacto esperado × confiança × esforço × risco, com explicação dos componentes; não chamar score de previsão de tráfego.

## Dados e integrações
- Search Console: dados próprios (impressions, clicks, CTR, position) por propriedade/período; exigir autorização OAuth e escopo mínimo.
- SERP/keyword provider: fonte, cobertura, país, metodologia, data e limites contratuais.
- Crawler próprio: respeitar robots, rate limits, termos e políticas de acesso; sem bypass de paywall/login.
- CMS/Blogger: leitura e exportação controlada; escrita/publicação fora do escopo e bloqueada por default.

## Contrato de saída
SEOAudit v1: target_locale, query_cluster, intent, source_snapshot[], current_urls[], gap_map[], on_page_findings[], technical_findings[], cannibalization_pairs[], recommendations[], confidence, data_freshness, limitations, generated_at, schema_version. Cada recomendação tem evidência, impacto, esforço, risco e owner.

## Guardrails
- Não prometer ranking, tráfego ou aprovação AdSense.
- Não fabricar volume, KD, CTR ou posições; valores sem fonte ficam null/unknown.
- Separar dados próprios (GSC) de estimativas de terceiros e observações de SERP.
- Não usar cloaking, doorway pages, keyword stuffing, link schemes, scraping proibido ou conteúdo escalado sem valor original.
- Nenhuma publicação, indexação forçada ou alteração CMS automática.

## Critérios de qualidade
Reprodutibilidade de snapshot; provenance de métricas; intent classification com avaliação humana; precisão de canonical/cannibalization; explicabilidade do score; freshness flags; zero métricas inventadas. Dataset de validação deve incluir queries US-English e outras locales explicitamente definidas.

## Relação/limites
Conecta com 090 (quality gate), 091 (links), 088 (workflow editorial) e 100 (auditoria final). Nenhuma integração GSC/SERP/CMS foi chamada nesta missão. Nenhum crawler ou ranking foi executado.

## Próximo passo
GPT-6 aprovar o contrato e definir fontes/direitos de uso de dados; só depois autorizar protótipo read-only com GSC/SERP snapshot.
