# WAVE 001 — Missão 055: Backup/Restore — budgets e manifest

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** arquitetura Rust/SQLite, segurança de filesystem e confiabilidade
- **Função:** proposta técnica independente pós-auditoria; somente leitura
- **Data:** 2026-11-10
- **Status:** REVIEW_REQUIRED
- **Branch analisada:** `v2-saas-alpha`
- **HEAD/arquivos:** evidências obtidas por fetch dos arquivos indicados; hashes anotados abaixo. Nenhum teste de runtime foi executado.

## Análise do problema atual
Há verificações de integridade relevantes: SQLite backup API, integrity_check, foreign_key_check, SHA-256 e comparação entre manifest e tabela blobs. Porém, a restauração carrega manifesto inteiro via fs::read antes de qualquer limite, constrói BTreeMaps e hasheia todos os blobs sem orçamento agregado. Backup também copia blobs para staging e cria Vec de manifesto sem teto explícito de contagem, bytes totais ou duração. Integridade não impede exaustão de RAM/CPU/disco.

## Evidências no código
- `src-tauri/src/backup.rs`, SHA `524674d95247407b507a0ad96a73531225ab6259`: `create_project_backup` percorre `SELECT sha256, byte_len, relative_path FROM blobs`, faz `fs::copy`, depois `hash_file`; acumula `manifest_blobs`.
- `restore_project_backup`: manifesto lido por `fs::read`; verifica format/project/schema, DB SHA, SQLite integrity/FK; carrega mapas, faz hash de cada blob, verifica entradas extras e copia cada blob para staging.
- `limits.rs`: não há limites de manifesto, número de blobs, DB, bytes totais de backup ou staging.

## Solução proposta
Adicionar `BackupBudget` comum a criação e restauração, com limites explícitos e aprovados: manifesto bytes, blob count, bytes/blob, bytes totais, DB bytes, staging bytes e deadline. Os valores devem ser escolhidos pelo owner com base em uso real; não codificar limites arbitrários neste patch.

### Manifest v1
- Aplicar `#[serde(deny_unknown_fields)]` em `BackupManifest` e `BlobManifest` para v1, após confirmar compatibilidade com backups já gerados.
- Validar campos antes de alocar estruturas: versão, UUID/path naming, project/schema, SHA lowercase canônico, nomes únicos, count, soma com checked_add e tamanho por blob.
- Ler manifesto com `File::take(MAX_MANIFEST_BYTES + 1)`; se ultrapassar teto, rejeitar antes do parse.
- Verificar que o número de blobs declarado corresponde à tabela DB e à listagem real de diretório. Não aceitar arquivo extra, symlink ou tipo especial.
- Limitar DB pelo metadata + leitura/hash com teto; abrir SQLite somente após size/hash passarem. Considerar sidecar WAL/SHM na criação: snapshot SQLite já gera DB consistente, mas assegurar journal mode e fechar conexão antes de publicar.

### Streaming e staging
- Criar helper `copy_hash_limited(reader, writer, budget)` com buffer fixo, contador checked_add, deadline e SHA no mesmo fluxo; rejeitar assim que qualquer teto exceder.
- Não usar `fs::copy` seguido de segunda leitura para operações grandes; evitar duas passagens de I/O.
- Antes de copiar, comparar tamanho esperado com budget restante e metadata; ainda assim contar bytes reais no stream.
- Somar DB + blobs + manifesto para total e staging. Em falha, remover somente staging criado pela operação e nunca backup anterior.
- Criação: contar blobs e bytes durante cópia; abortar sem publicar diretório final se exceder.
- Restore: validar integralmente manifesto/DB/blobs antes da publicação. Nenhum dado parcial aparece no projeto final.

## Arquivos e funções envolvidos
- `src-tauri/src/backup.rs`: `BackupManifest`, `BlobManifest`, `hash_file`, novo `validate_manifest`, `create_project_backup`, `restore_project_backup`.
- `src-tauri/src/limits.rs`: limites e deadline de backup/restore.
- `src-tauri/src/tests.rs` ou testes em backup.rs: fixtures de manifesto, streams e staging.
- Dependência da Missão 056 para publicar restore sem overwrite e da Missão 063 para abrir/hash arquivos por handle seguro.

## Invariantes de segurança
- Soma de bytes nunca excede budget; operações usam checked_add e falham closed em overflow.
- Manifesto e DB representam exatamente o mesmo conjunto de blobs.
- Cada blob tem SHA, tamanho, nome e tipo de arquivo validados.
- Não abrir SQLite de backup antes de limitar tamanho e verificar hash.
- Restore não altera projeto de destino em caso de qualquer erro de validação.
- Staging pertence à operação, tem nome exclusivo e é limpo em falha sem apagar conteúdo alheio.
- Deadline interrompe loops e limpeza não apaga diretórios fora do staging canônico.

## Riscos e dependências
- `deny_unknown_fields` pode rejeitar backups futuros/gerados por versões que acrescentem campos; definir migração de format_version antes.
- Limites baixos quebram restauração legítima; limites altos não protegem dispositivo modesto.
- Hash + cópia stream deve manter exatamente SHA e tamanho existentes.
- SQLite integrity_check pode consumir tempo proporcional ao DB; deadline deve envolver verificação, ou subprocesso se API não permitir cancelamento.
- Compatibilidade com backups históricos precisa de corpus de fixtures versionadas.

## Testes necessários
- Unitário: manifesto vazio/limite/limite+1, campo desconhecido, SHA inválido, duplicata, checked_add overflow, blob > max, DB > max.
- Integração: backup/restore round-trip, manifesto diverge do DB, blob faltando/extra/symlink, hash e tamanho incorretos, banco corrompido.
- Falhas: disco cheio, permissão negada, deadline, processo interrompido durante staging, cleanup não remove diretório externo.
- Stress: contagem máxima de blobs e bytes totais, medir peak RSS e espaço temporário; fixture descartável.
- Compatibilidade: restaurar fixtures v1 existentes em Windows e Linux.

## Critérios objetivos de aceite
- Manifesto é lido no máximo MAX_MANIFEST_BYTES+1; rejeitado acima.
- Contagem, bytes/blob, bytes totais, DB e staging respeitam budgets medidos.
- Round-trip preserva todos os hashes e metadados.
- Falha pré-publicação deixa destino ausente e staging da operação removido.
- TESTE NÃO EXECUTADO: todos os unitários, integração, falhas, stress e multi-plataforma.

## Limitações
Não foi executado backup/restore nem medido uso de memória/disco. Limites numéricos e política de versão do manifest requerem aprovação do GPT-6/owner. Não é recomendável introduzir migração de formato sem amostras reais de backups v1.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- **arquivo:** `src-tauri/src/limits.rs` | **função:** constantes de budget | **mudança:** limites manifest/blob/count/DB/total/staging/deadline | **teste:** boundary tests | **risco:** limites incompatíveis com backups existentes.
- **arquivo:** `src-tauri/src/backup.rs` | **função:** `BackupManifest`, `BlobManifest`, novo `validate_manifest` | **mudança:** deny unknown fields e validação estrutural antes de alocação | **teste:** manifest fixtures e fuzz JSON limitado | **risco:** rejeição de formatos legados.
- **arquivo:** `src-tauri/src/backup.rs` | **função:** `hash_file` e novo `copy_hash_limited` | **mudança:** streaming com contador, checked_add, deadline e SHA | **teste:** reader/writer limitado e hash conhecido | **risco:** erro de contagem/flush.
- **arquivo:** `src-tauri/src/backup.rs` | **função:** `create_project_backup` | **mudança:** budgets antes/durante cópia, abortar e limpar staging | **teste:** max count/bytes, disco cheio, falha injetada | **risco:** backup abortado para projetos grandes.
- **arquivo:** `src-tauri/src/backup.rs` | **função:** `restore_project_backup` | **mudança:** manifest bounded read, budget agregado e validação completa pré-stage/publish | **teste:** round-trip e corrupt fixtures | **risco:** maior tempo de pré-validação.
- **arquivo:** `src-tauri/src/tests.rs` | **função:** novos backup integration tests | **mudança:** round-trip e fixtures adversariais | **teste:** cargo test | **risco:** flakiness com filesystem.

## Fontes consultadas e integridade
- Wave spec: `WAVE_001_IMPLEMENTATION_MISSIONS.md` SHA `6ac5f4213961fa991e272fd146708bf78d3570fd`.
- Protocolo: `CENTRAL.md` e `INSTRUCTIONS.md`.
- Relatórios anteriores individuais: `reports/AUTOMATION_AI_MISSION_055_CHATGPT_GPT6.md` (lido antes desta proposta); missões relacionadas consultadas conforme dependência: 054, 058, 064, 041 e 050.
- Código principal: hashes indicados nas seções de evidência. Nenhum arquivo do produto foi alterado.
- **TESTE NÃO EXECUTADO:** build, cargo test, CI, integração, stress e testes multi-plataforma.

**Decisão:** proposta técnica, não implementação. Depende de aprovação do GPT-6 integrador antes de qualquer patch.
