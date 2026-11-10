# Missão 093 — Provider comparison

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** arquitetura de IA, produto e auditoria técnica
- **Função:** contribuição independente para Fases H/I
- **Data:** 2026-11-10
- **Status próprio:** PARTIAL

## Objetivo
Framework de comparação sem inventar preços, qualidade ou latência.

## Scorecard por workload
Workloads: pesquisa factual, síntese longa, JSON estruturado, copy-edit, PT/EN, código, classificação, privacidade/on-prem e throughput. Critérios: qualidade cega, factuality, aderência a instruções, schema validity, resistência a prompt injection, contexto efetivo, latency p50/p95, availability, rate limits, retenção/treinamento de dados, região, SLA, preços input/output/cache e portabilidade.

Pesos iniciais configuráveis: quality 30%, factuality 20%, security/privacy 15%, cost/TCO 15%, latency/reliability 10%, integration 10%. Privacy, security e schema são hard gates, não compensáveis por preço.

Benchmark: mesmo gold set e prompt version, config controlada, ≥100 casos/workload quando viável, avaliação cega dupla, custo/latência reais, registrar versão/região/data e repetir a cada atualização. Não usar benchmark público isolado.

## Evidência e decisão
README informa que não há API de rede; ClaudeConfig apenas persiste configuração; package.json não declara SDK de provider. Nenhum provider chamado, preço consultado ou benchmark executado. Não é possível declarar Claude/GPT/Kimi vencedor. Exigir security gate 050, egress/SSRF, secret manager, consentimento e autorização antes de piloto. Status PARTIAL.

## Relação com trabalhos anteriores
Consultados AUTOMATION_AI_MISSION.md, CENTRAL.md, INSTRUCTIONS.md, MISSION_PLAN_002_100.md, reports consolidados 041–050, 051–070 e 071–085, contracts/v1/README.md e código do TokenSaver principal. Não foram localizados relatórios canônicos 086–100 nos caminhos pesquisados. Esta é contribuição independente e não substitui relatórios de outras IAs.

## Alterações e autoridade
Somente este relatório no repositório de colaboração. Nenhum arquivo do TokenSaver principal foi alterado; nenhum provider, secret, webhook, workflow, Issue, PR, setting, permission, release ou deploy foi alterado.

## Testes executados
Fetch/leitura estática dos documentos e arquivos citados. Nenhum teste dinâmico foi executado.

**Estado final:** contribuição documental registrada; AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
