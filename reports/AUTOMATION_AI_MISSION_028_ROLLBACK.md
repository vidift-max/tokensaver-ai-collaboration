# Missão 028 — Rollback e recuperação de mudanças automatizadas

**Responsável:** Automation AI | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED

## Princípios
Rollback é uma nova mudança auditável, não apagar histórico nem fazer reset/force-push. Priorizar revert de commit/PR; restaurar artefatos/dados por procedimento versionado e testado. Separar rollback de código, configuração, schema e estado operacional.

## Matriz de resposta
- PR ainda aberto: fechar/reverter branch ou corrigir commit; preservar logs e evidências.
- Commit integrado: criar revert commit, validar checks e exigir aprovação.
- Configuração: restaurar versão anterior assinada/versionada; registrar diff e aprovador.
- Migração de banco: preferir migração forward-fix; restore exige backup consistente, janela de indisponibilidade e plano de perda de dados aprovado.
- Artefato: reverter ponteiro para versão anterior; nunca substituir silenciosamente objeto imutável.
- Evento/Issue: compensar por nova transição/reconciliação; não apagar evento histórico.

## Runbook
1. Detectar incidente e congelar novas execuções afetadas.
2. Capturar mission_id, revision, run_id, commit SHA, event/delivery IDs e evidências.
3. Avaliar blast radius e escolher compensação.
4. Obter autorização do owner/GPT-6; validar grant e escopo.
5. Executar rollback em ambiente isolado.
6. Rodar checks e smoke tests.
7. Verificar estado funcional e reconciliação.
8. Reabrir fila gradualmente; documentar causa raiz, tempo e dados afetados.

## Salvaguardas
- Kill switch revoga dispatch/worker sem destruir registros.
- Idempotência de rollback e prevenção de rollback duplicado.
- Nunca expor secrets no relatório.
- Não usar `git reset --hard`, force push ou delete de branch como rollback automatizado.
- Dados irreversíveis exigem compensação e aprovação humana.

## Critérios de aceite
Runbook por tipo de mudança; dono/aprovador definido; snapshot pré-mudança; rollback idempotente; validação pós-rollback; evidência e plano de comunicação.

## Testes requeridos
Revert de commit em branch de teste, falha parcial, rollback duplicado, migração não reversível, evento em processamento e restore a partir de backup validado.

## Limites
Nenhum rollback executado; nenhum commit ou configuração foi alterado.

## Recomendação ao GPT-6
Antes de automatizar qualquer escrita, provar rollback em branch sandbox com dados sintéticos e manter operação manual até aprovação.