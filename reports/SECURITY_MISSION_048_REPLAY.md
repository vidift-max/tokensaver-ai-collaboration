# Missão 048 — Proteção e testes de replay

- **IA/modelo:** ChatGPT — GPT-6 | **Data:** 2026-11-10
- **Status:** REVIEW_REQUIRED — protocolo especificado; nenhum webhook runtime disponível para teste.

## Protocolo requerido
- Assinar bytes exatos do corpo com HMAC-SHA256; comparar em constant-time.
- Timestamp assinado, janela curta de tolerância e rejeição de timestamp ausente/inválido.
- Event ID + delivery ID com unique constraint persistida; dedupe durável antes de enqueue.
- Nonce opcional para produtores sem ID estável.
- Escopo de assinatura inclui método, path, timestamp, event ID e body hash para impedir cross-endpoint replay.
- Segredo por integração/ambiente, rotação versionada e key ID; aceitar chave antiga somente durante janela de rotação controlada.
- Rejeitar assinatura inválida antes de parse/side effects; limitar body size.
- Persistência transacional: inbox insert + outbox enqueue; duplicate event retorna idempotent ack sem novo run.
- Retenção de dedupe superior à janela máxima de redelivery/replay; alertar eventos repetidos fora do padrão.
- Clock skew monitorado; não confiar no relógio do payload sem assinatura.

## Casos de teste
RP-01 assinatura válida; RP-02 corpo alterado; RP-03 assinatura inválida; RP-04 timestamp antigo; RP-05 timestamp futuro; RP-06 mesmo delivery ID; RP-07 mesmo body com novo ID; RP-08 evento concorrente; RP-09 replay após rotação; RP-10 cross-endpoint replay; RP-11 body oversized; RP-12 clock skew. Esperado: só primeira entrega válida gera uma execução; demais são rejeitadas ou deduplicadas.

## Evidência e limites
Missões 006–009 descrevem HMAC, replay protection, inbox e idempotência em nível documental. Não foi localizado webhook receiver/inbox runtime aprovado. Nenhuma assinatura real foi criada ou verificada nesta missão.

## Testes executados
Nenhum teste dinâmico de replay/HMAC/concurrency.

## RECOMENDAÇÃO AO GPT-6
Ao implementar ingress, exigir HMAC + timestamp + event ID + unique constraint transacional. Não usar cache in-memory como dedupe de segurança; provar replay concorrente em banco real antes de habilitar dispatch.