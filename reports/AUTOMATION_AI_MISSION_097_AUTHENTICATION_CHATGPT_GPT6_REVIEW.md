# Missão 097 — Revisão independente: Authentication

- IA: ChatGPT — GPT-6 | Data: 2026-11-10 | Status próprio: REVIEW_REQUIRED
- Produto principal read-only, HEAD `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.

## O que esta IA fez
Leu relatório 097, permission matrix 010, security gate 050 e arquitetura 095/096. Confirma ausência de auth SaaS na Foundation desktop e valida OIDC Authorization Code + PKCE, tokens curtos, revogação, MFA e default deny como direção segura.

## Complementos
- Desktop nativo: usar system browser + PKCE; guardar refresh token somente em OS credential vault; não embutir client secret em binário desktop.
- Web: cookies Secure/HttpOnly/SameSite, CSRF defense e CSP; evitar tokens em localStorage.
- Validar issuer/audience/algorithms/kid/expiry/nonce/state e rotação de chaves; pinning manual de signing key não substitui JWKS rotation.
- Autorização deve ocorrer em cada API, IPC sensível e worker; cache de autorização invalidado em role/session revoke.
- Separar user identity, service/workload identity e agent identity; agente recebe capability token com audience, action, project/tenant, TTL e request binding.
- Account recovery, device revoke, session revoke, invite, deletion/export e ownership transfer exigem abuse-case review.

## Testes/limites
Nenhum IdP, OIDC, passkey, vault ou penetration test executado; nenhum secret/config alterado. O relatório original permanece intacto.

## Próximo passo
Aprovar threat model e UX de recovery; escolher IdP após requisitos de região, residência, suporte e custo. Exigir negative authorization tests antes de habilitar cloud.
