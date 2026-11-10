# TokenSaver AI — WAVE 001 — Proposta independente de implementação
## Missões 051, 052, 055, 056, 057 e 063

- **IA:** ChatGPT
- **Modelo:** GPT-6
- **Data:** 2026-11-10
- **Branch analisada:** `v2-saas-alpha`
- **Repositório analisado:** `vidift-max/tokensaver-ai`
- **Repositório deste relatório:** `vidift-max/tokensaver-ai-collaboration`
- **Escopo:** análise estática independente e proposta; nenhuma alteração no produto principal.
- **Status geral:** PROPOSTA PRONTA PARA APROVAÇÃO — sujeita à reconciliação do GPT-6 integrador. Não é implementação nem autorização de patch.

## 1. Método, fontes e limites da inspeção

Li `WAVE_001_IMPLEMENTATION_MISSIONS.md`, os seis relatórios anteriores das missões 051, 052, 055, 056, 057 e 063, e inspecionei os arquivos atuais da branch indicada.

### Evidências e versões dos arquivos principais

| Arquivo | Blob SHA observado |
|---|---|
| `src-tauri/src/smart_context.rs` | `4f60ad434a18526e2293d16f663eca1c47e60a7d` |
| `src-tauri/src/project_memory.rs` | `bfb33e442beb0f3ff94f6c80cefc201e36ca6f81` |
| `src-tauri/src/backup.rs` | `524674d95247407b507a0ad96a73531225ab6259` |
| `src-tauri/src/path_guard.rs` | obtido da branch `v2-saas-alpha` nesta inspeção |
| `src-tauri/src/limits.rs` | obtido da branch `v2-saas-alpha` nesta inspeção |
| `src-tauri/src/db.rs` | obtido da branch `v2-saas-alpha` nesta inspeção |
| `src-tauri/src/lib.rs` | obtido da branch `v2-saas-alpha` nesta inspeção |
| `src-tauri/src/file_center.rs` | `c789091698c11fb696253f421b98affc3296ac26` |
| `src-tauri/Cargo.toml` | `0c78d0f18997156b32d95d8d6546a36000d56be7` |

A análise foi feita por leitura do conteúdo atual do GitHub. Não tive checkout executável do projeto nesta etapa. Portanto, não afirmo que os testes abaixo passaram.

---

## 2. Missão 051 — Smart Context: orçamento agregado

### Status
**PROPOSTA PRONTA PARA APROVAÇÃO.** O fluxo atual não impõe budgets globais verificáveis para o trabalho total da consulta.

### Análise do problema atual

Em `smart_context()`, `max_files` limita somente o número de resultados depois de todos os registros serem percorridos e lidos. Para cada versão mais recente retornada pelo banco, o código canonicaliza o blob, chama `fs::read_to_string`, aloca outra cópia integral em lowercase, pontua o conteúdo e pode construir excerpt. Assim, `max_files=1` ainda pode provocar leitura e processamento de todos os blobs do projeto.

Não há limite agregado de:
- registros examinados;
- bytes lidos;
- bytes por blob;
- tempo total;
- custo de transformação/normalização;
- memória intermediária estimada.

O campo `byte_len` vem do banco e não é suficiente como proteção: deve ser validado contra metadados do arquivo aberto e o número efetivamente lido. O uso de `String::to_lowercase()` cria uma cópia proporcional ao conteúdo; `excerpt()` também aloca lowercase e vetor de chars. Uma deadline checada apenas entre arquivos não interrompe um único arquivo excessivamente grande.

### Evidências no código

- `src-tauri/src/smart_context.rs::smart_context`: SELECT sem LIMIT; iteração sobre todas as linhas; `fs::read_to_string`; lowercase integral; pontuação antes de `hits.truncate(limit)`.
- `src-tauri/src/smart_context.rs::excerpt`: cópia lowercase e vetor de caracteres para localizar e extrair trecho.
- `src-tauri/src/limits.rs`: há limites de importação e arquivo, mas não budgets próprios para Smart Context.
- `src-tauri/src/file_center.rs::verify_blob_integrity`: exemplo existente de leitura em blocos de 64 KiB, embora a função de integridade não seja diretamente reutilizável como mecanismo de orçamento.

### Solução proposta

1. Definir uma estrutura interna `SmartContextBudget` com limites configuráveis por constantes em `limits.rs`: máximo de registros examinados, bytes por blob, bytes totais lidos, duração total e bytes máximos de excerpt/saída.
2. Fazer a consulta SQL buscar no máximo `max_examined + 1` candidatos. A linha extra permite sinalizar truncamento sem varrer a tabela inteira. Se for necessário ranking global, documentar que o resultado é ranking do subconjunto determinístico, ou introduzir paginação com cursor e orçamento explícito; não alegar ranking global quando a busca for interrompida.
3. Substituir `fs::read_to_string` por leitura limitada em blocos a partir de um handle aberto. Recusar ou ignorar, com contador explícito, blob que ultrapasse `max_blob_bytes`; nunca alocar acima do orçamento.
4. Checar deadline e budget agregado antes de cada leitura e entre blocos. Para interromper leitura de arquivo grande, a leitura em blocos é necessária; deadline não pode ser verificada apenas no início do arquivo.
5. Validar `byte_len >= 0`, limite declarado e tamanho real do handle. Não confiar em tamanho do banco para reservar memória.
6. Reduzir alocações: tokenização/normalização incremental ou busca case-insensitive sem cópia integral quando tecnicamente viável; construir apenas excerpt limitado. Se a implementação mantiver lowercase temporário, contabilizar seu custo e limitar o tamanho do blob antes de alocar.
7. Retornar metadados de execução — por exemplo `truncated`, `files_examined`, `bytes_read` e `stop_reason` — sem alterar silenciosamente o contrato atual. Isso exige versão compatível do tipo retornado e atualização do frontend/TypeScript.
8. Ordenar hits de forma determinística por score descendente e logical_path ascendente; aplicar `max_results` separado de `max_examined`.

### Arquivos e funções envolvidos

- `src-tauri/src/limits.rs`: adicionar constantes `SMART_CONTEXT_MAX_FILES_SCANNED`, `SMART_CONTEXT_MAX_BYTES_PER_FILE`, `SMART_CONTEXT_MAX_TOTAL_BYTES`, `SMART_CONTEXT_TIMEOUT_MS` e `SMART_CONTEXT_MAX_EXCERPT_BYTES`.
- `src-tauri/src/smart_context.rs::smart_context`: orçamento, leitura limitada, interrupção e metadados de truncamento.
- `src-tauri/src/smart_context.rs::excerpt`: substituir as alocações integrais por extração limitada e segura para UTF-8.
- `src-tauri/src/smart_context.rs::ContextHit` e novo tipo de resposta: explicitar resultado parcial.
- `src/api.ts` e consumidor em `src/App.tsx`: atualizar contrato e exibir aviso de resultado parcial, caso o backend altere o formato.

### Invariantes de segurança

- Nunca ler mais que o budget agregado nem mais que o limite individual.
- Nunca usar tamanho informado pelo banco como autorização para alocação.
- Nenhum caminho de blob pode escapar do diretório canonicalizado autorizado.
- Resultado truncado deve ser identificável pelo consumidor; não pode ser apresentado como busca completa.
- Ordenação e desempate devem ser determinísticos.
- Deadline e orçamento devem ser monotônicos e não reiniciados por arquivo.

### Riscos de regressão

- Consultas podem retornar menos resultados em projetos grandes.
- Busca por subconjunto pode alterar ranking em relação à varredura integral.
- Mudança no tipo de retorno pode quebrar o frontend.
- Implementação incremental de UTF-8/case-folding pode alterar semântica para Unicode.
- Um budget demasiado baixo prejudica relevância; demasiado alto não protege memória/CPU.

### Dependências

- Contrato de resposta Rust/TypeScript e UX para resultado parcial.
- Missão 063: leitura segura por handle e containment resistente a TOCTOU.
- Valores de budget precisam de decisão de produto e benchmark; não devem ser escolhidos como garantias de desempenho sem medição.

### Testes necessários

- Unitários: contador de bytes, limite exato e limite +1; deadline expirada; arquivo vazio; UTF-8 multibyte cortado no limite; query com Unicode; empate determinístico; resultado parcial e stop_reason.
- Integração: projeto com muitos blobs pequenos; um blob acima do limite; soma de blobs acima do limite agregado; metadado de tamanho divergente; blob ausente; caminho de blob redirecionado.
- Estresse: milhares de registros e blobs; medir pico de memória, bytes efetivamente lidos e duração; confirmar limites sob consulta repetida.
- **TESTE NÃO EXECUTADO:** todos os testes acima, benchmark e profiling.

### Critérios objetivos de aceite

- Bytes lidos nunca excedem o budget agregado e bytes por blob nunca excedem o limite individual.
- Registros examinados nunca excedem o limite + a linha de detecção de truncamento.
- Deadline é verificada durante leitura segmentada.
- Resultado parcial e motivo de parada são explicitamente representados.
- Memória máxima intermediária é limitada por constantes, não pelo tamanho arbitrário do projeto.
- Testes de Unicode e determinismo passam.

---

## 3. Missão 052 — Project Memory: limite transacional e agregado

### Status
**PROPOSTA PRONTA PARA APROVAÇÃO.** A corrida de limite de entradas permanece no código atual.

### Análise do problema atual

`set_project_memory()` faz SELECT para verificar a existência da chave, SELECT COUNT para o projeto e INSERT/UPSERT em comandos separados. A conexão não abre uma transação explícita nesse fluxo. Duas chamadas concorrentes para chaves novas podem ambas observar contagem abaixo de 1000 e inserir, excedendo o limite.

Há limite individual de 100.000 bytes para `value`, mas nenhum limite agregado de bytes por projeto. O número de entradas é protegido apenas pela lógica da aplicação, não por uma operação atômica.

### Evidências no código

- `src-tauri/src/project_memory.rs::set_project_memory`: sequência SELECT-exists, SELECT-count e INSERT/UPSERT fora de transação.
- `src-tauri/src/project_memory.rs::MAX_PROJECT_MEMORY_ENTRIES`: limite fixo de 1000.
- `src-tauri/src/db.rs::open`: busy_timeout de 5 segundos e SQLite WAL.
- `src-tauri/src/db.rs::migrate`: tabela `project_memory` tem chave primária composta `(project_id,key)`, mas não possui constraint de quantidade ou bytes agregados.

### Solução proposta

1. Abrir `TransactionBehavior::Immediate` antes de consultar existência/contagem. SQLite serializa escritores; a transação deve conter verificação do limite e UPSERT.
2. Dentro da transação, verificar se a chave já existe. Atualização de chave existente não consome slot novo.
3. Para chave nova, verificar count < MAX antes do insert. O INSERT/UPSERT e o commit devem ocorrer na mesma transação.
4. Introduzir `MAX_PROJECT_MEMORY_VALUE_BYTES` e `MAX_PROJECT_MEMORY_TOTAL_BYTES` em `limits.rs`. O limite individual atual deve ser migrado para a constante.
5. Calcular bytes agregados dentro da mesma transação. Para atualização, excluir o valor antigo do cálculo (ou usar `SUM(length(CAST(value AS BLOB)))` com a linha atual removida do total). Validar com overflow checked; nunca somar em `usize` sem proteção.
6. Definir semântica para valor vazio e limite exato; preservar UTF-8 e medir bytes, não caracteres.
7. Considerar adicionar índice cobrindo `project_id,key` (já existe) e não introduzir schema migration até demonstrar necessidade; a contagem e SUM podem permanecer transacionais inicialmente.

### Arquivos e funções envolvidos

- `src-tauri/src/project_memory.rs::set_project_memory`: transação Immediate e validação do budget de count/bytes.
- `src-tauri/src/project_memory.rs::MAX_PROJECT_MEMORY_ENTRIES`: mover para `limits.rs` ou manter alias por compatibilidade.
- `src-tauri/src/limits.rs`: limites individuais e agregados.
- `src-tauri/src/db.rs::migrate`: somente se a reconciliação optar por constraints/triggers ou metadado agregado persistido; não é requisito para a primeira implementação.
- `src-tauri/src/project_memory.rs::list_project_memory`: verificar se o limite de leitura é consistente com o limite de escrita e se existe sinalização quando o legado exceder o limite.

### Invariantes de segurança

- Não permitir mais que 1000 entradas por projeto, mesmo com gravações concorrentes.
- Atualizar chave existente não deve consumir slot novo.
- Nenhuma operação que exceda budget de bytes pode persistir parcialmente.
- Erro/rollback não pode deixar a memória parcialmente atualizada.
- Limites medidos em bytes UTF-8 e operações de soma sem overflow.
- Isolamento entre project_id é obrigatório.

### Riscos de regressão

- `BEGIN IMMEDIATE` aumenta contenção entre gravações; chamadas podem atingir busy timeout sob alta concorrência.
- Definir limite agregado pode rejeitar dados válidos hoje aceitos.
- `length(value)` em SQLite conta caracteres para texto; usar `length(CAST(value AS BLOB))` para bytes UTF-8.
- Dados legados já acima do limite exigem política: leitura preservada e escrita de novas chaves bloqueada, ou migração explícita. Não apagar entradas automaticamente.

### Dependências

- SQLite rusqlite 0.32 já habilitado; sem nova dependência esperada.
- Decisão sobre valor máximo agregado e comportamento de dados legados.
- Missão 063 para endurecimento do caminho do banco do projeto contra troca de symlink/TOCTOU.

### Testes necessários

- Unitários/integration: criar 999 entradas, inserir a 1000ª; rejeitar a 1001ª; atualizar existente quando cheio; testar byte-limit exato e +1; atualizar com redução/aumento de bytes; isolar projetos.
- Concorrência: disparar, em conexões SQLite distintas, mais de 100 operações simultâneas para chaves distintas quando count estiver próximo do teto; resultado final deve ser <=1000 e erros devem ser explícitos.
- Concorrência adicional: muitas atualizações da mesma chave; exatamente uma linha e valor final válido.
- Teste de rollback: provocar falha antes do commit e confirmar que count/bytes não mudaram.
- **TESTE NÃO EXECUTADO:** todos os testes acima e benchmark de contenção.

### Critérios objetivos de aceite

- Sob concorrência, count final nunca ultrapassa 1000.
- Atualização de chave existente funciona quando o projeto já está cheio.
- Soma em bytes UTF-8 respeita o budget e não sofre overflow.
- Cada operação é all-or-nothing.
- Nenhuma gravação de um projeto afeta outro.

---

## 4. Missão 055 — Backup/Restore: budgets e validação do manifest

### Status
**PROPOSTA PRONTA PARA APROVAÇÃO.** Há validação de hashes e correspondência manifest/banco, mas não há budgets globais antes de ler/copiá-los.

### Análise do problema atual

O backup é construído em staging e publicado por rename, o que é uma base útil. Hash SHA-256 é calculado em blocos de 64 KiB. No restore, o manifest é lido por `fs::read` sem limite de tamanho, o banco é integralmente hasheado, a lista de blobs do banco é carregada em BTreeMap e cada blob é hasheado sem limites de quantidade/bytes totais. O diretório de blobs é enumerado integralmente.

Na criação, o SELECT de blobs também pode produzir uma quantidade arbitrária de entradas; `fs::copy` e hash posterior não aplicam budget agregado. `hash_file` usa contador saturating, que evita overflow numérico, mas não limita o custo de leitura. Não há limite claro de tamanho do banco, manifest, blobs ou bytes totais.

A validação atual rejeita SHA inválido, paths de blob não esperados, symlinks em alguns pontos, hash/tamanho divergentes e divergência entre manifest e banco. Porém, a validação de manifest não é suficiente contra um pacote enorme e ainda existem janelas TOCTOU entre symlink_metadata/canonicalize e operações posteriores por caminho.

### Evidências no código

- `src-tauri/src/backup.rs::hash_file`: leitura em blocos de 64 KiB, sem limite máximo de bytes.
- `create_project_backup`: copia cada blob e gera manifest sem budget global.
- `safe_blob_source`: valida componentes e containment canonicalizado, mas opera com paths.
- `restore_project_backup`: `fs::read(manifest_path)`, validação do DB, BTreeMap de blobs, hash de cada blob, enumeração de diretório e cópia para staging sem limite agregado.
- `BackupManifest` e `BlobManifest`: campos versionados e tipados, mas sem limites semânticos próprios.
- `src-tauri/src/limits.rs`: não define limites de backup/restore.

### Solução proposta

1. Definir budgets distintos para criação e restauração: tamanho máximo de manifest, tamanho máximo de DB, máximo de blobs, bytes máximos por blob e bytes totais máximos. Os números devem ser definidos e justificados pelo produto; não inventar limites silenciosamente.
2. Implementar `hash_file_limited(file, max_bytes)` usando handle e leitura em blocos, abortando assim que ultrapassar o limite. Preservar a versão ilimitada apenas se algum chamador tiver justificativa documentada.
3. Antes de desserializar, ler manifest com `take(MAX_BACKUP_MANIFEST_BYTES + 1)`; rejeitar se exceder. Também limitar número de itens no vetor antes de processar qualquer caminho.
4. Validar o manifest como estrutura completa: `format_version`, `project_id`, `schema_version`, hash de DB com formato hexadecimal canônico, contagem, unicidade de SHA/nome, igualdade exata entre lista do manifest e tabela `blobs`, tamanhos não negativos, soma checked e ausência de entradas extras no diretório.
5. Rejeitar nomes de arquivos que não sejam exatamente o SHA-256 lowercase esperado; não permitir path components em `file_name`.
6. Limitar DB antes de abrir SQLite e antes de calcular hash; validar `integrity_check` e `foreign_key_check` sob o mesmo budget.
7. Aplicar os mesmos budgets na criação: contar blobs e bytes antes de copiar; abortar e remover staging ao ultrapassar limite. Revalidar tamanho/hash do conteúdo copiado.
8. Fazer validação de cada entrada via handle seguro (missão 063), e não confiar apenas em `symlink_metadata` seguido de `fs::copy`.
9. Verificar que o schema do banco restaurado é compatível antes de fazer remap; validar que as linhas pertencem ao source project e que não há referências inesperadas.
10. Não extrair arquivos arbitrários de ZIP; o formato atual é diretório de backup. Se houver evolução para arquivo compactado, exigir proteção contra zip-slip e expansão desproporcional como requisito separado.

### Arquivos e funções envolvidos

- `src-tauri/src/limits.rs`: budgets de backup e restore.
- `src-tauri/src/backup.rs::hash_file`: versão limitada e tratamento de overflow.
- `src-tauri/src/backup.rs::create_project_backup`: budgets antes e durante cópia.
- `src-tauri/src/backup.rs::safe_blob_source`: abrir/verificar handle dentro da raiz, em coordenação com missão 063.
- `src-tauri/src/backup.rs::restore_project_backup`: leitura limitada do manifest, budgets do DB/blobs, validação estrutural completa.
- `src-tauri/src/backup.rs::BackupManifest` / `BlobManifest`: validar campos e canonicalização sem alterar formato v1 de forma incompatível.
- `src-tauri/src/db.rs`: só se for necessário validar schema sem executar migração; restaurar não deve migrar/alterar o backup original durante a validação.

### Invariantes de segurança

- Nenhum backup ou restore ultrapassa limites por arquivo, quantidade ou bytes agregados.
- Manifest inválido é rejeitado antes de qualquer gravação no projeto de destino.
- Hash e tamanho são conferidos contra bytes efetivamente lidos.
- Nenhum path do manifest pode controlar um caminho fora do diretório de backup.
- Nenhum arquivo extra, symlink, diretório ou dispositivo é aceito dentro de `blobs`.
- Falha de validação nunca publica staging parcial.
- O backup de origem permanece imutável durante restore.

### Riscos de regressão

- Backups históricos grandes podem deixar de ser restauráveis com budgets novos.
- O limite de manifest pode rejeitar backups com muitos blobs mesmo quando o conteúdo total é pequeno.
- Verificação integral de hash e SQLite integrity check aumenta latência.
- O DB pode referenciar dados legados que não obedecem a convenções atuais; isso deve gerar erro explícito, não correção automática.
- Mudança de formato exige versionamento e compatibilidade; não alterar v1 sem decisão formal.

### Dependências

- Missão 056: publicação do projeto restaurado sem substituir destino criado em corrida.
- Missão 063: abertura segura e resistente a TOCTOU de manifest, DB e blobs.
- Missão 051/limites de recursos compartilham política de budgets, mas não devem reutilizar constantes inadequadas.
- Política de compatibilidade para backups antigos e escolha dos budgets.

### Testes necessários

- Unitários: hash limitado em limite exato e +1; manifest vazio, truncado e oversized; SHA inválido; duplicate SHA; filename com path; contagem acima do limite; soma com overflow; versão/schema incompatível.
- Integração: DB oversized; blob oversized; total agregado excedido; manifest/DB divergentes; blob faltando/extra; hash/tamanho divergentes; FK quebrada; integrity_check diferente de ok; falha em meio à cópia limpa staging.
- Adversarial: symlink em manifest/db/blob; substituição do arquivo entre validação e open; arquivo truncado/modificado durante leitura.
- Estresse: backup/restore com máximo permitido de blobs e bytes; medir memória e tempo; cancelar/interromper e verificar limpeza.
- **TESTE NÃO EXECUTADO:** todos os testes acima.

### Critérios objetivos de aceite

- Nenhuma leitura ou cópia ultrapassa budget por arquivo e agregado.
- Manifest é rejeitado se exceder bytes/itens, tiver duplicatas ou divergir do banco.
- Nenhuma restauração começa a publicar dados antes da validação completa.
- Staging é removido em qualquer falha anterior ao commit.
- Hashes e tamanhos correspondem aos bytes efetivamente copiados.
- Backup dentro dos limites permanece compatível com o formato v1.

---

## 5. Missão 056 — Restore Destination: publicação sem race condition

### Status
**PROPOSTA PRONTA PARA APROVAÇÃO.** O destino é verificado antes da cópia e publicado posteriormente por `fs::rename`; a ausência do destino não é reservada atomicamente.

### Análise do problema atual

`restore_project_backup()` verifica `symlink_metadata(target)` e rejeita se o caminho existe. Em seguida cria um staging separado, copia e valida os dados e, por fim, executa `fs::rename(stage, target)`. Outro processo ou chamada concorrente pode criar o destino entre o teste inicial e o rename.

O comportamento final de rename varia por plataforma e estado do destino: não se pode depender de que o rename sempre falhe sem substituir algo. Uma segunda restauração para o mesmo target também pode passar pelo mesmo teste inicial. UUID no nome de staging evita colisão de staging, mas não reserva o nome de destino.

### Evidências no código

- `src-tauri/src/backup.rs::restore_project_backup`: teste de existência do target separado da publicação.
- A publicação final é `fs::rename(&stage, &target)`.
- `src-tauri/src/lib.rs::run`: comando exposto por Tauri; não há lock de destino visível nesse fluxo.
- A cópia/validação ocorre antes da publicação, portanto há uma janela de tempo significativa entre check e commit.

### Solução proposta

1. Separar explicitamente preparação e commit do restore.
2. Adotar primitiva de publicação atômica *no-replace* por plataforma:
   - Linux: `renameat2(..., RENAME_NOREPLACE)` quando suportado.
   - Windows: operação equivalente que falhe se o destino já existir, sem `MOVEFILE_REPLACE_EXISTING`; avaliar API Win32/NT e garantias reais.
   - macOS/Unix sem primitiva equivalente: reservar o nome de destino atomicamente com criação exclusiva de diretório/handle e desenhar commit que não possa substituir a reserva; validar semântica de rename no volume alvo.
3. Preferir handle/dir-handle da pasta `projects` e operação relativa ao handle para evitar troca do parent path entre validação e rename.
4. Não usar somente Mutex em memória como garantia de segurança: ela coordena chamadas no mesmo processo, mas não processos externos. Um lock por target pode reduzir trabalho duplicado, porém a garantia final deve ser filesystem atomic no-replace.
5. Staging deve permanecer no mesmo filesystem/volume de `projects`; caso contrário rename pode falhar ou deixar de ser atômico.
6. Em conflito de destino, remover apenas o staging que pertence à operação atual e retornar `RESTORE_TARGET_EXISTS`. Nunca remover nem modificar o target concorrente.
7. Se o commit for dividido em reserva e preenchimento, projetar recuperação de crash: marcador de operação, estado incompleto identificável e regra de limpeza que nunca apague diretório de usuário. Preferir no-replace rename do staging completo quando disponível.
8. Garantir que duas restaurações para o mesmo target tenham exatamente uma vencedora; a outra falha sem alterar a vencedora.

### Arquivos e funções envolvidos

- `src-tauri/src/backup.rs::restore_project_backup`: separar preparação/commit, validar parent handle, usar publish-no-replace.
- Novo helper em `src-tauri/src/backup.rs` ou módulo dedicado `filesystem.rs`: operação multiplataforma de rename sem substituição.
- `src-tauri/Cargo.toml`: dependência/feature de crate multiplataforma somente se APIs padrão/Win32 existentes não forem suficientes; nenhuma dependência foi escolhida nesta proposta.
- `src-tauri/src/lib.rs::run`: nenhuma mudança necessária se helper permanecer interno; registrar somente se houver serviço de lock gerenciado.
- `src-tauri/src/limits.rs`: não é dependência funcional desta missão, exceto limites do restore da missão 055.

### Invariantes de segurança

- Destino preexistente nunca é substituído, removido ou alterado.
- Para duas operações concorrentes no mesmo target, no máximo uma publicação é bem-sucedida.
- Publicação é atômica no mesmo volume.
- Falha de commit não apaga dados que não foram criados pela operação atual.
- O parent directory usado no commit é o mesmo que foi validado.
- Staging incompleto nunca é exposto como projeto válido.

### Riscos de regressão

- APIs no-replace não são uniformes entre Linux, macOS e Windows.
- Reserva por diretório pode deixar órfãos após crash.
- Mutex global pode serializar restores independentes desnecessariamente.
- Implementação específica de plataforma pode exigir dependência ou código unsafe.
- Sem suporte no filesystem, deve falhar fechado em vez de fazer fallback para rename substitutivo.

### Dependências

- Missão 055: staging só pode ser publicado após budgets e validação integral.
- Missão 063: dir-handle e operações resistentes a symlink/TOCTOU.
- CI multiplataforma real (Windows, macOS e Linux) para validar semântica do commit.

### Testes necessários

- Unitários: helper no-replace quando target ausente; target existente como arquivo, diretório vazio, diretório não vazio e symlink; parent inválido.
- Integração: duas restaurações concorrentes com mesmo target; restaurações paralelas para targets distintos; criação externa do target durante cópia; crash/falha antes e durante commit.
- Plataforma: repetir nos filesystems suportados em Windows/macOS/Linux; confirmar que target existente nunca é substituído.
- **TESTE NÃO EXECUTADO:** todos os testes acima; nenhuma primitiva de publicação foi implementada ou validada nesta etapa.

### Critérios objetivos de aceite

- Em N tentativas simultâneas para o mesmo target, exatamente uma vence.
- O conteúdo do vencedor corresponde integralmente a um backup validado.
- Conteúdo de destino criado externamente permanece byte-a-byte intacto.
- Falhas não deixam projeto parcialmente publicado.
- Garantia no-replace comprovada em cada plataforma suportada.

---

## 6. Missão 057 — Import Roots: concorrência, atomicidade e limites

### Status
**PROPOSTA PRONTA PARA APROVAÇÃO.** O limite de 32 roots existe, mas o ciclo load-modify-save não é serializado e a substituição no Windows contém uma janela sem arquivo.

### Análise do problema atual

`add_root()` e `remove_root()` carregam o JSON, alteram um vetor em memória e salvam em operações separadas. Duas chamadas simultâneas podem ler a mesma versão e sobrescrever a atualização da outra. O limite de 32 é verificado antes do save, logo concorrência pode ultrapassá-lo.

`save_roots()` usa nome temporário fixo `import_roots.json.tmp`; operações simultâneas podem colidir no mesmo arquivo temporário. No Windows, remove o arquivo final antes do rename, criando janela em que a configuração desaparece; falha posterior pode perder o arquivo anterior. `load_roots()` usa `path.exists()` seguido de `fs::read_to_string`, sem validação do tipo/handle e com risco de symlink/junction ou TOCTOU na configuração.

### Evidências no código

- `src-tauri/src/path_guard.rs::add_root`: load, checagem de duplicata/limite e save não atômicos em conjunto.
- `src-tauri/src/path_guard.rs::remove_root`: load-modify-save sem exclusão mútua.
- `src-tauri/src/path_guard.rs::load_roots`: `exists` e leitura do arquivo por caminho.
- `src-tauri/src/path_guard.rs::save_roots`: temporário fixo; Windows remove-then-rename.
- `src-tauri/src/limits.rs::MAX_IMPORT_ROOTS`: limite de 32.
- `src-tauri/src/lib.rs::add_import_root/remove_import_root/list_import_roots`: comandos delegam diretamente a path_guard.

### Solução proposta

1. Substituir o JSON como fonte mutável por armazenamento transacional SQLite (tabela de roots com path canonicalizado e UNIQUE), ou implementar lock interprocesso com arquivo de lock + atualização atômica robusta. Recomendo SQLite porque o produto já usa rusqlite e a semântica de serialização é clara.
2. Se SQLite for escolhido, criar tabela de configuração com path primary key e transação Immediate para add/remove. Verificar count e duplicata dentro da mesma transação. A migração importa JSON legado uma única vez, valida entradas, e só remove/arquiva o JSON após commit e verificação.
3. Se mantiver JSON por compatibilidade, exigir lock interprocesso, temporário exclusivo por UUID, flush/sync, rename sem janela destrutiva e estratégia de recovery. Mutex apenas no processo não protege múltiplas instâncias.
4. Validar o limite dentro da mesma transação/lock: duplicata não consome slot; root novo só entra se count < 32.
5. Validar limites de tamanho total do arquivo de configuração, tamanho de cada path, duplicatas e número de entradas antes de desserializar/processar. Aplicar limite de bytes ao arquivo JSON.
6. `load_roots` deve rejeitar symlink/reparse point e abrir por handle seguro; não confiar em `exists()`.
7. Canonicalizar o root no momento de inclusão e revalidar no uso; root removido entre autorização e abertura deve falhar fechado. Definir semântica para diretório que deixa de existir ou passa a ser reparse point.
8. Garantir que `remove_root` compare caminho canonicalizado e normalizado com a mesma política de case-sensitivity por plataforma.
9. Retornar lista ordenada deterministicamente para estabilidade de UI e testes.

### Arquivos e funções envolvidos

- `src-tauri/src/path_guard.rs::add_root`: transação/lock e limite atômico.
- `src-tauri/src/path_guard.rs::remove_root`: transação/lock e remoção idempotente.
- `src-tauri/src/path_guard.rs::list_roots`: leitura consistente e validação.
- `src-tauri/src/path_guard.rs::load_roots` / `save_roots`: remover ou encapsular no migrador caso JSON seja descontinuado.
- `src-tauri/src/db.rs::migrate`: tabela de roots/configuração se SQLite for adotado.
- `src-tauri/src/limits.rs`: `MAX_IMPORT_ROOTS`, `MAX_IMPORT_ROOTS_FILE_BYTES`, `MAX_IMPORT_ROOT_PATH_BYTES`.
- `src-tauri/src/lib.rs::add_import_root/remove_import_root/list_import_roots`: manter assinatura pública; atualizar apenas se retorno/erro exigir mudança.
- `src-tauri/src/path_guard.rs::open_verified`: consultar roots transacionalmente e integrar com abertura segura da missão 063.

### Invariantes de segurança

- Nunca mais que 32 roots, mesmo com concorrência ou múltiplas instâncias.
- Adição/remoção é atômica; não se perdem atualizações concorrentes.
- Duplicatas não consomem slots.
- Configuração corrompida ou redirecionada falha fechada sem sobrescrever arquivo original.
- Nenhum root autoriza caminho fora de sua árvore efetiva.
- Remover root não remove nem altera arquivos do usuário.
- Migração de JSON não perde roots nem aceita entradas fora da política.

### Riscos de regressão

- Migração JSON → SQLite pode perder configuração se não for idempotente ou se remover o JSON cedo demais.
- Política de canonicalização/case pode mudar a forma como roots duplicados são tratados.
- SQLite em app_config_dir deve ter caminho e permissões adequados; não misturar DB de configuração com DB de projeto sem decisão arquitetural.
- Lock interprocesso é mais complexo e multiplataforma; mutex local é insuficiente para a garantia declarada.
- UI pode observar ordem diferente de roots.

### Dependências

- Missão 063 para proteção de reparse point/symlink e abertura segura de configuração e roots.
- `db.rs` e política de migração. A equipe deve decidir se roots pertencem ao DB de projeto ou DB global de configuração; recomendo DB global dedicado.
- A operação `open_verified` deve consumir snapshot consistente dos roots.

### Testes necessários

- Unitários: path inválido; path > limite; JSON oversized/duplicado/corrompido; duplicata; 32º/33º root; canonicalização e comparação Windows/Linux.
- Integração: duas adições simultâneas distintas; add/remove simultâneos; várias remoções; reinício e migração do JSON; crash durante migração; arquivo de config symlink/reparse.
- Concorrência multiprocesso: duas instâncias do app alterando roots; confirmar limite e ausência de lost update.
- **TESTE NÃO EXECUTADO:** todos os testes acima.

### Critérios objetivos de aceite

- Count nunca excede 32, inclusive em concorrência multiprocesso.
- Nenhuma atualização confirmada é perdida por write concorrente.
- Configuração anterior permanece intacta em falha de gravação.
- Nenhuma janela de arquivo ausente durante substituição.
- Migração é repetível e não perde dados.
- Roots inválidos não autorizam importação.

---

## 7. Missão 063 — Filesystem Audit transversal

### Status
**PROPOSTA PRONTA PARA APROVAÇÃO.** Há validações importantes, mas canonicalize/metadata seguido de open/copy/rename por path não elimina TOCTOU.

### Análise do problema atual

A aplicação possui defesas úteis: project_id restrito, logical_path sem traversal, rejeição de alguns symlinks, containment canonicalizado, hash de blobs e identidade de handle em `open_verified`. Porém, diferentes módulos repetem padrões de validar um caminho e depois usá-lo novamente. Um atacante/processo concorrente com permissão de escrita na árvore pode trocar componente, symlink ou junction entre validação e operação.

O helper `open_verified()` compara identidade de dois handles do arquivo, mas canonicaliza o caminho e verifica root membership antes de abrir o handle final. A identidade do arquivo aberto prova que o arquivo não foi trocado entre as duas aberturas; não prova que a cadeia de diretórios permaneceu dentro do root nem impede troca de parent directory após canonicalização. Além disso, a validação de roots persistidos também ocorre por path.

### Matriz de superfícies observadas

| Superfície | Código atual | Risco residual / proposta |
|---|---|---|
| Import source | `path_guard::open_verified`, `lib.rs::read_source_safely` | Troca de diretório/parent entre canonicalize e open; usar abertura relativa a handles e no-follow |
| Import roots config | `path_guard::load_roots/save_roots` | Symlink/reparse, lost update e temp fixo; proteger handle, atomicidade e lock |
| Project DB/root | `project_root`, `db::open`, `project_memory.rs`, `file_center.rs` | Caminho do projeto pode sofrer redirecionamento antes do open; validar parent/handle |
| Smart Context blobs | `smart_context.rs::smart_context` | Canonicalize e depois read por path; abrir handle seguro e aplicar budget |
| Backup source blobs | `backup.rs::safe_blob_source`, `create_project_backup` | Canonicalize e depois fs::copy; trocar para handle seguro e copy de handle |
| Backup manifest/DB/blobs | `restore_project_backup` | metadata/read/hash/open por path; abrir e validar o mesmo handle |
| Restore staging/target | `restore_project_backup` | staging e target via path; parent pode ser trocado e target race; dir-handle + no-replace |
| Blob writes | `lib.rs::ensure_blob_with_status` | symlink_metadata e depois File::open/rename por path; risco de substituição |
| File reads | `file_center.rs::read_file_version` | canonicalize e depois File::open; validar handle/identidade e containment |
| Directory traversal | comandos/import batch | qualquer traversal futuro deve não seguir symlink/junction e aplicar depth/count/bytes |

### Evidências no código

- `src-tauri/src/path_guard.rs::canonical_without_redirect`: canonicalize seguido de comparação do path.
- `src-tauri/src/path_guard.rs::open_verified`: canonicaliza origem e roots, checa containment, obtém identidade e abre caminho novamente.
- `src-tauri/src/path_guard.rs::identity`: usa dev/inode em Unix e volume/index em Windows — boa base de identidade do arquivo, mas não da cadeia de diretórios.
- `src-tauri/src/backup.rs::safe_blob_source`: canonicalize e valida parent; caller usa `fs::copy` depois.
- `src-tauri/src/backup.rs::restore_project_backup`: symlink_metadata seguido de read/hash/open/copy por path.
- `src-tauri/src/file_center.rs::read_file_version`: canonicalize blob e depois `File::open`.
- `src-tauri/src/lib.rs::ensure_blob_with_status`: metadata/open/rename por path em sequência.
- `src-tauri/src/limits.rs`: já há `MAX_PATH_DEPTH`, mas traversal de filesystem precisa de limites próprios de entradas e bytes.

### Solução proposta

1. Criar uma camada única de filesystem seguro, por exemplo `src-tauri/src/secure_fs.rs`, para abrir arquivos e diretórios relativos a um root handle previamente validado. Os módulos deixam de implementar canonicalize-then-open isoladamente.
2. Unix/Linux: usar `openat`/dirfd com `O_NOFOLLOW` em cada componente e, quando suportado, `openat2` com `RESOLVE_BENEATH | RESOLVE_NO_SYMLINKS | RESOLVE_NO_MAGICLINKS`. Não assumir que `openat2` existe em todos os kernels; fallback deve caminhar componente a componente com dirfd e no-follow.
3. Windows: abrir handles com flags apropriadas para reparse points, inspecionar atributos/reparse tags e volume/file ID; evitar seguir junction/symlink durante abertura. Usar APIs relativas a handle ou revalidar cada componente com handles mantidos abertos. Não tratar `is_symlink` como cobertura universal de reparse points.
4. Implementar wrappers explícitos: `open_file_beneath(root_handle, relative, policy)`, `open_dir_beneath`, `create_new_file_beneath`, `rename_noreplace_beneath`, `remove_owned_staging`. Cada wrapper deve documentar se segue links (default: não).
5. Usar handle aberto para todas as operações subsequentes (read/hash/copy/metadata). Evitar reabrir pelo mesmo caminho depois de validá-lo.
6. Aplicar a camada em `path_guard::open_verified`, `file_center::read_file_version`, `smart_context::smart_context`, `backup::safe_blob_source`, `backup::restore_project_backup` e `lib.rs::ensure_blob_with_status`.
7. Para criação de arquivos, usar create-new/exclusive e temporários UUID em diretório controlado; validar que o diretório staging não é symlink/reparse e que pertence ao root.
8. Para rename/delete, operar relativamente ao handle do parent; só remover staging com identificador e ownership da operação atual. Nunca apagar diretório de destino desconhecido.
9. Aplicar política uniforme a junctions, symlinks, mount points e Windows reparse tags. Se não for possível classificar com segurança em plataforma, falhar fechado.
10. Separar validação de path lógico (sem traversal) de validação do filesystem real. Ambas são necessárias e não substituem uma à outra.
11. Adicionar testes adversariais com substituição concorrente de componente, parent e arquivo; executar em Windows e Linux pelo menos, macOS se suportado.

### Arquivos e funções envolvidos

- Novo `src-tauri/src/secure_fs.rs`: abstração por plataforma e wrappers de open/create/copy/rename/delete seguros.
- `src-tauri/src/lib.rs::read_source_safely`: consumir handle seguro e limite de leitura.
- `src-tauri/src/lib.rs::ensure_blob_with_status`: criação exclusiva e verificação por handle.
- `src-tauri/src/path_guard.rs::canonical_without_redirect`, `open_verified`, `canonical_identity`, `identity`: centralizar ou substituir implementação pelo novo helper; manter identidade do handle como defesa adicional.
- `src-tauri/src/file_center.rs::read_file_version`: abrir blob relativamente ao root e verificar handle.
- `src-tauri/src/smart_context.rs::smart_context`: abrir blob seguro e usar leitura limitada (dependência 051).
- `src-tauri/src/backup.rs::safe_blob_source`, `hash_file`, `create_project_backup`, `restore_project_backup`: operar sobre handles; validar manifest/DB/blob sem reabrir paths (dependência 055).
- `src-tauri/src/limits.rs`: limites de traversal, contagem e bytes por operação.
- `src-tauri/Cargo.toml`: features de `windows-sys` e dependências Unix apenas após desenho de APIs e revisão de unsafe. Já existe `windows-sys` com Foundation e Storage_FileSystem.
- `src-tauri/src/lib.rs::run`: somente se a camada exigir estado/serviço gerenciado; preferir helpers internos sem estado global.

### Invariantes de segurança

- Toda leitura ou mutação fica contida no root autorizado por handles, não apenas por strings canonicalizadas.
- Não seguir symlink/junction/reparse point em componentes protegidos, salvo política explícita e testada.
- O objeto usado é o mesmo objeto validado: metadata, hash e leitura pertencem ao mesmo handle.
- Operações de rename/delete ficam restritas ao parent handle e aos objetos pertencentes à operação.
- Falha de identidade/containment resulta em erro; nunca em fallback permissivo.
- Limites de depth, contagem, bytes e tempo aplicam-se durante a operação, não depois.
- Nenhum caminho externo é apagado ou sobrescrito.

### Riscos de regressão

- APIs de filesystem são distintas por OS e filesystem; wrappers podem exigir unsafe e revisão especializada.
- Bloquear reparse points pode impedir importações legítimas em diretórios sincronizados, aliases ou volumes montados.
- Fallbacks sem openat2 devem manter garantias equivalentes; caso contrário, suportar explicitamente nível de segurança reduzido não é aceitável.
- Handles abertos podem impedir rename/delete no Windows e exigir fechar/duplicar handles com cuidado.
- Testes TOCTOU são sensíveis a timing; usar barreiras/hooks de teste e loops controlados, não apenas sleeps.
- Centralizar tudo numa wave aumenta escopo; priorizar os caminhos de maior impacto e manter cada missão com commits pequenos.

### Dependências

- Missão 056: publish-no-replace e parent handle.
- Missão 055: leitura e validação de backup por handle e budgets.
- Missão 057: roots persistidos e snapshots consistentes.
- Missão 051: Smart Context deve usar leitura segura e limitada.
- Missão 052: path do DB de projeto deve ser aberto sob raiz validada.
- Plataforma mínima suportada e política formal sobre symlink/junction/mount point.
- Revisão de código unsafe e CI multiplataforma.

### Testes necessários

- Unitários: normalização lexical; comparação de componentes; identidade de handle; rejeição de symlink/junction/reparse; create-new; rename no-replace; limites de path/depth.
- Integração: arquivo dentro/fora do root; parent symlink; symlink final; hard link (documentar política); junction no Windows; mount point; arquivo substituído após validação; root substituído; staging redirecionado.
- TOCTOU determinístico: hook/barreira entre validação e open/copy/rename; outro processo troca componente; a operação deve falhar sem ler/escrever fora do root.
- Cross-platform: Linux, Windows e macOS se suportado; testar NTFS e filesystem suportado; registrar kernel/filesystem para openat2/fallback.
- Estresse: múltiplos processos concorrendo para trocar links/renomear roots durante leitura, import, backup e restore; confirmar zero operações fora do root.
- **TESTE NÃO EXECUTADO:** todos os testes acima; nenhuma auditoria dinâmica ou teste de plataforma foi executado.

### Critérios objetivos de aceite

- Todas as superfícies listadas usam camada segura ou possuem justificativa documentada e teste equivalente.
- Nenhuma troca de symlink/junction entre validação e operação permite acesso externo.
- Hash, tamanho e conteúdo são verificados no mesmo handle usado para a operação.
- Rename/delete nunca substituem nem removem objetos não pertencentes à operação.
- Garantias comprovadas em todas as plataformas oficialmente suportadas.
- Qualquer fallback inseguro é removido ou faz a operação falhar fechada.

---

## 8. Dependências e ordem recomendada de implementação

1. **063 — secure filesystem primitives:** definir APIs e invariantes multiplataforma primeiro; revisar código unsafe.
2. **052 — Project Memory:** transação Immediate e budgets; pode avançar em paralelo com desenho inicial de secure_fs, mas o caminho de abertura do DB deve ser reconciliado com 063.
3. **057 — Import Roots:** decidir armazenamento transacional e migração JSON; integração com secure_fs para roots e config.
4. **051 — Smart Context:** budgets e leitura por handle; depende da API segura de abertura.
5. **055 — Backup/Restore:** budgets e validação integral por handle.
6. **056 — Restore Destination:** commit no-replace por parent handle; depende de secure_fs e da preparação validada do restore.

A ordem não impede trabalho paralelo em testes/unit helpers. Não recomendo misturar todos os patches num commit grande.

## 9. Estado de execução e limitações globais

- Inspeção de código feita por leitura remota da branch `v2-saas-alpha`.
- **TESTE NÃO EXECUTADO:** `cargo test`, `cargo check`, build Tauri, frontend build, CI, testes de integração, concorrência, estresse, fuzzing e testes adversariais.
- Nenhum benchmark, perfil de memória, validação de API de filesystem por OS ou pentest foi realizado.
- Nenhum arquivo do repositório principal foi alterado.
- Nenhuma dependência foi adicionada.
- Esta proposta não autoriza implementação, merge, release ou alteração de configuração.
- Os valores finais de budgets dependem de decisão do integrador e de medições; não são especificados aqui como números arbitrários.
- A garantia TOCTOU não pode ser declarada resolvida apenas com `canonicalize`, `symlink_metadata` ou mutex em memória.

## 10. Decisão solicitada ao GPT-6 integrador

Reconciliar as propostas, definir plataforma mínima, budgets numéricos, estratégia de armazenamento de Import Roots e primitive de commit no-replace. Autorizar patches em unidades pequenas, começando pelas primitivas compartilhadas de filesystem e pelos testes de concorrência. A aprovação deve identificar explicitamente os arquivos permitidos e os critérios de validação.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN

| arquivo | função | mudança | teste | risco |
|---|---|---|---|---|
| `src-tauri/src/limits.rs` | constantes de limites | Adicionar budgets explícitos para Smart Context, Project Memory, backup/restore e config de roots | Unit tests para limites exatos, +1 e overflow | Valores mal calibrados podem rejeitar projetos válidos ou não proteger recursos |
| `src-tauri/src/smart_context.rs` | `smart_context`, `excerpt` | Limitar candidatos, bytes/blob, bytes totais e deadline; leitura por handle; resultado parcial | Integração com muitos blobs, blob oversized, UTF-8, deadline, memória/bytes | Mudança de ranking e contrato TypeScript |
| `src-tauri/src/project_memory.rs` | `set_project_memory`, `list_project_memory` | Transação Immediate envolvendo existência/count/UPSERT; budget agregado em bytes | Corrida multi-conexão, 1000/1001, update quando cheio, rollback | Contenção SQLite e política para dados legados |
| `src-tauri/src/db.rs` | `migrate`, schema | Adicionar tabela global de import roots se aprovado; sem migração se JSON+lock for escolhido | Migração idempotente, legado, crash recovery | Perda de configuração em migração incorreta |
| `src-tauri/src/path_guard.rs` | `add_root`, `remove_root`, `list_roots`, `load_roots`, `save_roots`, `open_verified` | Serializar mutações; eliminar temp fixo e lost update; migrar roots; consumir handles seguros | Add/remove concorrentes, multiprocesso, symlink/reparse, migração | Mudança de persistência e compatibilidade multiplataforma |
| `src-tauri/src/backup.rs` | `hash_file`, `safe_blob_source`, `create_project_backup`, `restore_project_backup` | Budgets por arquivo/agregados; manifest limitado; validação estrutural; operações por handle | Manifest adversarial, DB/blob oversized, hash/FK, staging cleanup | Backups antigos grandes e latência de validação |
| `src-tauri/src/backup.rs` ou novo `secure_fs.rs` | helper `rename_noreplace` | Publicar staging sem substituir destino, relativo a parent handle | Duas restaurações simultâneas e target criado durante staging | Semântica diferente por OS/filesystem |
| novo `src-tauri/src/secure_fs.rs` | `open_file_beneath`, `open_dir_beneath`, `create_new_file_beneath`, `rename_noreplace_beneath`, `remove_owned_staging` | Camada comum de filesystem baseada em handles e no-follow, com implementações por plataforma | TOCTOU determinístico, symlink/junction/reparse, cross-platform | Unsafe, diferenças de API e compatibilidade de volumes |
| `src-tauri/src/file_center.rs` | `read_file_version` | Abrir blob e verificar hash/tamanho no mesmo handle contido no root | Substituição concorrente, blob corrompido, symlink | Falhas em caminhos legados ou filesystems especiais |
| `src-tauri/src/lib.rs` | `read_source_safely`, `ensure_blob_with_status`, comandos de roots | Consumir secure_fs e limites sem duplicar validação por path | Import adversarial, arquivo oversized, concorrência | Integração de comandos e erros existentes |
| `src-tauri/Cargo.toml` | dependências/feature gates | Adicionar somente bindings/dependências realmente necessárias após desenho de API | Build em todos os targets suportados | Dependência nativa, unsafe e falha de compilação por target |
| `src/api.ts`, `src/App.tsx` | contrato Smart Context | Expor truncamento/motivo de parada sem confundir resultado parcial com completo | Teste de contrato e UI | Quebra de tipo ou UX enganosa |

