# WAVE 001 — Missão 057: Import Roots — proposta independente

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: Rust, persistência de configuração e concorrência de filesystem
- Papel: auditoria estática independente e proposta de patch | Data: 2026-11-10
- Status próprio: REVIEW_REQUIRED; aguarda reconciliação/aprovação

## Análise do problema atual
`add_root` e `remove_root` executam load-modify-save sem lock; chamadas concorrentes podem perder alterações. `save_roots` usa temporário fixo `import_roots.json.tmp`, então writers podem sobrescrever/remover o tmp um do outro. No Windows, remove o config atual antes de rename, criando janela sem arquivo e perda se rename falhar. `load_roots` faz read_to_string integral e só verifica MAX_IMPORT_ROOTS após parse. `remove_root` não aplica cap 4096 bytes nem a mesma canonicalização de add.

## Evidências no código
Projeto principal `vidift-max/tokensaver-ai`, branch `v2-saas-alpha`, HEAD `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- `src-tauri/src/path_guard.rs::load_roots`: read_to_string sem byte cap e valida contagem pós-parse.
- `path_guard.rs::save_roots`: tmp fixo e remove-before-rename no Windows.
- `path_guard.rs::add_root`: limite 4096, canonicalize/dedup, sem lock.
- `path_guard.rs::remove_root`: limite assimétrico, compara path raw.
- Relatórios anteriores lidos: 057, 058, 059 e 063.

## Solução proposta
Criar lock interprocesso estável `import_roots.lock` e manter o lock durante read-modify-write. Não apagar o arquivo de lock ao liberar, evitando corrida de inode; Mutex in-process não basta se múltiplas instâncias forem possíveis. `load_roots` deve verificar tamanho do handle e ler no máximo max+1 antes de parse; validar contagem, bytes por path, UTF-8, duplicatas e schema. Unificar validação add/remove: 4096 bytes, absolute, sem parent/current components e canonicalização consistente. Definir como remover root que deixou de existir sem seguir links. `save_roots` deve criar tmp único com create_new no mesmo diretório, escrever e sync_all, e substituir atomicamente por primitiva cross-platform que preserve o arquivo antigo em falha. Proibido remover config antes de replace. Sync parent quando suportado. Não sobrescrever JSON corrompido automaticamente; retornar erro recuperável. Acrescentar teto agregado de config e versão de schema.

## Invariantes de segurança
- Updates confirmados não se perdem em concorrência.
- Readers veem JSON antigo ou novo completo, nunca parcial.
- Falha de gravação preserva config anterior.
- Parse limitado antes de alocação.
- add/remove têm regras simétricas; aliases não criam duplicatas.
- open_verified falha fechado com roots inválidos.
- Lock cobre todo load-modify-save.

## Riscos
Lock advisory coordena apenas processos cooperantes; replace varia por SO; canonicalize de root removido exige política; cap pode rejeitar config antiga; dependência cross-platform adiciona manutenção.

## Dependências
Missão 063 para canonicalização/handle-safe; 058/064 para budgets; dependência de lock/replace cross-platform; decisão GPT-6 sobre multi-instância e schema.

## Testes necessários
Unitários: JSON max/max+1, inválido, 32/33 roots, path 4096/4097, duplicatas Windows, relative/parent/link. Concorrência: múltiplos threads e processos add/remove sem lost update. Fault injection em write/sync/replace preserva hash do arquivo anterior. Cross-platform Windows/Linux/macOS. open_verified durante revogação. **TESTE NÃO EXECUTADO:** cargo test, concorrência, fault injection e matriz SO.

## Critérios objetivos de aceite
Sem lost update multi-processo; readers nunca veem JSON parcial; falha preserva config; oversized rejeitado antes do parse; validação add/remove simétrica; testes Windows/Linux passam.

## Limitações
Remover root inexistente exige regra explícita. Lock advisory não protege contra processo local hostil que ignore lock; ACL e handle APIs dependem da Missão 063.

## Relação com trabalho anterior
Além do lost update apontado no relatório anterior, confirmei riscos concretos do tmp compartilhado, janela remove-before-rename no Windows, limite assimétrico e necessidade de snapshot consistente para readers.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
| arquivo | função | mudança | teste | risco |
|---|---|---|---|---|
| `src-tauri/src/path_guard.rs` | `load_roots` | bounded read e validação pré-parse | max/max+1 e 32/33 | config antiga |
| `src-tauri/src/path_guard.rs` | `add_root`, `remove_root` | lock interprocesso sobre read-modify-write | multiprocess lost-update | deadlock/contenção |
| `src-tauri/src/path_guard.rs` | `save_roots` | tmp create_new + sync + atomic replace | fault injection | diferenças SO |
| `src-tauri/src/path_guard.rs` | `list_roots`, `open_verified` | snapshot/normalização consistente | revoke/read race | semântica |
| `src-tauri/src/limits.rs`, Cargo.toml | limites/dependência | max config/path e lock cross-platform | boundary/build | manutenção |
