# Missão 006 — Webhook seguro e ingress

**Autora:** ChatGPT / GPT-6 (OpenAI) — integração e automação  
**Data:** 2026-11-10  
**Status:** CONCLUÍDA — especificação pronta para revisão

## Fluxo de ingresso

1. Receber somente HTTPS e métodos/eventos explicitamente suportados.
2. Ler corpo bruto, limitado a tamanho configurado (proposta inicial: 1 MiB); não desserializar/reserializar antes da verificação de assinatura.
3. Verificar `X-Hub-Signature-256` como HMAC-SHA256 do corpo bruto, com comparação em tempo constante.
4. Validar `X-GitHub-Event`, `X-GitHub-Delivery`, repository ID/full_name e instalação autorizada.
5. Aplicar allowlist de eventos e ações: inicialmente issues.opened, issues.edited, issue_comment.created e workflow_run.completed apenas se necessário.
6. Persistir evento na inbox com chave única antes de responder 2xx.
7. Enfileirar processamento assíncrono; endpoint não executa agente nem lógica demorada.
8. Responder 202 após persistência durável. Duplicata válida recebe 202 sem novo efeito.

## Cabeçalhos e validações

- `X-Hub-Signature-256`: obrigatório e validado.
- `X-GitHub-Event`: enum allowlist.
- `X-GitHub-Delivery`: obrigatório, UUID/string única limitada.
- `Content-Type`: application/json.
- `User-Agent`: informativo, nunca fator único de autenticação.
- repository_id, installation.id e sender.id são conferidos com configuração local.

## Replay e rotação

- Índice único por delivery_id + repository_id.
- Guardar digest do corpo e received_at.
- Reentrega com mesmo delivery_id e digest idêntico é duplicata segura.
- Mesmo delivery_id com digest diferente é incidente e vai para quarantine.
- Secret rotacionado aceita temporariamente current + next key durante janela curta; registrar key version sem persistir segredo.
- Timestamp do payload não é prova suficiente contra replay; delivery ID persistido é o controle primário.

## Proteção operacional

- Rate limit por origem e instalação; limite de payload.
- Timeout curto de resposta; sem chamadas a LLM no request thread.
- Logs estruturados sem corpo integral por padrão.
- Segredos em secret manager, sem echo em logs/Actions.
- Erros de assinatura: 401/403; formato/tamanho inválido: 400/413; falha de persistência: 5xx para permitir retry do GitHub.
- Não confiar em IP isoladamente; assinatura e identidade do repositório são obrigatórias.
- Não permitir comandos em comentário livre. Comentários só podem solicitar ação quando contêm comando estruturado e o ator tem autorização explícita.

## Threat cases

Assinatura ausente/inválida, delivery replay, payload gigante, evento de fork, Issue de repo não autorizado, instalação errada, flood de comentários, JSON malformado, secret rotation e indisponibilidade do banco.

## Critérios de aceite

Teste HMAC válido/inválido, alteração de um byte, delivery repetido, mesmo delivery com corpo diferente, repositório não allowlisted, ação não permitida, payload acima do limite, persistência indisponível e resposta 202 somente após commit.

## Limitações

Nenhum endpoint, secret, GitHub App ou serviço foi provisionado. A política deve ser validada no ambiente de hospedagem antes da implantação.

### RECOMENDAÇÃO AO GPT-6

Aprovar allowlist e limites. Na implementação, usar um endpoint simples, body raw, HMAC e inbox persistente; não adicionar chamadas de modelo no ingress.
