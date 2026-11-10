# Missão 044 — Least Privilege | ChatGPT (GPT-6)

**Data:** 2026-11-10 | **Especialidade:** IAM e isolamento | **Status:** REVIEW_REQUIRED

## Objetivo
Definir menor privilégio por agente, operação, repositório, ambiente e dado.

## O que esta IA fez
Comparou a matriz 010, o provider registry draft e as permissões visíveis no Tauri/CI. Os quatro agentes do registry estão enabled=false, manual_assisted e not_connected. O registry não é autoridade de autorização. O workflow CI não declara permissions por job. A capability Tauri default.json contém core:default.

## Matriz recomendada
- UI desktop: somente comandos necessários ao fluxo visível; nenhuma credencial de provider embutida.
- Agentes de análise: read-only, dados internal no máximo, sem escrita, sem secrets e sem aprovação.
- Auditor independente: read-only no snapshot imutável; sem alterar artefato auditado.
- Automation AI: escrita documental apenas em paths allowlisted da branch de colaboração, por grant temporário.
- Worker mock: fixtures sintéticas, sem rede e sem credenciais.
- GitHub App: permissões por endpoint/repositório; Contents read padrão; Issues/PR/Actions write desabilitados até aprovação.
- Main write, merge, release e deploy: grants distintos, owner approval e checks obrigatórios.

Grant deve incluir issuer/approver autenticados, missão/revisão, repository_id, ref, paths, operations, not_before/expiry, budgets, required checks e revocation status.

## Evidências
reports/AUTOMATION_AI_MISSION_010_PERMISSION_MATRIX.md; contracts/adapters/v1/README.md; provider-registry.json; src-tauri/capabilities/default.json; .github/workflows/ci.yml.

## Testes
Não executados. Necessários testes allow/deny por papel, grant revogado/expirado, escopo alterado, branch/path indevido, self-approval e token com scope excedente.

## Limitações
Não foi possível ler GitHub App installation scopes, branch protection ou secrets. Nenhum grant runtime foi provisionado.

## Recomendação
Aprovar default-deny e implementar enforcement no serviço antes de habilitar agents. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
