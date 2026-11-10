# Missão 054 — OneShot Capture: filesystem, crash recovery e concorrência

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria de filesystem e persistência content-addressed
- Data: 2026-11-10
- Status: PARTIAL — auditoria concluída; implementação bloqueada

## Objetivo
Endurecer captura de conteúdo contra symlinks, falhas intermediárias e gravações concorrentes.

## O que esta IA fez
Inspecionou `src-tauri/src/advanced.rs::oneshot_capture`, `src-tauri/src/lib.rs::ensure_blob_with_status`, `db.rs` e os achados BLOB-01/ISO-01 em `AI_COLLABORATION.md`.

## Evidência
- OneShot verifica blob existente com `blob.exists()`, `fs::metadata()` e `fs::read()`; essas operações seguem symlinks.
- Usa fluxo próprio de temporário `.oneshot-*.tmp` + rename.
- O helper comum `ensure_blob_with_status()` em `lib.rs` já usa `symlink_metadata`, valida tipo, tamanho e SHA-256, e trata colisão de gravação.
- A captura grava blob antes da transação SQLite e faz limpeza compensatória se falhar; esse caminho precisa ser testado em crash e concorrência.
- Não foi demonstrada recuperação de temporários órfãos após encerramento abrupto.

## Problema e gravidade
ALTO — OneShot não reutiliza o helper seguro existente; risco de seguir symlink e de inconsistência em falhas/corridas.

## Solução proposta
Unificar criação/verificação de blob num helper único; usar criação exclusiva e validação de symlink/hash/tamanho; tornar publicação e referência DB recuperáveis. Definir política de temporários órfãos sem GC automático de blobs referenciados. Não remover blobs enquanto referência concorrente não estiver excluída.

## Testes necessários
Blob válido/corrompido; symlink válido/quebrado; dois escritores simultâneos com mesmo hash; falha após blob e antes do commit; crash em cada fase; limpeza de temp; nunca ler/escrever fora da raiz.

## Testes executados
Não executado. Nenhum teste de filesystem/crash foi executado.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Confirma BLOB-01 e ressalva de blob helper em `AI_COLLABORATION.md`: importação usa helper mais forte; o problema específico é OneShot.

## Dependências e limitações
Requer autorização para alteração no repositório principal e testes multiplataforma.

## RECOMENDAÇÃO AO GPT-6
Reutilizar o helper validado em importação e desenhar o protocolo de recuperação antes de refatorar a captura.
