# WAVE 001 — REGISTRO DE PROGRESSO DE IMPLEMENTAÇÃO

Data: 2026-11-10  
Integrador: GPT-6  
Produto: `vidift-max/tokensaver-ai`  
Branch: `v2-saas-alpha`  
HEAD confirmado: `96a08c486efa350441424803be5e5c1dc5835f33`

## Resumo

A implementação autorizada da Wave 001 avançou no código principal. Os patches foram feitos em commits pequenos e sequenciais. **A Wave 001 ainda NÃO está concluída**: testes locais não foram executados, os workflows de CI disparados pelos pushes ainda estavam em execução/fila no momento desta atualização e permanecem lacunas funcionais indicadas abaixo.

## Alterações confirmadas no produto

| Missão | Alteração | Commit(s) relevante(s) | Situação |
|---|---|---|---|
| 052 | `set_project_memory` usa transação SQLite IMMEDIATE para existência + COUNT + UPSERT + commit; removida abertura duplicada de conexão. | `31052a54ec0b9ce5eaee251c83c801d48fb5bbb4`, `96a08c486efa350441424803be5e5c1dc5835f33` | IMPLEMENTADO — testes pendentes |
| 063/056 | Primitive de publicação no-replace em Linux/Windows; restore usa publicação exclusiva; inicialização reivindica diretório com `create_dir`. | `65d2f338289f21089b639967ba042d2928e9f6e5`, `5fdb90438111c311f6d606ec57e527a0acbf90d2`, `46a0908e4777210f5e376203332184a7c5c6d0ce` | IMPLEMENTADO — testes de corrida/plataforma pendentes |
| 063 | Hash/cópia limitada por bytes reais; cópia publica via temporário exclusivo, sincronizado e no-replace. | `071fc903817c21d047d965230bfb72d8022a13b2`, `d2d615bbedbda6f3f880fffb2cf9e5e7e1b7dbcf` | IMPLEMENTADO — testes pendentes |
| 051 | Smart Context lê blobs com limite individual/agregado e agora conta cada linha candidata examinada, inclusive registros inválidos, antes da validação do blob. | `a1f1ca9c611377168c09a191c2ae858d5861c119`, `00b43c16ae309271b7909bafa0bbaf344b719acc`, `182688138082eaf924301a4bba83dda6c5b487c9` | PARCIAL — falta deadline, indicador de resultado parcial e métricas expostas |
| 055 | Manifest, quantidade de blobs, DB, blob individual e payload agregado limitados; cópias usam helper limitado; validações de integridade preservadas. | `36abe8542ac4119a18c62a6cfeccf0d9b84fe40f` e commits prévios da missão 055 | PARCIAL — budgets precisam benchmark; deadline/cancelamento e testes pendentes |
| 057 | JSON limitado, lock cross-process, validação de roots e gravação temporária com replace atômico. | `034a264154715892df5f640dc060d6022adedf13` e commits prévios da missão 057 | IMPLEMENTADO — testes cross-process/Windows pendentes |

## Revisão adicional nesta rodada

1. **Smart Context:** o limite anterior podia não contar registros inválidos como arquivos examinados. Corrigido para incrementar o contador imediatamente após obter cada linha do banco, antes de validar SHA/caminho/arquivo. Isso impede que linhas inválidas contornem o limite de candidatos.
2. **Cópia limitada:** o temporário agora é aberto com `create_new(true)`, evitando seguir/sobrescrever um arquivo temporário preexistente por colisão ou interferência local.
3. **Project Memory:** removida uma segunda abertura redundante do mesmo banco antes da transação IMMEDIATE.

## CI e testes

- O push do commit `d2d615bbedbda6f3f880fffb2cf9e5e7e1b7dbcf` disparou o workflow **TokenSaver AI CI**, run `42923594702`, que estava `in_progress` na consulta.
- O push do commit `96a08c486efa350441424803be5e5c1dc5835f33` disparou o run `42923633528`, que estava `queued` na consulta.
- O status combinado de commit ainda não apresentava status checks reportados.
- **TESTES LOCAIS NÃO EXECUTADOS:** `cargo check`, `cargo test`, build frontend, stress/concurrency, fault injection e matriz de plataformas.
- A existência de workflow em fila/em execução não equivale a build/testes aprovados.

## Lacunas e riscos restantes

- 051: o contrato de retorno continua sendo `Vec<ContextHit>`; não há `truncated`, `stop_reason`, contagem/bytes expostos ou deadline cooperativo. A saída é limitada indiretamente pelo número de hits e tamanho dos excerpts, mas não existe budget de saída formal.
- 055: os limites fixos introduzidos são candidatos operacionais e não foram validados por benchmark; a operação ainda não possui deadline cooperativo global.
- 056/063: faltam testes reais de concorrência restore×restore, restore×initialize, comportamento em filesystem adversarial e validação Windows. O suporte no-replace está implementado para Linux/Windows e falha fechado em outras plataformas.
- 057: faltam testes reais de lock entre processos, falha durante replace e Windows; revisar adicionalmente ciclo de vida de handle/lock na plataforma Windows.
- 052: faltam testes concorrentes com conexões SQLite independentes em 999/1000 entradas e isolamento entre projetos.
- A correção de Smart Context conta linhas candidatas, mas ainda não implementa deadline nem telemetria de truncamento.

## Próximas etapas

1. Acompanhar os runs `42923594702` e `42923633528` até conclusão e corrigir falhas reais de build/teste.
2. Criar testes determinísticos para 052, 051 e 063 antes de ampliar escopo.
3. Executar testes de restore e import roots em Linux e Windows; não declarar cross-platform concluído sem evidência.
4. Completar contrato de resultado parcial/deadline de 051 após inventariar consumidores frontend.
5. Revisar budgets e operação longa de 055.
6. Reauditar 051/052/055/056/057/063 e só então avançar para regressão 065/066 e gate 070.

**STATUS GERAL: IMPLEMENTAÇÃO PARCIAL — CI EM ANDAMENTO — TESTES E REAUDITORIA PENDENTES.**


## Atualização de validação — correção identificada pelo CI

Os runs Windows `42923097891` e `42923250586` falharam no `cargo check` com erro E0317 em `path_guard.rs`: o bloco condicional Windows de `save_roots_unlocked` terminava em `()`, enquanto a função exige `Result<(), AppError>`. A compilação Linux desses runs terminou com sucesso.

Correção aplicada: o ramo Windows agora retorna explicitamente `Ok(())` após o `MoveFileExW` bem-sucedido; também foi removido `mut` desnecessário na leitura limitada. Commit: `a22fce19cbc3daab3e57a7e1877e13c588362787`.

Hardening adicional: a cópia limitada só remove o temporário em caso de falha se esta própria operação conseguiu criá-lo com `create_new`; evita apagar um caminho temporário preexistente que não pertence à operação. Commit: `9976a32ff169fcc2a978636f50788204ded3a821`.

**Validação posterior:** os workflows disparados pelos commits de correção estavam em andamento/na fila na última consulta. Portanto, a correção Windows ainda aguarda confirmação de `cargo check` e os testes continuam não aprovados até a conclusão dos runs.


## Rodada adicional — 10/11/2026

- Inspecionados os logs de CI dos commits anteriores. O erro E0317 foi reproduzido no Windows porque o bloco `#[cfg(windows)]` de `save_roots_unlocked` não retornava `Result<(), AppError>`. O arquivo atual contém `Ok(())` após o `MoveFileExW` bem-sucedido, commit `a22fce19cbc3daab3e57a7e1877e13c588362787`.
- A compilação Linux já terminou com sucesso no run `42923788523`; o job Windows ainda estava em execução na última consulta.
- O run `42923854848` (commit `9976a32ff169fcc2a978636f50788204ded3a821`) também tinha Linux concluído com sucesso e Windows em execução.
- Removido aviso de mutabilidade desnecessária do leitor de manifest em `backup.rs`, commit `97f28f18d4cb19edbd4f0794cd312e0932abf71a`.
- O novo run do commit `97f28f18d4cb19edbd4f0794cd312e0932abf71a` é `42924285728`, ainda em execução na última consulta.
- Os runs mais antigos falharam devido ao E0317 no código anterior à correção; não devem ser confundidos com o resultado dos commits posteriores.
- **Ainda não há confirmação de aprovação do Windows no commit mais recente.** Nenhum `cargo test` foi executado ou aprovado nesta rodada; o CI atual executa `cargo check`, não a suíte completa.

HEAD atual registrado: `97f28f18d4cb19edbd4f0794cd312e0932abf71a`.


## Atualização — cobertura de filesystem, 10/11/2026

- HEAD do produto avançou para `156d143b74e0a1a2902f76d7afacea306c8612b8`.
- Em `src-tauri/src/filesystem.rs`, foram adicionados três testes determinísticos: cópia com orçamento exatamente igual ao tamanho do arquivo; hash SHA-256 com limite exato e digest conhecido; rejeição de hash quando o arquivo excede o orçamento.
- Esses testes foram adicionados ao código, mas **ainda não foram executados**. O workflow vigente do projeto está configurado para `cargo check`; sua aprovação não substitui `cargo test`.
- O run `42924285728` (commit anterior `97f28f18d4cb19edbd4f0794cd312e0932abf71a`) permanecia em execução na última consulta, com jobs Linux e Windows sem conclusão.
- O novo commit dispara nova execução de CI; o resultado será acompanhado separadamente. Não declarar sucesso até obter conclusão explícita dos dois jobs.


## Atualização — concorrência no-replace e validação por plataforma

- Novos testes adicionados em `src-tauri/src/filesystem.rs`: disputa concorrente entre duas publicações para o mesmo destino (exatamente um vencedor), cópia que recusa substituir destino preexistente preservando o conteúdo original.
- Commits de cobertura desta rodada: `156d143b74e0a1a2902f76d7afacea306c8612b8`, `8077b8b3b5cc7754544df7d1921e6183486c9b06` e ajuste de compatibilidade do teste `7e334222f182966aff65c29edfdb58ffc0001226`.
- Confirmação retrospectiva importante: o run `42923788523`, para o commit `a22fce19cbc3daab3e57a7e1877e13c588362787`, concluiu com sucesso nos dois jobs: `foundation` (Linux) e `foundation-windows` (Windows). Isso confirma o `cargo check` daquele commit corrigido, não dos commits posteriores nem a execução dos testes unitários.
- No momento da consulta, o run `42924526640` para o commit `156d143b74e0a1a2902f76d7afacea306c8612b8` ainda estava em execução em Linux e Windows. Os commits subsequentes de testes geraram execuções ainda mais recentes, que precisam ser acompanhadas.
- **Nenhum `cargo test` foi executado nesta rodada.** Testes novos são cobertura adicionada, ainda não evidência de aprovação.


## Missão 052 — extração testável e testes de concorrência

- O bloco transacional foi extraído para `set_project_memory_in_db`, mantendo o comando Tauri como camada de validação/caminho e preservando a transação `IMMEDIATE`.
- Foram adicionados testes para: atualizar uma chave quando o projeto já atingiu 1000 entradas; recusar nova chave no limite; manter limite isolado por projeto; e dois escritores em conexões SQLite independentes disputando a última vaga, verificando que apenas um grava e a contagem final permanece em 1000.
- Commits: `7345b8ae79720210059b4845cb041a8674382850` e `9f6c866f2fc6ca41d8780d0b3228549f22e867f3`.
- **Testes ainda não executados**; os testes adicionados exigem confirmação por `cargo test` em CI/ambiente local. O workflow atual executa `cargo check`, portanto não é evidência suficiente para esses casos.


## Missão 051 — inventário do contrato frontend

- Inspecionados `src/api.ts` e `src/App.tsx`: o wrapper `api.smartContext` tipa o retorno como `ContextHit[]`; o componente mantém os hits em estado e renderiza caminho, score, versão, estimativa de tokens e excerpt.
- A interface atual não recebe nem apresenta sinalização de truncamento, motivo de parada, arquivos/bytes examinados ou budget consumido.
- Para não quebrar o contrato existente, esta rodada não alterou o formato de retorno. A conclusão de 051 continua parcial até uma proposta de contrato compatível (por exemplo, versão nova do comando ou migração coordenada de API + UI) e implementação de deadline/telemetria.
- CI do commit atual `9f6c866f2fc6ca41d8780d0b3228549f22e867f3`: run `42924706642`; na última consulta os jobs Linux e Windows permaneciam em execução.


## Correção de evidência CI — 10/11/2026

- Corrijo explicitamente a anotação anterior que dizia que o workflow executava apenas `cargo check`: a versão atual de `.github/workflows/ci.yml` executa **`cargo check` e `cargo test`**, tanto em Linux quanto em Windows, antes de `npm install` e `npm run build`.
- Para o HEAD `9f6c866f2fc6ca41d8780d0b3228549f22e867f3`, run `42924706642`: os dois jobs estão em execução. Na consulta dos passos, Linux e Windows ainda estavam em `cargo check`; `cargo test` permanecia pendente. Logo, os testes ainda não foram confirmados.
- Runs dos commits intermediários também estavam em execução. O resultado de um commit anterior não é prova para o HEAD atual.


## Correção de compilação — Project Memory

- A consulta aos logs do run `42924680721` identificou falha real de sintaxe: delimitador `}` excedente em `src-tauri/src/project_memory.rs:64`, introduzido durante a extração do helper testável.
- Corrigido no commit `a2a3cd86350b06152d6501cdbf2857e43d3ea770` (remoção do delimitador excedente).
- O run que falhou pertence ao commit anterior `7345b8ae79720210059b4845cb041a8674382850`; não deve ser apresentado como estado da correção atual.
- A correção dispara nova CI. Ainda é necessário confirmar `cargo check`, `cargo test` e os passos frontend em Linux e Windows.


## Missão 055 — pré-validação do orçamento SQLite/WAL

- Adicionada `validate_source_database_budget` em `backup.rs`: antes de criar staging e iniciar a cópia SQLite, verifica o tamanho combinado de `db.sqlite` e `db.sqlite-wal`, com soma protegida contra overflow; recusa WAL que não seja arquivo regular e excedente do orçamento de 512 MiB.
- A validação final do banco de backup via hash limitado permanece como segunda barreira após a cópia consistente, pois o tamanho pode mudar por atividade concorrente e o preflight não substitui a validação do snapshot.
- Testes adicionados: banco + WAL dentro do orçamento e WAL não regular rejeitado.
- Commits: `8b2cdb5c0b25fe846231c092a14bf1d05efea185` e `15fd47b61a9f8edda5fdbdb26bcdfc5f63ce88cc`.
- Os testes ainda aguardam execução do CI. O preflight é uma verificação prévia, não uma garantia contra crescimento concorrente posterior.


## Estado CI mais recente da rodada

- HEAD do produto: `15fd47b61a9f8edda5fdbdb26bcdfc5f63ce88cc`.
- Run `42925059733` para esse HEAD: Linux e Windows em execução; não há conclusão disponível ainda.
- Run `42924960000` para a correção de sintaxe `a2a3cd86350b06152d6501cdbf2857e43d3ea770`: ambos os jobs ainda estavam em `cargo check` na última consulta.
- Os runs que falharam por causa do delimitador excedente pertencem aos commits anteriores e a falha está documentada; o commit corretivo já foi publicado.
- Nenhum resultado de `cargo test` para o HEAD `15fd47b6` está disponível. Não declarar as novas verificações/testes aprovados antes da conclusão de CI.


## Missão 057 — testes do parser limitado de Import Roots

- Extraído `parse_roots_json` para uma função pura, mantendo em `load_roots` a leitura limitada por `take(MAX_IMPORT_ROOTS_JSON_BYTES + 1)`.
- Adicionados testes para rejeição de JSON acima de 160 KiB antes do parse, JSON malformado, UTF-8 inválido e aceitação de lista vazia.
- Commit: `1b698767d4dd4c54f73663bef7d43b75940058d4`.
- A função continua validando quantidade máxima de raízes, caminhos absolutos e ausência de componentes relativos. Os testes ainda não foram executados em CI no novo HEAD.


## Situação de fechamento desta rodada

- HEAD do produto: `1b698767d4dd4c54f73663bef7d43b75940058d4`.
- Novo run de CI: `42925228309`; Linux e Windows permaneciam em execução na última consulta. Linux estava na instalação das dependências Tauri e Windows em `cargo check`.
- Runs antigos `42924960000`, `42925042139` e `42925059733` também permaneciam abertos sem conclusão na API; não foram tratados como sucesso. Logs de jobs ainda em execução não estavam disponíveis para download (404 do armazenamento de logs).
- A validação de teste e compilação do novo HEAD permanece pendente. O próximo passo é coletar conclusão e logs após finalização do run `42925228309`, corrigir falhas reais e só então avançar para reauditoria de regressão.


## Missão 057 — validação adicional de caminhos persistidos

- Acrescentados testes unitários para rejeitar raízes persistidas com caminho relativo, componente `..` e valor de caminho acima de 4096 bytes.
- Commit: `86c7008e78d1a79e71b41c8ffeaf5e0b4772f83c`.
- Os testes de parser anteriores permanecem: JSON excessivo, malformado, UTF-8 inválido e lista vazia.
- A leitura continua limitada antes da desserialização; os testes ainda aguardam CI do HEAD mais recente.

## Missão 055 — teste do orçamento combinado

- Acrescentado teste com arquivo SQLite esparso no limite máximo e WAL de 1 byte para confirmar rejeição quando a soma ultrapassa 512 MiB sem alocar centenas de MiB físicos.
- Commit: `5ae5bbce6293394f9083cd81aae0b77fa28086fb`.
- Execução pendente no CI.

## CI observado durante esta rodada

- Para o commit `1b698767d4dd4c54f73663bef7d43b75940058d4`, os dois jobs completaram `cargo check` com sucesso e estavam executando `cargo test` na última consulta.
- Não foi observada conclusão de `cargo test` para Linux ou Windows. O novo HEAD contém commits posteriores (`86c7008e` e `5ae5bbce`), portanto ainda exige uma execução própria antes de qualquer aprovação.


## Fechamento da rodada — HEAD `5ae5bbce6293394f9083cd81aae0b77fa28086fb`

- Commits de código desta rodada:
  - `1b698767d4dd4c54f73663bef7d43b75940058d4` — extração do parser e testes básicos.
  - `86c7008e78d1a79e71b41c8ffeaf5e0b4772f83c` — testes de caminhos persistidos inseguros.
  - `5ae5bbce6293394f9083cd81aae0b77fa28086fb` — teste do limite combinado DB + WAL.
- Runs: `42925583687` (HEAD atual), `42925556685` e `42925228309`.
- No momento da última consulta, o run do HEAD atual estava em preparação Linux e checkout Windows; o run `42925228309` já havia passado por `cargo check` em ambos os sistemas, mas permanecia em `cargo test` em ambos.
- Não há aprovação de `cargo test` para o HEAD atual. Também não foram confirmados os passos frontend para o HEAD atual.
- Próxima ação obrigatória: aguardar os jobs dos runs mais recentes, recolher falhas/logs quando disponíveis e corrigir somente problemas demonstrados. Os testes de concorrência/restore de integração que dependem de AppHandle e execução multiplataforma não foram simulados nem declarados cobertos.


## Atualização — CI aprovado e correção de inicialização limpa

### Evidência de CI confirmada
- HEAD do produto antes da correção adicional: `5ae5bbce6293394f9083cd81aae0b77fa28086fb`.
- Run `42925583687`: conclusão `success`.
- Job Linux `foundation`: `cargo check`, `cargo test` e `npm run build` concluídos com sucesso.
- Job Windows `foundation-windows`: `cargo check`, `cargo test` e `npm run build` concluídos com sucesso.
- Esta é a primeira confirmação completa, nesta sequência de alterações, de testes Rust e build frontend aprovados nos dois sistemas operacionais. Não extrapolar essa aprovação para commits posteriores.

### Correção adicional identificada na revisão
- A função `initialize_project` usava `fs::create_dir(&root)` sem garantir a existência da pasta-pai `storage/projects`. Isso regredia o primeiro uso em instalação limpa, pois `create_dir` não cria diretórios ancestrais.
- Criado `src-tauri/src/project_storage.rs` com `claim_project_root`: prepara a pasta-pai, rejeita pasta-pai que seja symlink/não diretório, reivindica a pasta do projeto com `create_dir` (sem substituir) e valida o caso `AlreadyExists`.
- Adicionados testes para: instalação limpa com pais ausentes, idempotência em diretório existente, oito chamadas concorrentes reivindicando a mesma pasta e rejeição de symlink no Unix.
- `initialize_project` agora usa o helper.
- Commits: `bb49cca66cefecaf41babc16eff3e6b60a28c8e4` (helper + testes) e `bacb4f0310b9ba59c11032482532879f2bb3e3df` (integração no comando).
- O run `42928221024` foi criado para o primeiro commit e estava `queued` na última consulta. O commit integrador posterior `bacb4f03` ainda precisa de execução CI própria. Portanto, **os testes desta correção ainda não estão aprovados**.

### Estado atualizado
- Wave 001: ainda parcial; não declarar concluída.
- Próximo: confirmar CI do HEAD `bacb4f0310b9ba59c11032482532879f2bb3e3df`; se passar, avançar testes adicionais de restore/import-root e reauditoria dos consumidores de filesystem. Se falhar, corrigir somente falhas reproduzidas.
- As limitações anteriores de Smart Context (deadline/telemetria/resultado parcial) e benchmarks dos budgets de backup continuam abertas.


## Atualização — consumidor de blob incorporado à primitiva no-replace

- Reauditoria do consumidor `ensure_blob_with_status` identificou uma janela de corrida: após verificar que o blob não existia, o código usava `fs::rename`, que em Unix pode substituir um destino criado concorrentemente.
- Substituída a publicação por `filesystem::publish_noreplace`; temporário agora usa `OpenOptions::create_new`, grava e sincroniza antes da publicação. Em disputa, o perdedor valida o blob vencedor e reutiliza o conteúdo, sem substituir a entrada imutável.
- Adicionado teste concorrente com oito chamadas para o mesmo SHA: espera exatamente um publicador e valida bytes finais.
- Commits: `c204e999a9996777439e98b5fa2fe6e5f808ef59` (correção) e `734816efbc8ff8d5c1346a1b269388166854328f` (teste).
- CI disparado: run `42928309321` para `c204e999` (em andamento na última consulta) e run `42928314196` para HEAD `734816ef` (em fila/em andamento). Não há aprovação para esses commits ainda.

### Situação de CI ao final desta atualização
- Confirmado sucesso integral no commit anterior `5ae5bbce`: Linux e Windows passaram em `cargo check`, `cargo test` e `npm run build`.
- Para as alterações seguintes, os runs `42928221024` (`bb49cca`), `42928227950` (`bacb4f0`), `42928309321` (`c204e99`) e `42928314196` (HEAD `734816ef`) permanecem em andamento/fila. Os testes do helper de inicialização e publicação concorrente ainda aguardam resultado.
- HEAD do produto confirmado: `734816efbc8ff8d5c1346a1b269388166854328f`.
- HEAD da colaboração será atualizado por este registro. A Wave 001 permanece parcial; 051 ainda precisa de deadline/telemetria de truncamento, 055 de benchmark e deadline, 056/057 de testes de integração multiplataforma, e 065/066/070 de reauditoria com evidência.


## Missão 051 — contrato v2 proposto sem quebra de compatibilidade

- Inspecionados novamente backend `smart_context.rs` e frontend `src/api.ts`: o comando atual retorna `Vec<ContextHit>`, e o frontend depende diretamente desse array.
- Criada proposta `proposals/MISSION_051_SMART_CONTEXT_V2_API_PROPOSAL.md` (commit `a9af39e3c412498ea0fbbabde23c5058f8bcfb1e` no repositório de colaboração).
- A proposta recomenda comando aditivo `smart_context_v2` com envelope de telemetria/truncamento e manutenção do comando legado como adaptador, evitando quebra de contrato.
- Inclui regras de deadline cooperativo, contagem de candidatos/bytes reais, orçamento de saída UTF-8, migração frontend e critérios de aceitação.
- É apenas proposta para reconciliação; não altera código do produto nem autoriza novos budgets arbitrários.

## Situação dos workflows posteriores
- Runs `42928221024`, `42928227950`, `42928309321` e `42928314196` estavam em andamento/fila na última consulta; o mais recente corresponde ao HEAD `734816efbc8ff8d5c1346a1b269388166854328f`.
- Nenhum teste novo de inicialização limpa ou publicação concorrente de blobs foi declarado aprovado até a conclusão desses runs.


## Missão 055 — limitar metadados de blobs no restore

- Reauditoria de `restore_project_backup` encontrou que o manifesto era limitado a 10.000 blobs, mas o mapa `db_blobs` era preenchido a partir do banco SQLite sem aplicar o mesmo teto.
- Extraída `insert_restore_db_blob`, que agora limita o mapa antes de inserir, valida SHA-256, tamanho, caminho relativo exato e rejeita chaves duplicadas.
- Adicionados testes para rejeição do 10.001º registro, SHA duplicado e caminho fora de `blobs/`.
- Commit do produto: `fdf2017ebf4377e6135d299d0f1820a11c5cb781`.
- Run CI: `42928530330`, estado `queued` na última consulta. Não declarar testes aprovados.
- Este hardening mantém o teto de memória coerente entre manifesto e banco; não substitui testes de integração de restore nem limite de tempo global.


### Snapshot CI — HEAD `fdf2017`
- Atualização posterior: run `42928530330` passou de `queued` para `in_progress`.
- Windows estava em `setup-node`; Linux estava instalando dependências Tauri. `cargo check`, `cargo test` e build frontend ainda não haviam começado nessa execução.
- Runs de commits intermediários permanecem abertos; aprovação final será determinada pelo run do HEAD mais recente, não por commits anteriores.


## Execução em duas rodadas — 11/11/2026

### Rodada 1 — verificação e reauditoria
- Branch do produto confirmada: `v2-saas-alpha`.
- HEAD verificado no início: `fdf2017ebf4377e6135d299d0f1820a11c5cb781`.
- CI do HEAD `fdf2017`: run `42928530330`, conclusão formal `success`.
- Jobs `foundation` (Linux) e `foundation-windows` concluídos com `success`.
- Em ambos os jobs foram concluídos com sucesso: `cargo check`, `cargo test`, `npm install` e `npm run build`.
- Isso valida a suíte de testes e o build do frontend para o commit `fdf2017`; não valida alterações posteriores.
- Reauditoria de `project_storage.rs` identificou uma lacuna: `create_dir_all(parent)` podia atravessar um symlink em componente ancestral antes da verificação do diretório-pai imediato. A verificação posterior não desfazia a travessia.
- Nenhuma falha de token/permissão do GitHub observada.

### Rodada 2 — correção e validação pendente
- Alterado `src-tauri/src/project_storage.rs` para criar componentes ancestrais individualmente, usando `symlink_metadata` e `create_dir`, recusando symlinks e componentes não-diretório antes de avançar.
- Mantida a reivindicação final do diretório do projeto por `create_dir`, sem substituir um destino existente.
- Adicionado teste Unix `claim_rejects_intermediate_parent_symlink_without_writing_outside`, que confirma rejeição do symlink intermediário e ausência de criação da pasta fora do local autorizado.
- Commit do produto: `29deca8886b74019326cd24feb7af6318d19fdda`.
- CI desse commit: run `42929383805`, estado `in_progress` na última consulta. Linux estava instalando dependências Tauri; Windows estava em setup-node. `cargo check`, `cargo test` e build frontend ainda pendentes.
- **Não declarar a correção aprovada** até o run `42929383805` concluir com sucesso nos dois jobs.

### Pendências após as duas rodadas
1. Aguardar e verificar os dois jobs do run `42929383805`; corrigir apenas falhas reproduzidas.
2. Manter testes de integração restore×restore e restore×initialize como pendentes até existirem evidências executáveis.
3. Missão 057 ainda requer teste cross-process e runtime Windows.
4. Missão 051 permanece parcial: deadline cooperativo, sinalização de truncamento e métricas exigem reconciliação do contrato v2 proposto; não implementar quebra de API sem aprovação.
5. Missão 055 ainda precisa de benchmark dos budgets e tratamento de operações longas.
6. Wave 001 permanece parcial; não avançar gate 070 como concluído.

**Resumo:** rodada 1 validada por CI integral no HEAD `fdf2017`; rodada 2 contém hardening adicional publicado em `29deca8`, com CI ainda em execução. Nenhum teste do segundo commit foi declarado aprovado.


---

# Execução em cinco rodadas consecutivas — 11/11/2026

## Rodada 1 — auditoria dos repositórios e estado inicial
- Produto: `vidift-max/tokensaver-ai`, branch `v2-saas-alpha`.
- Colaboração: `vidift-max/tokensaver-ai-collaboration`, branch `v2-saas-alpha`.
- HEAD do produto no início: `29deca8886b74019326cd24feb7af6318d19fdda`.
- HEAD da colaboração consultado: `be3f8647638374f1959b334d589603542016e999`.
- Repositórios, branch, árvore de relatórios e API do GitHub acessíveis. Nenhuma falha de autenticação/token observada.
- Branch do produto aparece sem proteção e sem required status checks no endpoint consultado. Registrar como risco de governança, não alterar configuração nesta execução.

## Rodada 2 — verificação de CI e validação da última implementação
- Run do HEAD `29deca8886b74019326cd24feb7af6318d19fdda`: `42929383805`.
- Conclusão formal: `success`.
- Job Linux `foundation`: `cargo check`, `cargo test`, `npm install` e `npm run build` concluídos com sucesso.
- Job Windows `foundation-windows`: `cargo check`, `cargo test`, `npm install` e `npm run build` concluídos com sucesso.
- Portanto, o hardening de `project_storage.rs` e o teste Unix de rejeição de symlink intermediário passaram na suíte executada no Linux; a suíte geral também passou no Windows. O teste específico condicionado a Unix não roda no Windows.
- Run anterior do commit `fdf2017` também consta como `success`; não foi usado como substituto da evidência do HEAD atual.

## Rodada 3 — revisão do pipeline CI (Missão 067)
- Workflow atual executa cargo check/test e build frontend em Linux e Windows.
- Revisão estática confirmou lacunas: ausência de `permissions` explícitas por job, actions referenciadas por tags (`@v4`, `@stable`), ausência de `timeout-minutes` e `concurrency`, `npm install` sem lockfile versionado encontrado e sem `Cargo.lock` encontrado em `src-tauri/` ou na raiz.
- `package.json` declara somente `dev`, `build`, `preview` e `tauri`; não há scripts de teste frontend, lint ou typecheck separado (o build inclui `tsc`).
- Recomendações registradas para próxima autorização: permissões mínimas, pin SHA de actions, timeout/concurrency, lockfiles e instalação determinística, fmt/clippy e workflow separado para build/installer. Nenhuma alteração de workflow ou lockfile foi feita nesta execução.

## Rodada 4 — integração, Tauri e Smart Context
- Tauri: CSP restringe default/script/connect, mas mantém `style-src 'unsafe-inline'`; capability consultada lista `core:default`. Não foi demonstrada vulnerabilidade explorável nesta leitura estática. Próximo passo é revisar permissões geradas e testar runtime/IPC em build real.
- Smart Context: backend mantém retorno legado `Vec<ContextHit>`; frontend `api.smartContext` depende de `ContextHit[]`. O backend aplica limites agregados de candidatos/bytes, mas não expõe truncamento, motivo de parada, telemetria nem deadline cooperativo.
- A proposta `proposals/MISSION_051_SMART_CONTEXT_V2_API_PROPOSAL.md` continua como proposta para reconciliação. Não implementar mudança de contrato sem aprovação explícita.
- Missões 056 e 057 continuam com relatórios marcados IMPLEMENTED — TESTS PENDING quanto a testes de integração específicos: restore×restore, restore×initialize, concorrência cross-process e runtime Windows para Import Roots. O CI verde confirma a suíte existente, mas não prova que esses cenários de integração foram cobertos.

## Rodada 5 — consolidação e próximos gates
- Relatórios de revisão das missões 067, 068 e 069 consultados; permanecem REVIEW_REQUIRED, com achados estáticos consistentes com esta verificação.
- Commits de produto relevantes: `29deca8886b74019326cd24feb7af6318d19fdda`; CI verde no run `42929383805`.
- Nenhum novo commit de produto foi necessário nesta execução: a prioridade foi confirmar evidência e evitar alterações fora da autorização.
- Este registro é a consolidação documental das cinco rodadas.

### Pendências priorizadas
1. Missão 056: criar/executar testes concorrentes restore×restore e restore×initialize, além de verificar cleanup em falhas.
2. Missão 057: testes cross-process de add/remove, falha/interrupção durante escrita e validação runtime Windows.
3. Missão 051: reconciliar semântica e budgets da API v2; manter comando legado intacto até aprovação.
4. Missão 055: benchmark dos limites e cobertura de operações longas.
5. Missão 067: propor hardening CI com permissões mínimas, pinning, timeouts, concurrency e lockfiles.
6. Missões 068/069: testes IPC/runtime e testes de interação/acessibilidade; build atual não substitui essas verificações.
7. Branch protection/status checks: avaliar ativação após definir checks obrigatórios e acesso administrativo apropriado.

**Conclusão:** cinco rodadas de auditoria, validação, revisão técnica e consolidação executadas. O último commit do produto está validado pelo CI Linux/Windows; a Wave 001 permanece PARCIAL, pois cenários de integração e gates específicos ainda não têm evidência suficiente.


---

## Execução complementar — 10 rodadas (2026-11-11)

- Produto HEAD atualizado: `9df4bf40085a7ea836c42a402f713accc595481d`.
- Commit de produto: dois testes em `src-tauri/src/filesystem.rs`, cobrindo limpeza do staging após budget failure e ausência de artefato quando source não existe.
- CI run `42931214949` disparado para Linux e Windows; estava em andamento no momento da captura. Não declarar aprovado até conclusão dos dois jobs e steps `cargo test`/build.
- Missões 056/057 continuam com testes de integração específicos pendentes.
- Confirmada lacuna UX: File Center lê `page.items` da primeira página (50) e não usa `has_more`.
- Branch protection e required checks desativados nos branches consultados.
- Relatório completo: `reports/TOKENSAVER_10_ROUNDS_FOLLOWUP_2026-11-11.md`.
- Nenhuma alteração de produção frontend, workflow, provider ou SaaS foi feita por ausência de autorização específica.


## Segunda execução complementar — 10 rodadas (2026-11-11)

- Produto base `9df4bf40085a7ea836c42a402f713accc595481d`: CI run `42931214949` concluído com sucesso em Linux e Windows; cargo check/test e npm install/build aprovados.
- Novo teste de limite `MAX_IMPORT_ROOTS` em `src-tauri/src/path_guard.rs`; commit com diff `c668d644f15d0d40f0b05b93e2da106104ce93ee`.
- CI do novo teste: run `42931876958`, pendente na captura. O run `42931902639` foi disparado por um commit sem diff de conteúdo; não conta como alteração de código.
- Auditoria reconfirmou: Smart Context v2 aguardando aprovação; restore concorrente e Import Roots cross-process pendentes; File Center ignora `has_more`; CI hardening e Tauri IPC aguardam autorização; nenhuma API real de IA ativada; SaaS continua NO-GO.
- Branch protection e required checks continuam desativados.
- Relatório consolidado: `reports/TOKENSAVER_10_ROUNDS_FOLLOWUP_2026-11-11.md` (seção “Segunda sequência”).


## Nova sequência de 10 rodadas — 2026-11-11

- CI run `42931876958` para o teste de fronteira de Import Roots passou em Linux e Windows (cargo check/test, npm install/build).
- Correção de segurança em `src-tauri/src/path_guard.rs`: leitura de `import_roots.json` agora rejeita links/diretórios, usa `O_NOFOLLOW` em Unix, `FILE_FLAG_OPEN_REPARSE_POINT` em Windows e valida metadata do handle aberto.
- Teste Unix novo para rejeitar symlink persistido. Commits: `ab2878cd157e1c6a5b7eb84dbe22b6684e8b96d6`, `f5aa9d633dc07debad97e6eb518800fbcde16c84`, `5f66e3db049430098d86963df3e51e5ea573d12e`.
- CI dos três commits de hardening (runs `42932569134`, `42932590812`, `42932633992`) ainda em andamento na captura; não declarar sucesso até ambos os sistemas e todos os steps concluírem.
- Revisados índices SQLite: sem evidência para índice novo/benchmark especulativo. Backend File Center já retorna `has_more`; frontend ainda não o consome.
- Smart Context v2 permanece aguardando aprovação; 056 restore concurrency e 057 cross-process continuam pendentes.
- Fases Automation AI 003–040 documentais REVIEW_REQUIRED; nenhum webhook, worker ou provider API real ativado.
- SaaS e release permanecem NO-GO.
- Relatório consolidado: `reports/TOKENSAVER_10_ROUNDS_FOLLOWUP_2026-11-11.md`, seção “Nova sequência de continuidade”.


## Execução de 10 rodadas — hardening adicional de Import Roots (2026-11-11)

- Produto HEAD inicial: `5f66e3db049430098d86963df3e51e5ea573d12e`; HEAD após patches: `92564af1267002529cb7685ae194af2b37383791`.
- Rodada 2 encontrou que `lock_roots` abria `import_roots.lock` sem rejeitar symlink/reparse point. Criado `open_roots_lock_file`, com `O_NOFOLLOW` (Unix), `FILE_FLAG_OPEN_REPARSE_POINT` (Windows) e validação do handle como arquivo regular. Commit produto `3caf529759a39989a9bec8c87263bbdce8092386`.
- Adicionados três testes: aceitar arquivo regular, rejeitar diretório e rejeitar symlink no Unix. Commit produto `92564af1267002529cb7685ae194af2b37383791`.
- Arquivo do produto alterado: `src-tauri/src/path_guard.rs`.
- CI anterior run `42932633992`: Linux e Windows SUCCESS em cargo check/test e npm install/build; esse run valida o SHA anterior `5f66e3d`, não os dois commits novos.
- Runs dos novos commits: `42933260337` (`3caf529`) e `42933341382` (`92564af`) IN_PROGRESS na última consulta. Testes locais NÃO EXECUTADOS.
- As outras frentes foram verificadas sem alterações fora do escopo: 056 ainda carece de harness restore×restore/initialize; 057 carece de teste cross-process específico; 051 v2 aguarda aprovação; File Center paginação aguarda autorização; CI/Tauri hardening administrativo aguarda autorização; SaaS permanece NO-GO.
- Relatório completo: `reports/TOKENSAVER_10_ROUNDS_EXECUTION_2026-11-11_LOCKFILE_HARDENING.md` (commit de colaboração `1780881daa4bffffe8164ebbff5a83c3ccc27f8d`).
- Dez frentes percorridas; 2 commits de produto; 1 arquivo; 1 correção de comportamento; 2 testes adicionados; 0 missões formalmente concluídas. Missão 063 permanece parcial até CI e validação multiplataforma dos novos commits.


## Missão 057 — correção adicional de timeout Windows (2026-11-11)

- Encontrado que `LockFileEx` usava apenas `LOCKFILE_EXCLUSIVE_LOCK` (0x2), que pode bloquear indefinidamente; o loop de cinco segundos não conseguia observar o deadline durante a chamada bloqueante.
- Corrigido para combinar `LOCKFILE_EXCLUSIVE_LOCK | LOCKFILE_FAIL_IMMEDIATELY` (0x2 | 0x1), permitindo retry não bloqueante e timeout efetivo.
- Produto commit: `7be9db9b9ac939c48cdfdc06ffc2f157fdd359e9`; arquivo `src-tauri/src/path_guard.rs`.
- CI run `42933741807` IN_PROGRESS na última consulta. Teste de concorrência cross-process Windows ainda NÃO EXECUTADO.
- Relatório atualizado: `reports/TOKENSAVER_10_ROUNDS_EXECUTION_2026-11-11_LOCKFILE_HARDENING.md`.


### CI snapshot posterior — Import Roots
- Run `42933260337`: Linux completo SUCCESS; Windows `cargo check` e `cargo test` SUCCESS, `npm install` ainda em andamento.
- Run `42933341382`: Linux completo SUCCESS; Windows `cargo check` SUCCESS e `cargo test` em andamento.
- Run `42933741807` para commit `7be9db9`: Linux e Windows em `cargo check` na última consulta.
- Não declarar CI completo em Windows nem a missão 057 concluída até os três runs terminarem.
