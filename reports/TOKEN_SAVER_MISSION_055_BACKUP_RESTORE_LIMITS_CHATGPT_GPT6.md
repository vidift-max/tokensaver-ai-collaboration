# Missão 055 — Backup Restore: limites de recursos e manifesto

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria de backup/restore e resource bounds
- Data: 2026-11-10
- Status: PARTIAL — auditoria concluída; implementação bloqueada

## Objetivo
Adicionar limites explícitos a manifesto, banco, blobs, contagem e bytes totais antes de restaurar.

## O que esta IA fez
Inspecionou `src-tauri/src/backup.rs`, `limits.rs`, `db.rs` e achado BK-01 em `AI_COLLABORATION.md`.

## Evidência
- Restore verifica symlink/tipo do manifesto e depois usa `fs::read(manifest_path)` antes de desserializar; não há limite prévio de bytes visível.
- O manifesto contém vetor de blobs; os metadados de cada blob são validados, e o código já valida hashes, caminhos, integridade SQLite e foreign keys.
- Não foi localizado budget explícito agregado para quantidade de blobs, bytes totais, tamanho do DB ou duração do restore.
- A criação de backup também enumera e copia blobs sem uma política global de quota explícita neste módulo.

## Problema e gravidade
ALTO — backup local excessivo ou malformado pode provocar consumo desproporcional de memória, disco e CPU. Não é correto afirmar ausência de validação de integridade: essas verificações já existem.

## Solução proposta
Definir MAX_MANIFEST_BYTES, MAX_BACKUP_BLOBS, MAX_BACKUP_DB_BYTES, MAX_BACKUP_BLOB_BYTES e MAX_BACKUP_TOTAL_BYTES; ler manifesto com limite + 1; validar consistência aritmética/overflow e limites reais de arquivo antes de staging/cópia. Verificar espaço disponível quando viável. Aplicar política simétrica e documentada a criação e restore.

## Testes necessários
Manifesto no limite/limite+1; vetor máximo/máximo+1; blob e DB excessivos; soma acima do budget; overflow; disco insuficiente; falha de cópia e cleanup do staging.

## Testes executados
Não executado.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Confirma BK-01 em `AI_COLLABORATION.md`; preserva o fato de que versão do manifesto, hashes, integridade SQLite, foreign keys e staging já são verificados.

## Dependências e limitações
Definição de quotas afeta compatibilidade e precisa de decisão do GPT-6/owner. Nenhum restore foi executado.

## RECOMENDAÇÃO AO GPT-6
Definir limites de recursos compatíveis com o formato atual e exigir validação de tamanho real antes de qualquer alocação/cópia.
