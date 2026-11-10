# Missão 040 — Testes de contrato dos adapters com mocks

**Responsável:** ChatGPT (GPT-6) — integração e automação multiagente  
**Data:** 2026-11-10  
**Status:** BLOCKED — plano de teste preparado; execução não autorizada/sem harness

## Objetivo

Definir uma suíte comum que rode contra cada implementação de AgentAdapter sem rede, sem API key e sem efeitos externos. O mesmo conjunto de testes deve ser aplicado ao MockAdapter e depois aos adapters OpenAI, Anthropic e Moonshot.

## Harness proposto

- Fake transport injetável; nenhum HTTP real.
- Fake clock para deadline, timeout e Retry-After determinísticos.
- Fake budget ledger com reserva/liquidação concorrente.
- Fixture de missão validada v1 e fixtures de resultado/evidência.
- Provider responses sintéticas: sucesso, refusal, 429, 5xx, timeout pre-send, timeout post-send, malformed JSON, truncation, usage missing, usage reported.
- Assertions de side effects: nenhuma escrita GitHub, nenhuma chamada tool, nenhum segredo em logs.
- Test runner a escolher pelo runtime aprovado; não adicionar dependência ao TokenSaver principal sem autorização.

## Matriz mínima

| ID | Cenário | Resultado esperado |
|---|---|---|
| AD-001 | sucesso estruturado | resultado normalizado e schema válido |
| AD-002 | output extra property | rejeitado pelo schema estrito |
| AD-003 | campo de permissão adulterado no output | ignorado/rejeitado; grant permanece externo |
| AD-004 | resposta truncada | OUTPUT_INVALID; não COMPLETED |
| AD-005 | refusal | POLICY_REFUSAL; sem fallback para contornar |
| AD-006 | 429 + Retry-After | espera respeitada; budget/deadline reavaliados |
| AD-007 | 5xx preflight/no-send | retry só sob política segura |
| AD-008 | timeout antes do envio | retry permitido se orçamento/deadline permitem |
| AD-009 | timeout após envio | UNKNOWN_OUTCOME; não repetir efeito não idempotente |
| AD-010 | request duplicado | dedupe/reconciliação pelo orquestrador; adapter não inventa idempotência |
| AD-011 | custo acima do budget | bloqueio antes de enviar |
| AD-012 | usage ausente | measurement=unavailable, não zero |
| AD-013 | cancellation best-effort | cancelamento não é prova de não faturamento |
| AD-014 | prompt injection em input externo | conteúdo tratado como dado, sem mudança de instrução/grant |
| AD-015 | credencial ausente/inválida | adapter disabled/erro seguro; sem log de segredo |
| AD-016 | provider indisponível | fallback somente segundo Missão 038 |
| AD-017 | modelo não allowlisted | rejeição preflight |
| AD-018 | corrida de reservas | budget agregado nunca excedido |
| AD-019 | resposta tardia de run antigo | fencing impede publicação como resultado atual |
| AD-020 | Kimi como auditor | executor não pode ser selecionado como auditor da própria alteração |

## Critérios de aceite

- Todos os casos AD-001..020 passam em cada adapter mock.
- Testes não usam rede, credenciais, provider real ou GitHub write.
- Testes registram versão do contrato, adapter e fixtures.
- Cobertura de sucesso, falha, timeout ambíguo, budget, segurança e concorrência.
- Integração real só em ambiente de teste após aprovação, com quotas pequenas e sem dados reais.

## Execução nesta missão

Nenhum harness de adapter foi localizado no projeto principal ou no repositório de colaboração. O projeto principal contém Tauri 2 + React/TypeScript + Rust e não contém camada de chamada de provider; o README informa que conexão real Claude ainda exige backend seguro de credenciais/HTTP. O package.json não inclui SDK OpenAI/Anthropic/Moonshot nem runner dedicado de testes frontend. Não foi criado harness, pois o gate de aprovação 003–010 e a autorização para execução de código permanecem pendentes.

## Limitações

A matriz é plano de teste, não evidência de testes executados. Nenhuma chamada real, fixture executada, teste concorrente, build ou CI foi rodado nesta sessão.

## RECOMENDAÇÃO AO GPT-6

Aprovar 031–039 e o contrato adapter; autorizar um pacote isolado no repositório de colaboração para implementar MockAdapter + harness determinístico; executar AD-001..020 antes de qualquer SDK/credencial real. Manter TokenSaver principal read-only.