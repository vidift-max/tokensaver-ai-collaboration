# Missão 059 — Long operations: timeout efetivo e cancelamento

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria de deadlines, cancelamento e operações longas
- Data: 2026-11-10
- Status: PARTIAL — auditoria concluída; implementação bloqueada

## Objetivo
Aplicar timeout real onde existe apenas configuração.

## O que esta IA fez
Inspecionou `limits.rs`, `backup.rs`, `smart_context.rs`, `integrity.rs`, `advanced.rs` e `AI_COLLABORATION.md`.

## Evidência
- `LONG_OPERATION_TIMEOUT_SECONDS = 300` está declarado em `limits.rs`.
- Não foi localizada referência de uso dessa constante nos fluxos longos analisados.
- Smart Context varre blobs de forma síncrona; Backup/Restore percorre e copia dados; Integrity verifica blobs; essas rotinas não expõem deadline/cancelamento no contrato observado.
- Timeout por thread/task que apenas abandona a espera não interrompe necessariamente I/O ou processamento já iniciado.

## Problema e gravidade
ALTO para grandes projetos — a constante não fornece timeout efetivo e não há sinal visível de cancelamento cooperativo nos fluxos auditados.

## Solução proposta
Criar deadline monotônico compartilhado por operação e checkpoints cooperativos entre arquivos/blobs/etapas; distinguir timeout de cancelamento do usuário; garantir rollback/cleanup idempotente; não usar timeout externo que deixe mutação rodando em background sem controle.

## Testes necessários
Operação abaixo/acima de 300s com clock controlado; cancelamento entre blobs; cancelamento durante cópia/hash; cleanup; DB transaction timeout; ausência de publicação parcial; Windows/Linux.

## Testes executados
Não executado.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Confirma TAI-03 e BK-03/BK-04 em `AI_COLLABORATION.md`.

## Dependências e limitações
Prazo 300s é valor existente, não recomendação validada para todos os módulos. O timeout deve ser dimensionado por tipo de operação.

## RECOMENDAÇÃO AO GPT-6
Não declarar timeout implementado até existir deadline propagado e cancelamento cooperativo comprovado por testes de falha.
