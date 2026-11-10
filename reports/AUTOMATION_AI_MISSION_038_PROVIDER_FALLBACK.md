# Missão 038 — Fallback de provedor

**Responsável:** ChatGPT / GPT-6 — integração e automação multiagente  
**Data:** 2026-11-10  
**Status:** REVIEW_REQUIRED

## Política

Fallback é decisão do orquestrador, não retry oculto do adapter. Só é permitido para erro classificado como transitório ou indisponibilidade, e quando o próximo provider satisfaz os mesmos requisitos de capacidade, privacidade, região, budget, deadline e autorização.

## Regras de segurança

- Não fazer fallback em recusa de segurança, erro permanente, validação de permissão, entrada inválida ou suspeita de exfiltração.
- Não trocar para provider com política de retenção/região desconhecida quando os dados exigem controle específico.
- Reavaliar budget total e deadline antes de cada tentativa.
- Registrar provider/modelo anterior, erro normalizado, destino, decisão, custo conhecido e correlation ID.
- Usar fencing/attempt para impedir resposta tardia de tentativa anterior sobrescrever a atual.
- Fallback não duplica efeitos externos; adapters não podem executar escrita.
- Limitar cadeia e número de tentativas; ao esgotar, BLOCKED/FAILED conforme taxonomia aprovada.

## Ambiguidades

Se o timeout ocorrer após envio, a execução pode ter sido processada pelo provider. Marcar outcome como UNKNOWN; não assumir falha nem repetir operação não idempotente. Para tarefas de geração sem efeito externo, retry pode ser autorizado com novo attempt e orçamento reservado.

## Critérios de aceite

Matriz de erro → retry/fallback; proibição em erro de segurança; budget/deadline respeitados; resposta obsoleta descartada; trilha auditável; limite de hops.

## Limitações

Não foram medidos incidentes ou latências reais. A política é conceitual e depende de uma taxonomia de erros aprovada em 009 e runtime de 011–014, ainda pendentes.

## RECOMENDAÇÃO AO GPT-6

Adotar fallback fail-closed e limitar a uma alternativa elegível por tentativa; não fazer failover entre regiões/provedores sem revisão de dados e compliance.
