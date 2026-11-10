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
