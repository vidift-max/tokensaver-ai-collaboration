# Missão 008 — Lease distribuído e fencing token

**Autora:** ChatGPT / GPT-6 (OpenAI) — integração e automação  
**Data:** 2026-11-10  
**Status:** CONCLUÍDA — especificação pronta para revisão

## Registro de lease

Campos: lease_id, mission_id, revision, owner_id, fencing_token, acquired_at, heartbeat_at, expires_at, status.

Chave lógica: uma lease ativa por mission_id + revision + execution_slot. execution_slot só permite paralelismo quando a missão define partições independentes.

## Claim atômico

- Transação verifica estado elegível e revisão corrente.
- Verifica ausência de lease não expirada para o slot.
- Incrementa contador monotônico de fencing por chave de missão/revisão/slot.
- Insere lease e transiciona ASSIGNED -> RUNNING na mesma transação.
- Devolve lease_id + fencing_token ao worker.

Não usar relógio do worker como autoridade. Expiração e comparação usam relógio do banco/serviço coordenador.

## Heartbeat e renovação

Proposta inicial: TTL 90 s, heartbeat 30 s. Renovação só se owner_id, lease_id, revision e fencing_token coincidirem e a lease ainda não estiver revogada. Limite de extensão deve respeitar deadline global da missão.

Se heartbeat falhar, worker interrompe publicação e tenta cancelamento cooperativo. Não assume que chamada externa terminou.

## Fencing

Cada aquisição incrementa token monotônico. Todo write de estado/artefato/publicação deve verificar token atual. Token menor que o maior aceito é rejeitado como STALE_WORKER.

O token deve ser validado no ponto de escrita final, não somente no claim. Isso protege contra worker antigo que continua rodando depois de pausa longa ou partição de rede.

## Recuperação

Lease expirada pode ser marcada EXPIRED e nova aquisição pode ocorrer. Antes de reexecutar agente, reconciliar provider_run_id para descobrir se chamada anterior ainda está ativa/concluída. Se estado externo for ambíguo, bloquear para revisão em vez de duplicar chamada cara.

## Limitações por banco

SQLite: protótipo com um worker, transações curtas e busy timeout; não alegar lock distribuído robusto entre múltiplas instâncias. PostgreSQL recomendado para multiworker com row locking/conditional updates. Redis lock isolado não substitui fencing persistido.

## Testes necessários

Dois workers claim simultâneo; heartbeat concorrente; lease expirada; worker A retoma após B adquirir token maior; write atrasado com token velho; alteração de revision; crash/restart; relógio worker divergente; deadline excedido.

## Limitações

Não há serviço ou lease implementado. TTL/heartbeat são valores iniciais para benchmark, não constantes finais.

### RECOMENDAÇÃO AO GPT-6

Aprovar fencing token monotônico validado no write path. Implementar claim/renew/complete com transações e testes concorrentes antes de escalar workers.
