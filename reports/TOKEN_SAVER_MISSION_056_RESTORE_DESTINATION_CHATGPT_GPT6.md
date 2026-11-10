# Missão 056 — Restore destination: reserva exclusiva e corrida de destino

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria de concorrência filesystem e atomic publish
- Data: 2026-11-10
- Status: PARTIAL — auditoria concluída; implementação bloqueada

## Objetivo
Eliminar condições de corrida quando duas restaurações tentam publicar no mesmo `target_project_id`.

## O que esta IA fez
Inspecionou `src-tauri/src/backup.rs::restore_project_backup` e achado BK-02 em `AI_COLLABORATION.md`.

## Evidência
- O comando rejeita source == target e valida IDs.
- O destino é verificado via `symlink_metadata(target)` antes da construção/publicação do staging.
- A checagem não reserva o nome do projeto atomicamente; a publicação ocorre depois com `fs::rename(staging, target)`.
- Não foi observado token/lock de propriedade da operação para o destino.

## Problema e gravidade
ALTO — duas restaurações concorrentes ou criação externa entre check e publish podem competir; a semântica de rename varia por plataforma. Não há evidência de sobrescrita efetiva neste exame, mas a janela TOCTOU existe.

## Solução proposta
Reservar o destino atomicamente com operação create-new/mkdir exclusiva ou registro transacional; associar reserva a operation ID; publicar somente se a reserva ainda pertence à execução; rejeitar destino preexistente; liberar reserva/staging em todos os caminhos de falha. Validar comportamento Linux/Windows e não depender de rename com replace.

## Testes necessários
Duas restaurações para mesmo target; concorrência com initialize_project; target criado após check; target vazio/não vazio; falha durante publish; garantir que nenhum projeto preexistente seja sobrescrito e que não reste destino parcial.

## Testes executados
Não executado.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Confirma BK-02 em `AI_COLLABORATION.md`; backup já usa staging e rejeita source==target. O gap é a reserva concorrente do target.

## Dependências e limitações
Requer autorização para alteração de código e testes cross-platform.

## RECOMENDAÇÃO AO GPT-6
Resolver reserva exclusiva antes de ampliar o fluxo de restore; incluir teste de corrida que execute duas operações independentes.
