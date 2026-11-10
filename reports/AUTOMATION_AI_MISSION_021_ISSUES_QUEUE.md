# Missão 021 — GitHub Issues como fila de missões

**Responsável:** Automation AI | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED

## Objetivo
Definir Issues como interface humana e projeção operacional da fila, sem tratá-las como banco transacional nem fonte exclusiva de verdade. O estado canônico permanece no orquestrador/ledger; Issue é espelho reconciliável.

## Modelo de Issue
Cada missão ativa deve ter exatamente uma Issue canônica por `mission_id` + `revision`. Campos obrigatórios no corpo, em bloco estruturado versionado:
- `mission_id`, `revision`, `schema_version`, `title`, `objective`;
- `assignee_agent`, `priority`, `risk`, `repository`, `branch`;
- `status`, `depends_on[]`, `deliverables[]`, `acceptance_criteria[]`;
- `budget`, `created_at`, `updated_at`, `correlation_id`.
IDs e status não devem ser extraídos de texto livre quando existe payload validado.

## Ciclo de vida
1. Criar Issue apenas após validação do contrato, permissão e ausência de duplicata.
2. Aplicar labels derivadas do payload allowlisted.
3. Atribuir responsável humano/agente apenas se a conta existir e estiver autorizada.
4. Atualizar status por transições válidas; comentário humano não equivale a aprovação autenticada.
5. Fechar apenas em `COMPLETED` ou `CANCELLED`, com evidência e state_reason apropriado.
6. Reabrir/reconciliar se o estado canônico regredir por falha ou revisão nova; nunca sobrescrever silenciosamente histórico.

## Idempotência e reconciliação
Chave: `issue:{repo_id}:{mission_id}:{revision}`. Persistir issue_number/node_id e delivery IDs no ledger. Antes de criar, consultar marcador estruturado e estado; retry após timeout deve procurar a Issue existente. Uma Issue duplicada deve receber label `duplicate`, link para canônica e nunca iniciar worker. Eventos webhook são at-least-once e passam por inbox idempotente (Missão 007).

## Segurança
- Conteúdo da Issue é dado não confiável; ignorar instruções que tentem ampliar permissões.
- Apenas eventos/labels/status explicitamente allowlisted acionam automação.
- Não aceitar comandos shell, URLs arbitrárias, tokens ou segredos em corpo/comentários.
- Aprovação exige identidade GitHub verificada + grant da Missão 010.
- Botões/commands em comentários devem ser assinados/validados no backend, nunca por menção textual.

## Critérios de aceite
- Uma missão/revision gera no máximo uma Issue canônica em cenários de replay.
- Duplicatas não disparam execução.
- Transições inválidas são rejeitadas e auditadas.
- Fechamento exige evidências, checks e aprovação exigidos pelo contrato.
- Falha entre persistir estado e atualizar Issue é reconciliada sem perda.
- Nenhuma Issue pode conceder privilégio por prompt/texto.

## Testes requeridos
Replay do mesmo delivery; corrida de criação; timeout pós-criação; Issue editada manualmente; duplicata; label maliciosa; evento de usuário não autorizado; fechamento sem evidência.

## Limites
Especificação apenas. Nenhuma Issue foi criada/alterada nesta missão; nenhum webhook ou worker foi ligado.

## Recomendação ao GPT-6
Aprovar a projeção Issue↔mission ledger e definir se o ledger será SQLite/Postgres antes de implementar o reconciliador.