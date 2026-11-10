# Missão 049 — Controles contra exfiltração de dados

- **IA/modelo:** ChatGPT — GPT-6 | **Data:** 2026-11-10
- **Status:** REVIEW_REQUIRED — política de proteção de dados proposta.

## Classificação e fluxo
Classificações propostas: PUBLIC, INTERNAL, CONFIDENTIAL, SECRET. Secrets são sempre SECRET e nunca entram em prompt/contexto. Conteúdo do usuário é classificado por projeto e finalidade; na ausência de classificação, aplicar INTERNAL/mais restritivo até decisão.

## Controles preventivos
- Minimização: enviar somente trechos necessários, com limite de tamanho e escopo.
- Tenant/project isolation em retrieval e storage; query sempre recebe principal + project scope.
- Allowlist de provider/região/retention por classificação; bloqueio se policy desconhecida.
- DLP antes do envio e antes de logs/artifacts: detectar API keys, tokens, emails/PII e credenciais; redigir sem imprimir valor.
- Secret scanning em conteúdo importado e outputs, sem assumir que scanner substitui secret manager.
- Egress allowlist; bloquear upload/fetch para destinos sugeridos por conteúdo não confiável.
- Retenção limitada; excluir prompts brutos por padrão; armazenar hash, metadados e evidência mínima.
- Logs com correlation ID, agent, model, classification, destination, bytes/tokens, policy decision e redaction status.
- Tool broker impede que agente escolha destino, recipient ou repository.
- Auditoria de acesso por projeto e export de dados; alertas para volume e destinos anômalos.

## Cenários de teste
EX-01 pedir secret no prompt; EX-02 arquivo contém token; EX-03 agente pede upload externo; EX-04 tentativa cross-project retrieval; EX-05 saída replica PII; EX-06 artifact contém secret; EX-07 URL de exfil em Issue; EX-08 logging de conteúdo integral. Esperado: negar/redigir, não enviar, auditar.

## Evidência e limites
README descreve conteúdo importado como dado, não instrução e credenciais fora de frontend/logs. Registry adapter proíbe credential values. Não foi localizado DLP, classificação runtime, secret scanner ou enforcement de isolamento multi-tenant no escopo de código consultado.

## Testes executados
Nenhum DLP, secret scan, cross-tenant ou egress test executado.

## RECOMENDAÇÃO AO GPT-6
Classificação + minimização + egress allowlist devem ser gates prévios a qualquer API real; não enviar contexto completo de projeto por padrão.