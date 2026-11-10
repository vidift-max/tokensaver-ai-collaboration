# WAVE 001 — Missão 055: Backup/Restore budgets e manifest

## Identificação
- IA: ChatGPT | Modelo: GPT-6
- Especialidade: engenharia Rust/Tauri, SQLite, segurança de filesystem e concorrência
- Papel: análise independente read-only e proposta de patch
- Data: 2026-11-10
- Código principal: vidift-max/tokensaver-ai@v2-saas-alpha, HEAD 935b6fc5d0c126e93697a16f73d56bb3a4d1e55f
- Status próprio: REVIEW_REQUIRED (aguarda reconciliação e aprovação)

## Escopo e limites
Li o arquivo oficial WAVE_001_IMPLEMENTATION_MISSIONS.md, CENTRAL.md, INSTRUCTIONS.md, o relatório anterior da missão e relatórios correlatos. Inspecionei o código atual. Nenhum arquivo do TokenSaver principal foi alterado. Nenhum teste foi executado nesta etapa; os itens abaixo são propostas e testes necessários, não resultados.

## Análise do problema atual
Restore lê manifest inteiro com `fs::read`, desserializa Vec sem limite e cria mapas de blobs. DB é aberto e submetido a integrity_check/FK check sem teto de tamanho ou deadline. Hash usa buffer 64 KiB, o que limita buffer, não bytes totais, CPU ou duração. Blobs são copiados sem limite agregado. Create backup também percorre e copia todos os blobs e não impõe budget global. Manifest verifica formato/projeto/schema e igualdade de conjunto, mas não tem teto pré-parse nem política de campos desconhecidos.

## Evidências no código
- `src-tauri/src/backup.rs::restore_project_backup`: `fs::read(manifest_path)`, parse, hash DB, loops sobre blobs, cópia para stage.
- `backup.rs::create_project_backup`: SELECT sem limite, cópia/hash de todos os blobs.
- `backup.rs::hash_file`: streaming 64 KiB sem contador máximo.
- `BackupManifest.blobs: Vec<BlobManifest>`: vetor ilimitado; structs sem `deny_unknown_fields`.
- `src-tauri/src/limits.rs`: sem limites específicos de backup/restore.
- Correlatos lidos: missões 056, 058, 059 e 064.

## Solução proposta
Criar política separada: max manifest bytes, max blobs, max blob bytes, max total blob bytes, max DB bytes, max total backup bytes e deadline. Valores precisam aprovação. Ler manifest via handle com metadata e `take(max+1)`, rejeitando antes de parse se exceder. Adicionar `deny_unknown_fields` e validação semântica (version, project/schema, timestamp, SHA lowercase hex, filename canônico, duplicatas, contagem e soma com checked_add). Não montar mapa antes de validar limites. Medir DB antes de abrir e novamente no staging; tratar DB como dado não confiável mesmo com hash, porque hash só prova consistência com manifest. Substituir cópia/hash por helper streaming que reserva budget cumulativo e deadline. Validar manifest e DB em ambas as direções; rejeitar extras e links. Staging deve ser exclusivo e cleanup ownership-bound; publicar só após sync/validação usando no-replace da Missão 056. Não mudar formato v1 silenciosamente; se necessário, introduzir v2 e manter leitor v1 bounded.

## Invariantes de segurança
- Nenhum arquivo ultrapassa teto individual ou agregado.
- Manifest limitado antes do parse; lista limitada antes de materializar coleções.
- DB e blobs correspondem exatamente ao manifest; hashes/tamanhos conferidos.
- Campo/arquivo/path/duplicata inválidos falham fechado.
- Cleanup só remove staging pertencente à operação.
- Budget/deadline excedido deixa destino intacto e não publica projeto parcial.

## Riscos
Backups históricos podem exceder novos tetos; deny_unknown_fields exige versionamento; integrity_check pode demorar e deve diferenciar timeout de corrupção; espaço livre é estimativa sujeita a corrida; ENOSPC requer rollback; case-folding de nomes varia entre plataformas.

## Dependências
Missão 056 (no-replace), 063 (handle-safe paths), 058/059/064 (budget/deadline), 061 (migrações/schema) e aprovação de valores/format version.

## Testes necessários
Unitários: manifest 0/max/max+1, JSON inválido, campo extra, SHA/nome inválido, duplicata, count max+1, overflow, bytes totais max+1. Integração: DB/blob grandes, mismatch de hash/tamanho, manifest vs DB diferente, arquivo extra, symlink, ENOSPC e cleanup. Estresse: milhares de blobs pequenos, poucos grandes, backups concorrentes, alteração de origem e restore simultâneo; medir RSS/CPU/disco/tempo. **TESTE NÃO EXECUTADO:** todos os testes/build/estresse.

## Critérios objetivos de aceite
Manifest oversized é rejeitado antes do parse; limites de count/bytes/deadline testados; restore aborta sem staging órfão ou projeto parcial; hash e conjunto são exatos; erro de limite distinto de corrupção; testes Linux/Windows.

## Limitações
Valores numéricos pendem de aprovação e dados de uso. Hash streaming não limita CPU/tempo. SQLite integrity_check requer cancelamento/deadline ou isolamento operacional. Proposta não implementada.

## Relação com trabalho anterior
Li relatório 055 e relacionados 056/058/059/064. Esta proposta acrescenta validação pré-alocação, contrato manifest fechado/versionado, budget cumulativo também na criação, verificação bidirecional e rollback com ownership.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
| arquivo | função | mudança | teste | risco |
|---|---|---|---|---|
| `src-tauri/src/limits.rs` | constantes | budgets manifest/DB/blob/count/total/deadline | boundary/overflow | backups válidos rejeitados |
| `src-tauri/src/backup.rs` | manifest structs | deny_unknown_fields + validação fechada | fixtures v1 e campo extra | compatibilidade futura |
| `src-tauri/src/backup.rs` | `hash_file`, novo copy helper | contador, deadline e cópia bounded | blob max/max+1 | overhead |
| `src-tauri/src/backup.rs` | `create_project_backup` | budget total, manifest e cleanup | stress/ENOSPC | operações maiores falham |
| `src-tauri/src/backup.rs` | `restore_project_backup` | bounded read, validação pré-alocação, staging ownership | malformed fixtures/restore | latência e legado |
