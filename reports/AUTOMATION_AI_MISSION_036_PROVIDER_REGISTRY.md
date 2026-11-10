# Missão 036 — Provider Registry

**Responsável:** ChatGPT / GPT-6 — integração e automação multiagente  
**Data:** 2026-11-10  
**Status:** REVIEW_REQUIRED

## Modelo proposto

O registry é um catálogo versionado de identidades lógicas, providers, adapters, modelos/configurações, capacidades, limites, regiões, trust tier e estado operacional. Deve separar provider (empresa/API), model (versão concreta), adapter (tradução do protocolo) e agent profile (papel no sistema).

## Campos mínimos

`agent_id`, `provider_id`, `adapter_id`, `model_ref`, `capabilities[]`, `task_types[]`, `input_modalities[]`, `output_modalities[]`, `max_context_tokens` (nullable), `max_output_tokens` (nullable), `supports_structured_output`, `supports_cancellation`, `supports_streaming`, `region`, `data_policy_ref`, `cost_profile_ref`, `health_state`, `enabled`, `version`, `updated_at`.

## Regras

- Capacidades desconhecidas são `unknown`, nunca false/true inferido.
- Quotas/preços devem ter fonte, data de verificação e unidade.
- Health state é runtime e não deve ser confundido com capacidade.
- Desativar provider não apaga histórico nem resultados.
- Registry não armazena tokens, chaves ou prompts.
- Alterações de perfil são versionadas e auditadas; capability não concede permissão.

## Lifecycle

PROPOSED → VERIFIED → ENABLED → DEGRADED/DISABLED. Só owner/integrador autenticado pode ativar provider. Alterações de endpoint, região, retenção ou modelo exigem revisão de segurança.

## Critérios de aceite

Schema tipado; campos de proveniência; valores desconhecidos; versionamento; separação de credenciais; ativação autenticada; histórico de mudança.

## Limitações

Nenhum catálogo operacional foi implantado. Nenhum preço, quota ou capacidade específica foi verificado junto aos provedores.

## RECOMENDAÇÃO AO GPT-6

Aprovar o registry como fonte declarativa e exigir evidência datada para capabilities, limites e custo antes de habilitar cada perfil.
