# WAVE 001 — Missão 057: Import Roots — atomicidade e limites

## Identificação
- Nome da IA: ChatGPT
- Modelo: GPT-6 (OpenAI)
- Especialidade: Rust, persistência de configuração, concorrência e segurança de paths
- Função: proposta técnica independente pós-auditoria; somente leitura
- Data: 2026-11-10
- Status: PROPOSTA PRONTA PARA APROVAÇÃO

## Objetivo
Tornar as operações de Import Roots atômicas e previsíveis, limitar o tamanho da configuração antes do parse e garantir que add/remove não percam atualizações concorrentes.

## Análise do problema atual
`add_root` e `remove_root` executam load-modify-save sem lock compartilhado. Duas chamadas podem carregar a mesma versão e a última gravação sobrescrever a outra. `save_roots` usa nome temporário fixo, o que causa colisão entre operações. No Windows, remove o arquivo anterior antes de renomear o temporário, abrindo janela em que a configuração pode desaparecer se rename falhar.

`load_roots` faz `read_to_string` e desserializa antes de aplicar `MAX_IMPORT_ROOTS=32`. `add_root` limita o caminho a 4096 bytes, mas `remove_root` e a validação de roots persistidos não aplicam o mesmo limite por caminho. `open_verified` já compara identidade do arquivo aberto com identidade esperada; não confundir o problema de configuração com ausência de proteção geral na importação individual.

## Evidências no código
- `src-tauri/src/path_guard.rs::load_roots`: leitura integral e parse antes do limite de 32.
- `save_roots`: `path.with_extension("json.tmp")`, `fs::write`, e no Windows `remove_file(path)` antes do `rename`.
- `add_root`: valida path.len() <= 4096, faz load-modify-save sem sincronização.
- `remove_root`: não aplica limite de 4096 bytes e também faz load-modify-save.
- `open_verified`: canonicalização, verificação de roots e comparação de identidade do handle; controle já existente deve ser preservado.
- `src-tauri/src/limits.rs`: `MAX_IMPORT_ROOTS=32`, sem limite de bytes do JSON.
- HEAD do produto consultado: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.

## Solução proposta
1. Criar política central para limite de bytes do JSON, quantidade de roots e tamanho máximo do path (em bytes UTF-8). Candidato de arquivo: 160 KiB, calculado para comportar 32 paths até 4096 bytes mais overhead JSON; confirmar em testes com paths Windows e Unicode.
2. Ler com `File::take(MAX_IMPORT_ROOTS_FILE_BYTES + 1)`; rejeitar ao primeiro byte excedente antes de desserializar.
3. Criar `validate_roots` aplicada tanto a dados persistidos quanto aos dados que serão salvos: máximo 32; cada path não vazio, absoluto, sem CurDir/ParentDir, dentro do limite de bytes; unicidade segundo `same_path`; canonicalização/validação de diretório preservada.
4. Aplicar lock comum em toda operação load-modify-save. Preferir lock advisory cross-process com liberação automática pelo SO; se a aplicação garantir singleton de processo, Mutex global pode ser camada adicional, não substituto sem prova.
5. Adquirir o lock antes de carregar e mantê-lo até o commit da gravação. `list_roots` deve obter snapshot consistente; `open_verified` deve carregar snapshot consistente e liberar o lock depois da leitura/validação da configuração.
6. Criar temporário único no mesmo diretório, usando UUID e `OpenOptions::create_new(true)`; escrever, flush e sync_all antes de publicar.
7. Substituição sem perda: POSIX rename atômico sobre arquivo no mesmo filesystem; Windows usar ReplaceFileW para substituir existente e MoveFileExW sem replace para primeira criação. Não remover o original antecipadamente.
8. Em qualquer falha, remover apenas o temporário desta operação; o arquivo de configuração anterior permanece intacto.
9. `remove_root` deve aplicar os mesmos limites de input de `add_root`. Se o path não existir mais, comparar de forma segura com a forma persistida e documentar o comportamento.
10. A função de gravação deve validar serialização final contra limite de bytes antes de abrir temporário.

## Arquivos envolvidos
- `src-tauri/src/path_guard.rs`
- `src-tauri/src/limits.rs`
- `src-tauri/Cargo.toml` se for adotado lock cross-process/bindings Windows
- testes em `path_guard.rs` e/ou `src-tauri/src/tests.rs`

## Funções envolvidas
- `load_roots`
- `save_roots`
- `add_root`
- `remove_root`
- `list_roots`
- `open_verified` (somente leitura de snapshot e integração do lock)
- novo `validate_roots` / `with_roots_lock`

## Invariantes de segurança
- JSON nunca é lido acima do limite.
- Número persistido de roots nunca excede 32.
- Nenhum path excede o limite comum de 4096 bytes.
- Add/remove são serializados desde o load até o commit; não há lost update.
- Temporário é exclusivo e pertence a uma operação.
- Falha de save nunca apaga nem corrompe o arquivo válido anterior.
- `open_verified` continua rejeitando links/redirecionamentos e verificando identidade do handle.
- Config inválida resulta em erro fail-closed, nunca em lista vazia silenciosa.

## Riscos de regressão
- Locks cross-process introduzem bloqueio e tratamento de processos encerrados; lock advisory precisa liberar automaticamente no crash.
- APIs de replace divergem entre POSIX e Windows.
- O limite de 160 KiB é candidato; nomes longos/unicode exigem teste de tamanho real em bytes.
- Canonicalizar todos os roots no load pode deixar configuração inacessível quando um diretório removido; preservar comportamento explicitamente definido para listagem/import.
- Mudança de erro pode alterar feedback frontend.

## Dependências
- Missão 063 para política consistente de symlink/junction e validação física de diretórios.
- Catálogo de limites 058.
- Dependência de locking multiplataforma a ser aprovada após examinar Cargo.lock/Cargo.toml; não presumir crate já instalada.
- Testes Linux/Windows.

## Testes necessários
### Unitários
- JSON com 32 e 33 roots.
- JSON exatamente no limite e limite+1.
- path exatamente 4096 bytes e 4097 bytes, incluindo Unicode (bytes, não chars).
- JSON truncado, inválido, duplicatas e paths relativos/parent.
- add/remove rejeitam path longo de forma idêntica.

### Integração/concorrência
- Duas chamadas add de roots diferentes; ambas devem sobreviver no arquivo final.
- add e remove concorrentes sobre raízes diferentes e mesma raiz.
- múltiplos processos disputando lock.
- Falha ao escrever, flush, sync e replace; arquivo anterior continua parseável e idêntico.
- list/open_verified durante atualização; nunca ler JSON parcial.

### Estresse/plataforma
- Centenas de operações concorrentes add/remove; count <= 32 e sem lost updates.
- Teste de crash do processo enquanto mantém lock; próximo processo recupera.
- Windows e Linux; validar comportamento de replace e locks no filesystem suportado.

## Critérios objetivos de aceite
1. Leitura do JSON é bounded antes do parse.
2. Todos os caminhos de entrada/persistidos seguem o mesmo limite de bytes.
3. Operações mutáveis usam lock do início do read-modify-write até commit.
4. Temporário é create-new, único e no mesmo diretório.
5. Nenhuma falha de replace remove o arquivo válido anterior.
6. Testes concorrentes provam ausência de lost updates e count <= 32.
7. `open_verified` continua passando os testes atuais e novos de symlink/identity.

## Limitações
- Inspeção estática apenas; nenhum teste de concorrência ou de falha de disco foi executado.
- O mecanismo de lock e replace depende de plataforma e precisa ser validado no CI real.
- O limite de 160 KiB é proposta inicial derivada do máximo teórico de paths, não benchmark.

## Testes executados
**TESTE NÃO EXECUTADO.** Nenhum build ou teste foi executado.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- arquivo: `src-tauri/src/limits.rs`; função/módulo: constantes; mudança: adicionar limite máximo de bytes do JSON e tamanho comum do path; teste: fronteira bytes exatos/+1; risco: bloquear configuração legada muito grande.
- arquivo: `src-tauri/src/path_guard.rs`; função: `load_roots`; mudança: leitura limitada antes de parse e validação comum; teste: JSON oversized/33 roots/path inválido; risco: configuração legada rejeitada.
- arquivo: `src-tauri/src/path_guard.rs`; função: `add_root/remove_root`; mudança: lock abrangendo load-modify-save e validação simétrica; teste: concorrência add/remove; risco: contention/lock deadlock.
- arquivo: `src-tauri/src/path_guard.rs`; função: `save_roots`; mudança: temp UUID create_new, sync e replace atômico sem remover original; teste: falha de write/replace; risco: diferenças POSIX/Windows.
- arquivo: `src-tauri/Cargo.toml`; módulo: dependência de lock; mudança: adicionar somente crate cross-platform aprovada se necessária; teste: cargo check Linux/Windows; risco: dependência nativa/licença.
