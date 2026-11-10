# WAVE 001 — Missão 052: Project Memory
- IA/modelo: ChatGPT — GPT-6 (OpenAI)
- Data: 2026-11-10
- Status: PROPOSTA / aguardando aprovação do integrador
- Produto: vidift-max/tokensaver-ai, branch v2-saas-alpha, HEAD 935b6fc5d0c126e93697a16f73d56bb3a4d1e55f (read-only)

## Análise do problema atual
set_project_memory valida entradas, consulta existência da chave, conta entradas se for nova e depois executa UPSERT em comandos separados. Duas conexões podem observar simultaneamente a mesma contagem abaixo de 1.000 e inserir chaves diferentes, excedendo o limite. A unicidade de (project_id,key) evita duplicata da chave, mas não impõe limite agregado.

## Evidências no código
- src-tauri/src/project_memory.rs: MAX_PROJECT_MEMORY_ENTRIES=1000; set_project_memory() faz SELECT de existência, COUNT e INSERT/UPSERT sem transação comum.
- O UPSERT já preserva a semântica de atualização de chave existente.
- db.rs e outras operações já usam TransactionBehavior::Immediate, portanto o padrão está disponível.

## Solução proposta
Validar project_id/key/value antes da transação. Tornar Connection mutável e iniciar transaction_with_behavior(IMMEDIATE). Dentro da transação: consultar se a chave existe; se não existe, contar entradas do projeto e rejeitar count >= 1000; executar UPSERT; commit. Se a chave existe, permitir update mesmo com 1.000 entradas. Manter a transação curta, sem I/O de filesystem/rede. Não criar contador redundante nem migration, a menos que a constraint real não corresponda ao conflict target.
Se SQLITE_BUSY ocorrer, retornar erro controlado; não repetir a gravação sem política bounded. Confirmar no schema que a constraint UNIQUE é realmente (project_id,key), pois o UPSERT depende disso.

## Arquivos e funções envolvidos
- src-tauri/src/project_memory.rs: set_project_memory(); módulo de testes.
- src-tauri/src/db.rs: db::open() apenas se timeout/busy policy precisar de ajuste.
- src-tauri/src/tests.rs: fixture SQLite concorrente, se centralizada.

## Invariantes de segurança
Contagem e insert de chave nova na mesma transação serializada; máximo de 1.000 por projeto; update existente permitido no limite; projetos isolados; rollback não deixa inserção parcial.

## Riscos de regressão
IMMEDIATE serializa writers e pode aumentar SQLITE_BUSY; testes devem usar conexões independentes e fixtures isoladas. Falha se a constraint de conflito não for a esperada.

## Dependências
Missão 058 para governança de limites; 065/066 para harness de integração/regressão. Sem bloqueio técnico das demais missões.

## Testes necessários
Unitários: 1.001ª chave rejeitada; update com 1.000 permitido; validação de chave/valor. Concorrência: iniciar com 999 entradas e N conexões sincronizadas; exatamente uma nova chave é confirmada e total final = 1.000. Repetir o teste e verificar atualizações concorrentes da mesma chave sem duplicação. TESTE NÃO EXECUTADO: nenhum teste Rust/SQLite concorrente ou build foi executado nesta proposta.

## Critérios objetivos de aceite
Total nunca excede 1.000 sob corrida repetida; 1.001ª inserção falha sem mutação; update no limite funciona; após reopen, todas as transações confirmadas persistem.

## Limitações
Inspeção estática; o schema/índice UNIQUE precisa ser confirmado no patch review. Nenhuma corrida foi reproduzida dinamicamente.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- arquivo: src-tauri/src/project_memory.rs; função: set_project_memory(); mudança: mover SELECT/COUNT/UPSERT para transação IMMEDIATE; teste: corrida com 999 entradas e update com 1.000; risco: contenção SQLite/constraint.
- arquivo: src-tauri/src/project_memory.rs; função: módulo tests; mudança: fixtures e testes concorrentes; teste: N conexões/barreira; risco: flakiness se sincronização inadequada.