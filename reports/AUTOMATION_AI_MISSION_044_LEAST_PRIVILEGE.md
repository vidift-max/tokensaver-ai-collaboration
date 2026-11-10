# Missão 044 — Least Privilege

**Identificação:** ChatGPT — GPT-6 | **Especialidade:** segurança de aplicações e arquitetura multiagente | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED — especificação documental, não controle implantado.

**Escopo:** análise estática/documental. Nenhum código do repositório principal foi alterado; nenhum secret foi acessado; nenhum teste dinâmico foi executado.

## Objetivo e contribuição própria
Converti a matriz de permissões 010 em perfis mínimos, ciclo de grant e regras de revogação para agentes, workers e tools. Nenhuma permissão foi provisionada.

## Matriz proposta
| Agente | Collaboration repo | Product repo | Tools | Secrets/admin | Merge/release |
|---|---|---|---|---|---|
| GPT-6 integrator | docs/issues conforme grant | read; write com grant explícito | plan/review | deny por padrão | aprovação separada |
| Claude editorial | read; relatório com grant | read-only | editorial sem publicação | deny | deny |
| Kimi auditor | read; findings com grant | read-only | testes sandbox | deny | deny |
| Automation AI | docs em paths allowlisted | read-only | tarefas pré-aprovadas, sem shell genérico | deny | deny |
| Human owner | conforme IAM/MFA | conforme branch protection | conforme função | secrets manager/admin | conforme processo humano |

## Regras
Default DENY; read/write separados; grant por missão/recurso/ação/path; tokens curtos; sem PAT pessoal compartilhado. Grant deve conter subject autenticado, provider, repo ID, branch/ref, commit SHA, operations, paths, environment, mission ID, approver, approval reference, not-before, expiry e revocation status. Revalidar antes de cada tool e persistência. Branch/commit drift exige reaprovação. Executor, validator, auditor e approver separados. Revogação deve cancelar novas chamadas e invalidar lease/fencing. IAM indisponível = deny.

## Evidência examinada
reports/AUTOMATION_AI_MISSION_010_AGENT_PERMISSIONS.md; CENTRAL.md; INSTRUCTIONS.md; src-tauri/src/lib.rs (SHA 2083acb1d685593928f35425beb1acd60043b5be). Não foram acessadas settings administrativas GitHub, IAM ou credenciais.

## Testes necessários
LP-01 cross-project; LP-02 path fora do escopo; LP-03 grant docs usado para code write; LP-04 branch alterada; LP-05 grant expirado/revogado; LP-06 self-approval; LP-07 Kimi merge; LP-08 secret request; LP-09 worker após revogação; LP-10 policy offline.

## Testes executados
Não executado: IAM, permission, grant ou revocation tests.

## Relação com trabalhos anteriores
Detalha a matriz 010 e alinha-se a PR gates 027 e adapters 031–040.

## Limitações/status
Matriz permanece proposta, não enforced. Tauri command exposure não equivale a autorização de agente. REVIEW_REQUIRED. Recomendo aprovação de GPT-6/owner e teste de revogação antes de qualquer write no produto. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.