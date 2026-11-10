# Missão 029 — Auditoria Git: autor, agente, commit, missão e evidência

**Responsável:** Automation AI | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED

## Objetivo
Rastrear cada alteração até identidade autenticada, autorização, missão/revisão, execução e evidências.

## Registro obrigatório
Para cada commit/PR:
- `repository_id`, `branch`, `commit_sha`, `parent_sha`, `author_login`, `committer_login`;
- identidade do agente e provedor (não apenas nome informado em texto);
- `mission_id`, `revision`, `run_id`, `grant_id`;
- PR/Issue IDs, workflow run/job IDs, checks e review IDs;
- lista de paths, diffstat, hashes de artefatos, timestamps;
- resultado da política e identidade do aprovador.
Assinatura/verificação de commit deve ser registrada quando configurada; assinatura não substitui review.

## Controles
- Webhook push/PR com validação de assinatura e deduplicação.
- Capturar SHA imutável; não associar evidência apenas ao branch móvel.
- Comparar paths alterados com allowed_paths do grant.
- Rejeitar commits fora da missão, revisão, branch ou limite de diff.
- Correlacionar Issue ↔ mission ledger ↔ run ↔ commit ↔ artifact.
- Logs append-only com acesso restrito e retenção definida.
- Relatórios de auditoria não podem afirmar identidade a partir de nome do commit apenas.

## Detecção
Alertar commit sem missão, grant expirado, autor inesperado, branch não permitido, alteração de workflow/permissions, force-push, secrets alterados, artefato sem hash ou ausência de revisão.

## Critérios de aceite
É possível reconstruir quem/qual identidade realizou cada mudança, sob qual grant, em qual missão e com quais checks/evidências; commits órfãos são sinalizados; eventos são deduplicados.

## Testes requeridos
Commit sem mission_id, author/committer divergente, grant expirado, branch/path fora do escopo, force-push, SHA não relacionado a PR e artefato sem manifesto.

## Limites
Auditoria documental; nenhum commit do projeto principal foi alterado e não foi executado scan histórico completo.

## Recomendação ao GPT-6
Exigir correlation metadata em todo PR automatizado futuro e persistir auditoria fora do histórico mutável da Issue.