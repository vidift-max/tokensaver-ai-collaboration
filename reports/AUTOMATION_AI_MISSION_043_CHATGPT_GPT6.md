# Missão 043 — Tool Injection | ChatGPT (GPT-6)

**Data:** 2026-11-10 | **Especialidade:** autorização de ferramentas | **Status:** REVIEW_REQUIRED

## Objetivo
Restringir operações perigosas executadas por agentes ou conteúdo externo.

## O que esta IA fez
Inspecionou a superfície Tauri IPC, o wrapper src/api.ts, o registry de agentes e as políticas de permissão. src-tauri/src/lib.rs registra 29 comandos via generate_handler!. O wrapper React invoca comandos nomeados explicitamente. Não foi encontrado processo shell nem dependência HTTP no Cargo.toml consultado; não há worker multiagente operacional demonstrado.

## Controles recomendados
- Allowlist de tool IDs e schemas de argumentos versionados no host.
- Autorizar cada chamada por identidade autenticada, mission_id/revision, agente, projeto, repo, branch, path, operação, risco, budget e expiração.
- Validar novamente no backend; nunca confiar em validação de UI ou output do modelo.
- Bloquear shell arbitrário, execução de script, URL livre, paths fora da allowlist, alteração de settings, secrets, merge, release e deploy.
- Exigir confirmação humana para operações destrutivas/externas e separar executor de approver.
- Registrar decisão allow/deny e correlation ID sem conteúdo sensível.

## Evidências
src-tauri/src/lib.rs (invoke_handler), src/api.ts (wrappers invoke), src-tauri/capabilities/default.json (core:default), reports/AUTOMATION_AI_MISSION_010_PERMISSION_MATRIX.md (default deny/grant separado), contracts/adapters/v1/README.md (capability não equivale a permissão).

## Testes
Não executados. Necessários: ferramenta desconhecida, parâmetros extras, path traversal, branch/repo divergente, grant expirado/revogado, spoof de aprovação, chamadas concorrentes e tentativa de self-approval.

## Limitações
A superfície Tauri é local e não foi demonstrado agente com acesso a tools. A ausência de política de grant por comando no material consultado não prova exploração remota atual. Nenhum código alterado.

## Recomendação
Implementar autorização host-side antes de conectar qualquer agente ou tool. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
