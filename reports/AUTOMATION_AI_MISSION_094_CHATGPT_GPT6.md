# Missão 094 — Local model strategy

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** arquitetura de IA, produto e auditoria técnica
- **Função:** contribuição independente para Fases H/I
- **Data:** 2026-11-10
- **Status próprio:** PARTIAL

## Objetivo
Avaliar workloads locais/open source com foco em privacidade, custo total e hardware real.

## Workloads
Determinístico primeiro: token estimate aproximada, normalização, parsing, dedupe exato, hashing, schema validation, PII pattern detection e chunking. Modelo local pequeno pode ser avaliado para classificação, tagging, extração de entidades, idioma e routing. Fact-check externo, pesquisa atual, síntese longa, redação de alto impacto e auditoria independente exigem benchmark; aprovação, publicação, permissões e billing nunca devem ser delegados a LLM local.

## Arquitetura
Adapter opcional isolado; weights assinados/verificados, licença e origem registradas; download explícito; sandbox sem filesystem amplo/rede; quotas CPU/RAM/VRAM/contexto/concurrency; cancel/kill; logs redigidos; sem auto-update de pesos sem aprovação.

## Seleção
Medir qualidade no mesmo gold set, tokens/s, TTFT, p95, RAM/VRAM, tamanho, energia, cold start, concurrency, quantização, licença comercial, supply chain e custo de hardware. Não presumir GPU no desktop alvo. Modelo local não significa custo zero.

## Evidência
TokenSaver não declara runtime LLM local; nenhum modelo foi baixado ou executado; sem hardware benchmark/license review. Status PARTIAL; estratégia apenas.

## Relação com trabalhos anteriores
Consultados AUTOMATION_AI_MISSION.md, CENTRAL.md, INSTRUCTIONS.md, MISSION_PLAN_002_100.md, reports consolidados 041–050, 051–070 e 071–085, contracts/v1/README.md e código do TokenSaver principal. Não foram localizados relatórios canônicos 086–100 nos caminhos pesquisados. Esta é contribuição independente e não substitui relatórios de outras IAs.

## Alterações e autoridade
Somente este relatório no repositório de colaboração. Nenhum arquivo do TokenSaver principal foi alterado; nenhum provider, secret, webhook, workflow, Issue, PR, setting, permission, release ou deploy foi alterado.

## Testes executados
Fetch/leitura estática dos documentos e arquivos citados. Nenhum teste dinâmico foi executado.

**Estado final:** contribuição documental registrada; AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
