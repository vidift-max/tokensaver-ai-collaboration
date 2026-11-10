# WAVE 001 — Missão 056: Restore Destination — publicação sem corrida

## Identificação
- Nome da IA: ChatGPT
- Modelo: GPT-6 (OpenAI)
- Especialidade: Rust, filesystem multiplataforma e publicação atômica
- Função: proposta técnica independente pós-auditoria; somente leitura
- Data: 2026-11-10
- Status: PROPOSTA PRONTA PARA APROVAÇÃO

## Objetivo
Garantir que a restauração nunca substitua um projeto que tenha sido criado depois da validação inicial do destino, inclusive sob duas restaurações concorrentes.

## Análise do problema atual
O restore valida `target` com `symlink_metadata`, cria staging como diretório irmão e, depois de copiar blobs/DB e remapear o banco, publica com `fs::rename(stage,target)`. Não existe claim/reserva de propriedade do target ID. O intervalo entre check e rename permite que outra operação crie o destino. O resultado do rename quando o destino existe varia entre sistemas de arquivos/SO; não se deve inferir semântica no-replace uniforme de `std::fs::rename`.

O código já tem staging, validações de backup, rollback SQLite e cleanup em falha. O gap específico é a exclusividade do destino e a atomicidade no publish.

## Evidências no código
- `src-tauri/src/backup.rs::restore_project_backup`: check `symlink_metadata(&target)`, staging `.restore-<uuid>.tmp`, publish via `fs::rename(&stage,&target)`.
- `src-tauri/src/lib.rs::initialize_project`: usa `create_dir_all(root/blobs)` e `db::open`, podendo competir pelo mesmo ID.
- `db::open` cria diretório pai e abre/cria o arquivo SQLite.
- HEAD consultado: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.

## Solução proposta
1. Criar helper único `publish_project_dir_noreplace(stage,target)` com implementação específica por plataforma, baseada em operação atômica que falha se target existir. Não usar check-then-rename.
2. Linux: usar `renameat2(..., RENAME_NOREPLACE)` quando suportado; tratar `ENOSYS/EINVAL` com fallback fail-closed, nunca com rename substitutivo.
3. Windows: usar operação MoveFile/MoveFileEx sem flag de replace e validar erro de destino existente; garantir staging e target no mesmo volume. Considerar flush/WRITE_THROUGH conforme contrato de durabilidade.
4. macOS/Unix sem renameat2: usar primitiva nativa equivalente de rename exclusivo (por exemplo renamex_np com RENAME_EXCL) ou fallback de criação exclusiva e publicação com protocolo comprovadamente no-replace; não presumir que `std::fs::rename` resolve.
5. Aplicar o mesmo mecanismo de claim a `initialize_project`: criação do root deve ser exclusiva e não criar DB dentro de diretório que surgiu por corrida. Operações idempotentes precisam distinguir projeto já inicializado de diretório reservado/incompleto.
6. Identificar operação com UUID; staging deve conter marker interno de operação e estado. Cleanup só remove staging/claim cujo identificador corresponda à operação atual.
7. Se a plataforma não oferecer operação segura, falhar com erro de recurso não suportado; não degradar para overwrite.
8. Manter staging no mesmo filesystem do destino para que a publicação seja atômica.
9. Para evitar corrida entre duas operações do próprio app, adicionar lock por target ID; esse lock melhora coordenação, mas não substitui a operação nativa no-replace contra outros processos.

## Arquivos envolvidos
- `src-tauri/src/backup.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/Cargo.toml` se forem necessárias bindings/crates de chamadas nativas
- `src-tauri/src/tests.rs` e/ou testes em `backup.rs`

## Funções/módulos envolvidos
- `backup::restore_project_backup`
- novo helper de publicação no-replace
- `initialize_project`
- novo helper compartilhado de reserva/claim de project ID
- cleanup de staging e marker

## Invariantes de segurança
- Target existente nunca é substituído, truncado ou removido.
- Exatamente uma operação pode publicar um dado target ID.
- Publish é uma única operação atômica no filesystem.
- Staging é irmão do destino e permanece no mesmo volume.
- Cleanup só remove artefatos criados e identificados pela operação atual.
- Se publish falhar, nenhum projeto parcial aparece como válido.
- Não confiar em verificação prévia de existência como exclusão mútua.
- Falta de suporte a no-replace resulta em falha segura, não overwrite.

## Riscos de regressão
- Implementação nativa requer bindings e manutenção Linux/Windows/macOS.
- Comportamento de rename e códigos de erro variam por plataforma/filesystem.
- `initialize_project` pode mudar comportamento idempotente se projeto já existir ou estiver parcialmente inicializado.
- Locks em arquivo podem ficar stale se forem implementados como create-new simples; preferir lock advisory liberado pelo SO ou usar UUID/lease com recuperação segura.
- Um fallback inadequado pode reintroduzir a corrida.

## Dependências
- Missão 063: handles e verificação de filesystem, principalmente symlink/junction/reparse e troca de componentes.
- Missão 055: budgets e validação do conteúdo antes do publish.
- Testes em Linux e Windows; macOS se for plataforma suportada.
- Revisão de dependência nativa/crate e autorização do integrador.

## Testes necessários
### Unitários
- helper no-replace em diretório ausente e existente.
- destino como arquivo, diretório vazio, diretório não vazio e symlink.
- cleanup com operation ID correto e incorreto.

### Integração/concorrência
- Duas restaurações independentes para mesmo target: exatamente uma publica, outra retorna TARGET_EXISTS; nunca sobrescreve.
- `initialize_project` concorrente com restore para o mesmo ID.
- Criar target no último instante antes do publish; publish deve falhar sem alterar target.
- Falha durante cópia, hash, transação SQLite e publish; nenhum target parcial.
- Repetir com múltiplos processos, não somente threads.

### Estresse/plataforma
- Corridas repetidas (centenas/milhares) em Linux e Windows; macOS quando suportado.
- Simular crash entre staging, claim e publish; recuperação não remove diretório que não pertence à operação.
- Verificar mesma unidade/filesystem e comportamento com antivírus/handles abertos no Windows.

## Critérios objetivos de aceite
1. Nenhum caminho de código usa check-then-`fs::rename` como garantia de exclusividade.
2. Duas operações simultâneas não podem publicar o mesmo target.
3. Projeto existente permanece byte-a-byte intacto após tentativa concorrente.
4. `initialize_project` participa do mesmo protocolo de claim/publicação.
5. Falha/crash deixa apenas staging recuperável, nunca projeto parcialmente válido.
6. Testes de corrida passam em Linux e Windows e demonstram no-replace real.
7. Fallback sem suporte é fail-closed.

## Limitações
- Não foi executado teste cross-platform nem experimento de rename nesta proposta.
- A primitiva nativa exata deve ser validada com as versões de SO/filesystem suportadas.
- A proposta não afirma que o código atual já sobrescreve de forma explorável; identifica a janela TOCTOU e semântica não uniforme.

## Testes executados
**TESTE NÃO EXECUTADO.** Somente inspeção estática.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- arquivo: `src-tauri/src/backup.rs`; função: `restore_project_backup`; mudança: substituir check-then-rename por publish no-replace; teste: duas restaurações para mesmo target; risco: diferença de semântica entre OS.
- arquivo: `src-tauri/src/lib.rs`; função: `initialize_project`; mudança: usar protocolo compartilhado de criação exclusiva do project ID; teste: initialize vs restore concorrentes; risco: quebrar idempotência atual.
- arquivo: `src-tauri/src/project_fs.rs` (novo, proposto); função: `publish_project_dir_noreplace` e `claim_project_id`; mudança: encapsular primitivas por plataforma e lock por ID; teste: testes nativos Linux/Windows/macOS; risco: bindings/dependências.
- arquivo: `src-tauri/Cargo.toml`; módulo: dependências nativas; mudança: adicionar crate/bindings somente após confirmar suporte e licença; teste: build cross-platform; risco: build/linking.
- arquivo: `src-tauri/src/backup.rs`; função: cleanup do staging; mudança: apagar apenas staging com operation ID próprio; teste: crash/recovery e claim alheio; risco: resíduos temporários.
