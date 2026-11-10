# Missão 048 — Replay Protection

**Identificação:** ChatGPT — GPT-6 | **Especialidade:** segurança de aplicações e arquitetura multiagente | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED — especificação documental, não controle implantado.

**Escopo:** análise estática/documental. Nenhum código do repositório principal foi alterado; nenhum secret foi acessado; nenhum teste dinâmico foi executado.

## Objetivo e contribuição própria
Especifiquei autenticação, janela temporal, nonce/delivery deduplication e inbox/outbox transacional para impedir replay, reordenação e efeitos duplicados.

## Evidência examinada
Missões 006–009 propõem webhook seguro, inbox/outbox, lease/fencing e retry/DLQ; missão 024 propõe dispatch. Matriz 010 exige grants curtos e revogáveis. Busca por webhook no código principal não localizou receiver operacional.

## Protocolo proposto
1. TLS e HMAC-SHA256 sobre bytes exatos do corpo, timestamp, delivery_id, audience e versão.
2. Comparação em tempo constante; key_id e rotação de segredo.
3. Rejeitar timestamp fora de janela; timestamp não substitui nonce.
4. Persistir delivery_id/nonce com unique constraint e TTL; evento e idempotency key na mesma transação.
5. Replay idêntico retorna resultado anterior sem repetir side effect.
6. Mesmo delivery_id com body hash diferente vai para quarantine/alerta.
7. Idempotência de negócio separada: mission_id + revision + action + target.
8. Revalidar grant, repo/ref/commit e estado no momento da execução; assinatura válida não é autorização.
9. Lease/fencing impede worker antigo de persistir resultado.
10. Outbox transacional; retry só com idempotência comprovada; DLQ sem secrets.

## Estados
RECEIVED → AUTHENTICATED → DEDUPLICATED → AUTHORIZED → ENQUEUED → PROCESSING → COMPLETED/REJECTED/QUARANTINED. Repetição segue REPLAY_IGNORED com referência à entrega original.

## Testes necessários
RP-01 assinatura inválida; RP-02 timestamp velho/futuro; RP-03 nonce repetido; RP-04 delivery duplicado; RP-05 body diferente; RP-06 concorrência; RP-07 crash inbox/ack; RP-08 retry após sucesso; RP-09 grant revogado; RP-10 fencing expirado; RP-11 rotação de chave.

## Testes executados
Não executado: receiver não localizado; sem testes de replay, webhook ou concorrência.

## Relação com trabalhos anteriores
Consolida propostas 006–009 e 024 sem declarar módulos implantados.

## Limitações/status
Sem receiver/inbox operacional identificado. TTL/janela devem ser definidos com SLA do emissor. REVIEW_REQUIRED. Implementar após aprovação dos contratos base e testar com fault injection. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.