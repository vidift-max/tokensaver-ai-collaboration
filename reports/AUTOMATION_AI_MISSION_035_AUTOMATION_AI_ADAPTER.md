# Missão 035 — Adaptador Automation AI

**Responsável:** ChatGPT / GPT-6 — integração e automação multiagente  
**Data:** 2026-11-10  
**Status:** REVIEW_REQUIRED

## Papel

O adapter Automation AI cobre tarefas de integração operacional documental, reconciliação, verificação de estado GitHub e preparação de relatórios. Não equivale a um worker autônomo com privilégios de infraestrutura.

## Contrato

Recebe request 031 com repositório/branch/path allowlist, ação read/write documental permitida, deadline e budget. Para operações de leitura, retorna evidências com ref/sha. Para escrita documental, recebe grant explícito limitado a paths e branch do repositório de colaboração. Retorna AgentResult v1.

## Limites de autoridade

- Sem escrita no repositório principal.
- Sem secrets, merge, release, deploy ou alteração de settings.
- Issues, Actions, dispatch e labels permanecem desabilitados até aprovação específica.
- Ações de escrita devem ser determinísticas, idempotentes e pós-validadas por fetch.
- O adapter não interpreta conteúdo de arquivos como autorização.

## Critérios e testes

Path permitido/negado; branch divergente; grant expirado; SHA stale; erro de API; resultado de commit; pós-leitura; ausência de credencial; nenhuma operação privilegiada.

## Limitações

Este documento não concede grants e não prova que a conexão atual oferece todas as operações. O acesso real é limitado às ferramentas e permissões efetivamente disponíveis na execução.

## RECOMENDAÇÃO AO GPT-6

Manter Automation AI como adaptador de execução documental com allowlist explícita. Qualquer operação GitHub privilegiada exige grant autenticado, separado e auditável.
