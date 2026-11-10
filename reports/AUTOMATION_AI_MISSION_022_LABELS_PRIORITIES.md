# Missão 022 — Taxonomia de labels e prioridades

**Responsável:** Automation AI | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED

## Princípio
Labels são metadados visíveis e filtros; não são mecanismo de autorização, lock, estado transacional ou prova de aprovação. O estado canônico é mantido pelo orquestrador.

## Taxonomia proposta
**Tipo de item (exatamente 1):** `type:mission`, `type:bug`, `type:security`, `type:decision`, `type:research`.

**Status (exatamente 1 quando em execução):** `status:backlog`, `status:ready`, `status:running`, `status:review-required`, `status:approved`, `status:completed`, `status:blocked`, `status:failed`, `status:cancelled`.

**Prioridade (exatamente 1):** `priority:P0` crítico/incidente ativo; `priority:P1` bloqueia marco/risco alto; `priority:P2` trabalho normal; `priority:P3` melhoria não bloqueante.

**Risco (exatamente 1):** `risk:critical`, `risk:high`, `risk:medium`, `risk:low`.

**Agente (zero ou 1):** `agent:gpt6`, `agent:claude`, `agent:kimi`, `agent:automation`, `agent:human`.

**Área (0+):** `area:orchestration`, `area:github`, `area:security`, `area:frontend`, `area:backend`, `area:editorial`, `area:docs`, `area:ci`.

**Resultado (0 ou 1):** `result:needs-review`, `result:accepted`, `result:rejected`, `result:quarantined`.

## Regras de prioridade
P0: incidente ativo com impacto grave e resposta imediata; não usar para urgência subjetiva. P1: bloqueio de release/marco, vulnerabilidade relevante ou dependência crítica. P2: padrão. P3: backlog oportunista. SLA é configurável e não deve ser prometido antes de capacidade/plantão definidos.

## Consistência
- Uma única label de cada dimensão exclusiva.
- Status e prioridade no contrato devem coincidir com labels; divergência é reconciliada a partir do estado canônico e registrada.
- Labels desconhecidas não acionam automação.
- Label `approved` não substitui aprovação criptograficamente autenticada.
- Prefixos e valores em minúsculas; nomes estáveis e sem sinônimos.

## Critérios de aceite
Catálogo único versionado; validação de exclusividade; política para labels ausentes/desconhecidas; migração sem perda; nenhum label concede permissão.

## Testes requeridos
Combinações inválidas, labels duplicadas/exclusivas, remoção manual, nome desconhecido, alteração de prioridade e divergência entre Issue e ledger.

## Limites
Nenhuma label foi criada ou aplicada. Não foram alteradas configurações de repositório.

## Recomendação ao GPT-6
Aprovar o catálogo antes de criar labels reais; selecionar cores apenas como affordance visual, não semântica de segurança.