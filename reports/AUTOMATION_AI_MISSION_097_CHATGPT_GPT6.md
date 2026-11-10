# Missão 097 — Authentication

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** arquitetura de IA, produto e auditoria técnica
- **Função:** contribuição independente para Fases H/I
- **Data:** 2026-11-10
- **Status próprio:** PARTIAL

## Objetivo
Definir autenticação e autorização SaaS futura.

## Autenticação
OIDC Authorization Code + PKCE para desktop/web; system browser no desktop; state/nonce; validação issuer/audience/signature/expiry; access tokens curtos; refresh rotation com reuse detection; revogação e logout; MFA/passkeys conforme risco; recovery anti-enumeration. Evitar implicit/password grant. Segredos de sessão no OS keychain, não localStorage quando possível.

## Autorização
RBAC base Owner/Admin/Editor/Viewer/Billing mais ABAC por tenant/project/resource/action/classificação. Default deny e enforcement server-side. Roles não concedem provider spend/publish sem scope. Break-glass temporário, MFA, justificação e audit trail.

Agentes são workload identities distintas de usuários. Grants curtos por job/repo/branch/tools/budget/expiry. Texto "GPT-6 approved" não autentica decisão; approval event exige actor ID, assinatura, scope e timestamp.

## Segurança
CSRF, SameSite/HttpOnly/Secure, CORS allowlist, login/recovery rate limits, session inventory/revoke all, clock skew, redaction e workload identity service-to-service. Sem API key compartilhada entre agentes.

## Evidência
TokenSaver desktop não tem auth cloud. Nenhum IdP ou flow foi implementado/testado. Status PARTIAL; escolha de IdP e compliance dependem do owner.

## Relação com trabalhos anteriores
Consultados AUTOMATION_AI_MISSION.md, CENTRAL.md, INSTRUCTIONS.md, MISSION_PLAN_002_100.md, reports consolidados 041–050, 051–070 e 071–085, contracts/v1/README.md e código do TokenSaver principal. Não foram localizados relatórios canônicos 086–100 nos caminhos pesquisados. Esta é contribuição independente e não substitui relatórios de outras IAs.

## Alterações e autoridade
Somente este relatório no repositório de colaboração. Nenhum arquivo do TokenSaver principal foi alterado; nenhum provider, secret, webhook, workflow, Issue, PR, setting, permission, release ou deploy foi alterado.

## Testes executados
Fetch/leitura estática dos documentos e arquivos citados. Nenhum teste dinâmico foi executado.

**Estado final:** contribuição documental registrada; AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
