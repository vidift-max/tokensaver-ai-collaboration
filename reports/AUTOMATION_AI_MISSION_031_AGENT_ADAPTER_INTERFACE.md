# Missão 031 — Interface comum Agent Adapter

**Responsável:** ChatGPT / GPT-6 — integração e automação multiagente  
**Data:** 2026-11-10  
**Status:** REVIEW_REQUIRED

## Objetivo e decisão proposta

Definir uma fronteira única entre o orquestrador e qualquer agente/provedor, sem acoplar o domínio a APIs específicas. O adapter é um tradutor de protocolo; não é o autorizador da missão nem o dono do estado.

Contrato lógico proposto:
- `capabilities()`: declara capacidades e limites estáticos conhecidos;
- `validate(request)`: valida compatibilidade local, sem executar chamada;
- `execute(request, context)`: executa uma única tentativa limitada por deadline e budget;
- `normalize(raw, metadata)`: converte resposta do provider para AgentResult v1;
- `health()`: retorna disponibilidade/circuit breaker, sem revelar credenciais;
- `cancel(run_id)`: best-effort, com resultado explicitamente confirmado ou desconhecido.

## Request canônico

Campos obrigatórios: `schema_version`, `mission_id`, `revision`, `run_id`, `attempt`, `agent_id`, `task_type`, `input_refs`, `output_contract`, `deadline`, `budget`, `correlation_id`. Conteúdo externo permanece marcado como dado não confiável. Segredos, tokens GitHub e grants de escrita nunca são passados ao adapter.

## Response canônica

Retornar `status` (DELIVERED/BLOCKED/FAILED/CANCELLED), resumo, artefatos referenciados por path/hash, evidências, testes, limitações, custo ou `unavailable`, timestamps e identificador de execução do provider quando disponível. O adapter não pode declarar APPROVED nem alterar estado global.

## Invariantes

1. Uma chamada corresponde a um `run_id + attempt`; retries são decididos pelo orquestrador.
2. Deadline e budget são impostos fora e dentro do adapter; exceder qualquer limite encerra a tentativa.
3. Saídas são dados não confiáveis até validação independente.
4. Sem suporte a cancelamento, retornar `cancel_status=unknown`; não fingir interrupção.
5. Nenhuma operação de repositório, merge, deploy ou acesso a secrets pertence à interface de modelo.
6. Erros são normalizados em categorias transitórias, permanentes, quota, timeout, safety e protocol.
7. Idempotência de execução é responsabilidade do orquestrador; adapter não repete silenciosamente.

## Testes e critérios de aceite

Conformidade para request/response válidos e inválidos; deadline; orçamento; cancelamento incerto; resposta malformada; duplicidade; erro de provider; isolamento de segredos; impossibilidade de aprovar ou escrever no repositório.

## Dependências e limitações

Baseia-se no contrato `contracts/v1/agent-result.schema.json` e na máquina de estados 004, ambos ainda REVIEW_REQUIRED. A interface é proposta normativa, não SDK executável nem integração de provider. Nenhuma API externa foi chamada.

## RECOMENDAÇÃO AO GPT-6

Aprovar a fronteira lógica e congelar os tipos comuns antes de implementar adapters concretos. Solicitar revisão de compatibilidade com schemas 003–005; manter adapters sem credenciais de GitHub e sem poder de aprovação.
