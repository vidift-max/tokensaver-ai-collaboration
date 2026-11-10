# WAVE 001 — Missão 055: Backup/Restore Resource Budgets
- IA/modelo: ChatGPT — GPT-6 (OpenAI)
- Data: 2026-11-10
- Status: PROPOSTA / aguardando aprovação do integrador
- Produto: vidift-max/tokensaver-ai, branch v2-saas-alpha, HEAD 935b6fc5d0c126e93697a16f73d56bb3a4d1e55f (read-only)

## Análise do problema atual
O fluxo já tem boas verificações de integridade: backup usa SQLite online backup, integrity_check, staging e SHA; restore valida formato/schema, hash do DB, integrity_check, foreign_key_check, igualdade entre blobs do manifest e DB, hashes/tamanhos e arquivos extras. A lacuna é resource governance. O manifest é lido integralmente antes de qualquer teto; vetor de blobs é desserializado sem limite; DB/blobs são hasheados e copiados sem contagem agregada de bytes, quantidade ou deadline. Criação também percorre todos os blobs e copia sem orçamento agregado. Hash individual não é proteção contra exaustão.

## Evidências no código
- src-tauri/src/backup.rs: create_project_backup() enumera blobs, copia e calcula hash sem teto global.
- restore_project_backup(): fs::read(manifest.json) antes do parse; itera manifest.blobs; hash_file() percorre arquivo integral; fs::copy() copia cada blob.
- BackupManifest/BlobManifest não declaram contagem/tamanho total.
- hash_file() usa buffer de 64 KiB, mas sem budget.
- Falha normal limpa staging; crash abrupto pode deixar staging órfão.

## Solução proposta
Centralizar limites em limits.rs, separados por manifest, DB, quantidade de blobs, blob individual, bytes totais e duração. Defaults apenas para discussão (sem telemetria): manifest 8 MiB, DB 256 MiB, 10.000 blobs, blob 100 MiB, payload total 2 GiB, duração 5 min; aprovação e teste de compatibilidade antes de congelar.
Ler manifest via File::take(MAX_MANIFEST+1) e rejeitar antes de desserializar. Validar formato, project_id, schema, SHA hexadecimal canônico, filename=sha, duplicatas, tamanhos não negativos e soma checked_add (overflow rejeita). Abrir handles e conferir metadata real; não confiar em metadados declarados. Implementar copy_hash_limited() que faz streaming, conta bytes e calcula SHA numa passagem. Na criação, aplicar budget durante enumeração e cópia; no restore, validar budget antes de staging e novamente durante cópia. Se exceder, cancelar, remover apenas staging da operação e nunca publicar projeto parcial. Cleanup de staging órfão deve ter ownership UUID/idade e não tocar em staging ativo.

Compatibilidade: não adicionar deny_unknown_fields nem mudar manifest v1 sem version bump e fixtures de backups antigos. Se forem adicionados totais ao formato, definir versão nova; para v1, calcular totais durante validação.

## Arquivos e funções envolvidos
- src-tauri/src/backup.rs: BackupManifest, BlobManifest, hash_file(), create_project_backup(), restore_project_backup(); novo copy_hash_limited().
- src-tauri/src/limits.rs: budgets aprovados.
- src-tauri/src/tests.rs e testes internos backup.rs: fixtures e limites.
- src-tauri/src/db.rs: somente se necessário para política de snapshot/timeout.

## Invariantes de segurança
Manifest limitado antes do parse; somas com checked arithmetic; tamanho real do handle prevalece sobre DB/manifest; blobs regulares e confinados; manifest e DB descrevem exatamente mesmo conjunto; restore nunca publica parcial; falha limpa apenas staging próprio; backup existente nunca sobrescrito.

## Riscos de regressão
Teto baixo rejeita backups legítimos; formato alterado quebra compatibilidade; deadline falha em discos lentos; streaming deve evitar duplicar I/O; cleanup pode apagar operação concorrente se não usar ownership.

## Dependências
Missão 058 (budgets), 056 (destino/publicação), 063 (filesystem), 064 (resource exhaustion), 065/066 (integração/regressão). Coordenar budgets e staging com 056/063.

## Testes necessários
Unitários: manifest no limite/+1, blob count, overflow, SHA/filename duplicado, valores inválidos. Integração: round-trip, manifest gigante, muitos blobs, blob individual/total acima do teto, arquivo extra, symlink, tamanho declarado divergente. Falhas: disco cheio, permissão, interrupção e cleanup. Stress: milhares de blobs e payload próximo do máximo. TESTE NÃO EXECUTADO: nenhum build, backup, restore, benchmark, stress ou teste dinâmico foi executado.

## Critérios objetivos de aceite
Manifest acima do teto rejeitado antes de parse; nenhuma operação excede budgets aprovados; overflow rejeita; round-trip preserva DB integrity/foreign keys e conjunto de hashes; falha não publica destino nem remove arquivos externos.

## Limitações
Defaults não foram calibrados com uso real. A análise é estática e não valida crash, disco cheio ou duração em dispositivos lentos.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- arquivo: src-tauri/src/backup.rs; função: restore_project_backup(); mudança: manifest bounded, validação estrutural e budgets agregados; teste: manifest/blob acima do limite e round-trip; risco: compatibilidade e rejeição de backups grandes.
- arquivo: src-tauri/src/backup.rs; função: create_project_backup()/hash_file(); mudança: budget e copy_hash_limited streaming; teste: volume máximo, disco cheio e cleanup; risco: I/O e deadline.
- arquivo: src-tauri/src/limits.rs; função: constantes; mudança: limites centralizados; teste: boundary; risco: teto inadequado.