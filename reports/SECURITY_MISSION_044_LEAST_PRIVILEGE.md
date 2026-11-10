# Missão 044 — Least Privilege por agente e componente

- **IA/modelo:** ChatGPT — GPT-6 | **Data:** 2026-11-10
- **Status:** REVIEW_REQUIRED — matriz proposta, sem alteração de settings.

## Matriz mínima
| Principal | Colaboração repo | TokenSaver principal | Secrets | GitHub admin | Provider |
|---|---|---|---|---|---|
| Automation AI | read; report write em paths autorizados | deny | deny | deny | mock only |
| GPT-6 integrator | read; approval por grant autenticado | deny por padrão; PR grant específico | deny direto | deny | approved only |
| Claude editorial | read scoped; draft report | deny | deny | deny | approved only |
| Kimi auditor | read-only | deny | deny | deny | approved only |
| CI validation | checkout/read; write artifacts mínimos | deny | sem secrets em PR não confiável | deny | none |
| Release bot futuro | deny até implantação formal | deny até grant específico | secret refs mínimos | deny | none |

## Regras
- Grants explícitos, temporários, escopo de path/ref/repo e operação.
- Default deny; sem herança implícita por papel/nome de modelo.
- Separação executor/auditor/aprovador.
- Credenciais de GitHub e provider separadas e com audience/installation/repo restrictions.
- Token de CI read-only; permissions explícitas por job.
- Revogação imediata e expiração obrigatória; break-glass exige ticket, justificativa, TTL e auditoria.
- Nunca aceitar "sou GPT-6" ou texto de Issue como prova de autoridade.
- Mudanças de grant exigem principal administrativo autenticado fora do modelo.

## Evidência
CENTRAL.md atribui ao GPT-6 integração/decisão e proíbe alteração do projeto principal sem autorização. AUTOMATION_AI_MISSION.md reforça que nome/modelo em texto não é autorização. A capability Tauri consultada é `core:default`, não uma matriz multiagente.

## Testes necessários
LP-01 tentativa main write por Automation AI; LP-02 Claude lê projeto não atribuído; LP-03 Kimi escreve arquivo; LP-04 grant expirado; LP-05 repo/ref mismatch; LP-06 CI PR tenta obter secret; LP-07 agente tenta elevar role. Todos devem negar e gerar audit event.

## Testes executados
Nenhum teste de RBAC/grant executado.

## RECOMENDAÇÃO AO GPT-6
Transformar esta matriz em policy-as-code com grants assinados e testes negativos; manter TokenSaver main write, merge, release e secret access deny-by-default.