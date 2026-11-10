# Missão 009 — Retry, backoff, timeout e dead-letter

**Autora:** ChatGPT / GPT-6 (OpenAI) — integração e automação  
**Data:** 2026-11-10  
**Status:** CONCLUÍDA — especificação pronta para revisão

## Classificação de falhas

| Categoria | Exemplos | Ação |
|---|---|---|
| TRANSIENT | conexão resetada, 429, 502/503/504 | retry com backoff e jitter |
| PERMANENT | schema inválido, 400, capacidade inexistente | falha terminal ou BLOCKED |
| AUTH | 401/403, token revogado | BLOCKED; não repetir sem rotação/autorização |
| CONFLICT | revision mudou, fencing stale | descartar resultado antigo e reconciliar |
| AMBIGUOUS | timeout depois de enviar requisição | consultar provider_run_id; não duplicar cegamente |
| BUDGET | limite financeiro/tokens atingido | BLOCKED; sem aumento automático |
| CANCELLED | cancelamento autorizado | interromper cooperativamente, sem retry |

## Política padrão proposta

- max_attempts: 3 (inclui tentativa inicial);
- base_delay: 10 s;
- exponencial: 10, 30, 90 s;
- jitter aleatório full-jitter em [0, delay];
- respeitar Retry-After quando válido e dentro do deadline;
- timeout de conexão: 10 s;
- timeout de leitura/resposta: configurável por provider;
- timeout global: mission.execution.timeout_seconds;
- deadline: nunca iniciar retry que ultrapasse deadline ou orçamento.

O contrato permite valores até limites, mas a política efetiva é limitada pelo servidor e não pode ser ampliada pelo agente.

## Retry seguro

Retry automático somente quando:
1. erro é transitório;
2. operação é idempotente ou estado externo foi reconciliado;
3. número de tentativas não excedeu max_attempts;
4. orçamento restante é suficiente;
5. missão/revision ainda está atual;
6. missão não foi cancelada/expirada.

Timeout após envio a provedor sem suporte a idempotency key/status deve ir para AMBIGUOUS/BLOCKED e revisão, não iniciar uma segunda geração automaticamente.

## Dead-letter

Mover para DLQ quando:
- tentativas esgotadas;
- payload permanentemente inválido;
- evento falha repetidamente no parser;
- efeito externo não pode ser reconciliado;
- suspeita de segurança.

DLQ mantém payload minimizado/criptografado, digest, motivo, tentativas e correlação. Replay exige operador autorizado, motivo, nova revisão ou chave de replay controlada; nunca replay manual direto sem auditoria.

## Observabilidade e custos

Cada tentativa registra start/end, categoria, código, provider request ID, delay, tokens, custo, deadline restante, retry decision e correlation_id. Não logar prompt ou resposta integral por padrão.

## Testes necessários

429 com Retry-After, 5xx, erro permanente, falha auth, timeout antes/depois de envio, orçamento esgotado, deadline expirado, cancelamento durante backoff, jitter bounds, max_attempts e DLQ replay auditado.

## Limitações

Especificação documental; nenhuma fila, scheduler, timer ou integração de provedor foi implementada/testada. Valores iniciais exigem calibração com medições reais.

### RECOMENDAÇÃO AO GPT-6

Aprovar matriz de retry e caso AMBIGUOUS. Implementar retry em camada de orquestração com relógio injetável e testes determinísticos; não delegar política ao agente.
