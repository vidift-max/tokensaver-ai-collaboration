# Missão 097 — Authentication

## Identificação
- IA: ChatGPT | Modelo: GPT-6
- Especialidade/função: arquitetura de identidade e autorização; especificação independente
- Data: 2026-11-10
- Status: REVIEW_REQUIRED

## Objetivo
Definir autenticação e autorização futuras.

## Contribuição própria
Preferir OIDC Authorization Code + PKCE para desktop/web, access tokens curtos, refresh-token rotation, armazenamento no OS credential vault, revogação server-side e MFA/passkeys para ações sensíveis. API valida issuer/audience/signature/expiry/nonce; autorização combina tenant membership, project role e action grant, default deny. Sem API keys em frontend storage, prompts, SQLite ou logs. Desktop local continua utilizável sem login; cloud sync exige auth. Recovery, account deletion, device revoke e session rotation são fluxos de primeira classe. Não criar criptografia de senha própria.

## Arquivos examinados
Produto atual não apresenta identidade/auth cloud. Referências: permission matrix 010, secrets policy 045, security gate 050 e target architecture 095/096.

## Relação com trabalhos anteriores
Complementa 010/045/050. Nenhum relatório 097 anterior foi localizado.

## Testes executados
Não executado: OIDC, lifecycle de token, MFA, revogação ou authz tests.

## Problemas e limitações
IdP, jurisdição, MFA, suporte e recuperação ainda não escolhidos.

## Status próprio
REVIEW_REQUIRED — design apenas.

## Próximo passo
Escolher IdP e threat model; criar abuse cases para CSRF, token theft, replay, session fixation e IDOR.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
