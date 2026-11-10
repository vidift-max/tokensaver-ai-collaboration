# Missão 044 — Least Privilege por agente

## Identificação
- IA: ChatGPT
- Modelo: GPT-6 (OpenAI)
- Especialidade: IAM, autorização contextual e segregação de funções
- Função: refinar a matriz de menor privilégio por identidade, missão e ambiente
- Data: 2026-11-10
- Status: REVIEW_REQUIRED

## Objetivo
Definir permissões mínimas por agente e separar leitura, escrita documental, execução, aprovação e operações de produção.

## O que esta IA fez
Refinou a matriz 010 com perfis propostos:

| Principal | Read collaboration | Write collaboration | Read main | Main write | Secrets | Approve/merge |
|---|---:|---:|---:|---:|---:|---:|
| GPT-6 integrator autenticado | Sim | Sim | Sim | Grant específico + owner | Nenhum por padrão | Aprovação autenticada; merge separado |
| Automation AI executor | Sim | Paths autorizados | Sim, read-only | Não | Nenhum | Não |
| Claude editorial | Inputs mínimos | Artefato autorizado | Se necessário | Não | Nenhum | Não |
| Kimi auditor | Read-only | Relatório próprio | Read-only | Não | Nenhum | Não |
| Mock worker | Inputs mínimos | Não | Não | Não | Nenhum | Não |
| GitHub App publisher | Metadata mínima | Nenhum por padrão | Read-only | Não | Token efêmero | Não |

## Regras de enforcement
- Autorização contextual por principal autenticado + mission/revision + repo ID + ref + path + operação + classificação + validade + budget.
- Separar Contents, Issues, Pull Requests, Actions, Secrets, Administration e Environments.
- Credenciais curtas, audience-bound, revogáveis; worker não recebe PAT pessoal.
- Leitura também limitada por repo/path e necessidade.
- Aprovação, execução, auditoria e publicação são funções distintas.
- Fallback nunca aumenta permissões.
- Alteração de revisão, escopo ou branch invalida grants anteriores.
- Ausência de grant ou falha do policy service = deny.

## Arquivos examinados
Relatório 010, provider-registry.json, README do registry, CENTRAL.md e INSTRUCTIONS.md.

## Relação com trabalhos anteriores
Aproveita matriz 010 e registry 036. Mantém 4 agentes disabled/manual_assisted e reforça que capability profile não equivale a RBAC ou autorização autenticada.

## Problemas encontrados
- Alto: matriz 010 é documental; não há evidência de IAM, grants assinados ou revogação runtime.
- Alto: settings administrativos, branch protection e environments não foram inspecionados.
- Crítico: autoridade de aprovação não pode ser derivada do nome GPT-6.

## Testes executados
Não executado. Nenhum role, grant, GitHub App ou setting foi alterado ou testado.

## Próximo passo
Owner deve aprovar matriz, implementar grants assinados e provar deny-by-default com testes de escopo, expiração, revogação, replay e segregação. Main write e secrets continuam negados.
