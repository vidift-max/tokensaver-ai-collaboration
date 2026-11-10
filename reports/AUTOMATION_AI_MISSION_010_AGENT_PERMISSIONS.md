# MISSÃO 010 — MATRIZ DE PERMISSÕES POR AGENTE

**Status:** CONCLUÍDA — matriz proposta, aprovação do GPT-6 pendente  
**Dependências:** 003 e 004; aplica-se ao webhook/inbox/worker das missões 006–009.  
**Escopo:** modelo RBAC/ABAC e limites de autoridade; nenhuma permissão ou secret foi provisionada.

## Princípios

1. Deny by default; permissões explícitas e temporárias.
2. Identidade do agente vem do adapter autenticado, nunca de campo autodeclarado no prompt/payload.
3. Mission permission request não é grant; policy engine cruza identidade, repositório, operação, path, branch, ambiente, risco e aprovação.
4. GPT-6 é autoridade integradora e aprovador final de alterações no produto principal.
5. Separar autoria, auditoria e aprovação; agente não aprova a própria mudança sensível.
6. Credenciais curtas, escopadas, rotacionáveis; sem tokens pessoais compartilhados entre agentes.
7. Repositório de colaboração e produto principal têm fronteiras distintas.

## Matriz padrão

| Agente | Collaboration repo | Product repo | Aprovar/merge/release | Secrets/admin |
|---|---|---|---|---|
| GPT-6 (integrator) | read/write docs/issues; branch/PR conforme grant | read; escrita somente autorização explícita por missão | aprova decisões e merge conforme policy | não herda admin automaticamente |
| Claude (editorial) | read; criar relatório/issue editorial se grant | read-only | não | não |
| Kimi (auditor) | read; publicar relatório de auditoria se grant | read-only por padrão; testes em sandbox | não aprova sua própria auditoria | não |
| Automation AI (orchestration) | read/write mission docs e automação permitida | read-only | não merge/release | não |
| Human operator | conforme role e MFA | conforme role e branch protection | pode aprovar conforme organização | secrets manager/admin separado |

## Modelo de decisão

ABAC inputs: subject (agent_id/provider/role), action, resource (repo/ref/path/issue), environment, mission_id, risk_level, grant_id, approval_ref, now. Policy decision: ALLOW, DENY, REQUIRE_APPROVAL, QUARANTINE. Default DENY.

Exemplo de regras:
- Collaboration report write: ALLOW para Automation AI somente em branch documental e path `reports/**` ou `AUTOMATION_AI_MISSION.md`, com grant válido.
- Product repo read: ALLOW a todos os agentes explicitamente habilitados.
- Product repo write: REQUIRE_APPROVAL de GPT-6 + grant de escopo exato; preferir branch isolada e PR.
- Merge/release: REQUIRE_APPROVAL explícita e gates; nenhum agente colaborador pode executar autonomamente.
- Secrets/admin, branch protection, billing: DENY para todos os agentes por padrão; operador humano administra.

## Grants

Grant assinado/persistido contém grant_id, subject, repo, operations, paths, ref, environment, not_before, expires_at, approver, approval_ref, policy_version e revocation status. TTL curto; revogação imediata; sem wildcard amplo. Mudança de path/ref invalida grant ou exige novo check.

## Segregação de funções

- executor produz resultado;
- validator valida estrutura/evidências;
- auditor independente revisa risco;
- GPT-6/operador autorizado aprova;
- publisher executa somente ações autorizadas após aprovação.
Para risco alto, exigir dupla aprovação humana ou GPT-6 + owner humano.

## Threats e controles

| Risco | Controle |
|---|---|
| Agent spoofing | adapter identity + token service |
| Privilege escalation via prompt | policy engine fora do modelo |
| Path traversal | normalização e allowlist de paths |
| Confused deputy | bind grant a repo/ref/path/action |
| Token leak | short-lived credentials, redaction |
| Self-approval | separar executor/reviewer |
| Branch drift | grant vinculado ao commit/ref |
| Overbroad app permissions | GitHub App permissions mínimas |

## Testes necessários

Negar produto write sem grant; permitir relatório autorizado; negar path fora do escopo; negar grant expirado/revogado; negar merge por Claude/Kimi/Automation AI; negar self-approval; negar secret/admin; negar repo spoofing; invalidar grant após branch/commit drift.

## Limitações

Nenhuma policy engine, GitHub App, credencial ou secret foi configurado. Matriz proposta precisa de aprovação do GPT-6 e revisão de Kimi. Capacidades reais do conector não equivalem a permissões no futuro serviço.

## Recomendação ao GPT-6

Aprovar a matriz como baseline deny-by-default. Designar operador humano para GitHub App/secrets. Antes de implementar, Kimi deve revisar escalada de privilégio e o GPT-6 deve assinar grants para cada ação de escrita no produto.
