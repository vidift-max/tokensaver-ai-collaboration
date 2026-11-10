# Missão 027 — PR gates e proteção de merge

**Responsável:** Automation AI | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED

## Objetivo
Definir controles para impedir merge de alterações sem revisão, checks e autorização.

## Política mínima
- Branch principal protegida; exigir PR para alterações.
- Exigir checks nomeados e atualizados para o SHA mais recente.
- Exigir uma aprovação de pessoa/identidade integradora diferente do autor do PR.
- CODEOWNERS para `.github/workflows/**`, `contracts/**`, `src-tauri/**`, `src/**`, `database/**` e políticas de segurança.
- Invalidar aprovações após novos commits relevantes (dismiss stale reviews).
- Exigir conversa resolvida; restringir force-push e deleção de branch.
- Administradores não devem contornar proteção no fluxo normal; bypass excepcional deve ser registrado como ADR/incident.
- GitHub Actions tokens com `contents: read` por padrão; nenhuma permissão de merge ao worker.
- Não habilitar auto-merge nesta fase.

## Separação de funções
Executor prepara PR; CI valida; revisor independente examina; GPT-6/owner aprova; humano autorizado realiza merge. Nenhum agente aprova o próprio patch ou altera required checks para liberar sua própria mudança.

## Gatilhos bloqueantes
Check falho/ausente; review changes requested; evidência ausente; schema incompatível; grant expirado; arquivo fora do escopo; segredo detectado; origem de workflow não confiável.

## Critérios de aceite
Proteção configurada apenas após decisão owner; regras verificadas na branch; bypass auditável; CODEOWNERS cobre áreas sensíveis; teste negativo demonstra bloqueio.

## Testes requeridos
PR sem check, sem review, review stale, commit posterior, force push, actor sem permissão, arquivo sensível sem owner e tentativa de self-approval.

## Limites
Nenhuma regra de branch, CODEOWNERS ou PR foi criada/alterada. A Missão 010 mantém PR write e merge desabilitados no MVP.

## Recomendação ao GPT-6
Manter merge manual e desabilitado para agentes; preparar branch protection no projeto principal somente após aprovação explícita e validação dos checks existentes.