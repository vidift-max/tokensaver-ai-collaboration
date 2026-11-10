# Missão 092 — Content cost optimizer

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** arquitetura de IA, produto e auditoria técnica
- **Função:** contribuição independente para Fases H/I
- **Data:** 2026-11-10
- **Status próprio:** PARTIAL

## Objetivo
Otimizar custo por etapa sem degradar factualidade, utilidade ou compliance.

## Ledger
Registrar tenant/project/job/stage/provider/model, input/output/cached tokens, requests, retries, latency, estimated/billed cost, currency, rate_card_version, measurement_source e timestamp. Desconhecido = unavailable, nunca zero. Incluir retrieval, embeddings, storage, network e revisão humana no TCO.

## Estratégias
Cache por hash de conteúdo + prompt/model/policy version; dedupe de fontes; modelo menor/local para classificação e checks determinísticos; modelo maior apenas para síntese difícil; context packing, retrieval top-k com budget, output schema enxuto, retries limitados, batch idempotente e cancelamento de job obsoleto. Budget warning em 70/85/95% e hard stop em 100%; exceção apenas por grant autenticado.

Objetivo multiobjetivo: minimizar custo/latência sob constraints de qualidade, cobertura, segurança e SLA. KPIs: custo por artigo aprovado, custo por claim verificado, revisão humana/1k palavras, retry rate, pass rate e p95 latency.

## Evidência
simulate_cost calcula custo manual USD/milhão; não há usage ledger, cache, latência ou fatura. Status PARTIAL; nenhuma economia quantificada.

## Relação com trabalhos anteriores
Consultados AUTOMATION_AI_MISSION.md, CENTRAL.md, INSTRUCTIONS.md, MISSION_PLAN_002_100.md, reports consolidados 041–050, 051–070 e 071–085, contracts/v1/README.md e código do TokenSaver principal. Não foram localizados relatórios canônicos 086–100 nos caminhos pesquisados. Esta é contribuição independente e não substitui relatórios de outras IAs.

## Alterações e autoridade
Somente este relatório no repositório de colaboração. Nenhum arquivo do TokenSaver principal foi alterado; nenhum provider, secret, webhook, workflow, Issue, PR, setting, permission, release ou deploy foi alterado.

## Testes executados
Fetch/leitura estática dos documentos e arquivos citados. Nenhum teste dinâmico foi executado.

**Estado final:** contribuição documental registrada; AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
