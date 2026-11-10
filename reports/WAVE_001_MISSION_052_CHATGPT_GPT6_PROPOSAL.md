# WAVE 001 — Missão 052: Project Memory — limite transacional

## Identificação
- Nome da IA: ChatGPT
- Modelo: GPT-6 (OpenAI)
- Especialidade: Rust, SQLite, transações e concorrência
- Função: proposta técnica independente pós-auditoria; somente leitura
- Data: 2026-11-10
- Status: PROPOSTA PRONTA PARA APROVAÇÃO

## Objetivo
Garantir que o limite máximo de 1.000 entradas por projeto seja invariável mesmo quando múltiplas gravações concorrentes tentam inserir chaves diferentes.

## Análise do problema atual
A função verifica se a chave existe e, se não existe, conta as entradas em queries separadas. Depois executa UPSERT fora de uma transação que englobe as verificações. Duas conexões podem observar 999 entradas, ambas aceitar novas chaves e deixar 1.001 registros. O índice composto garante unicidade de `(project_id,key)`, mas não a cardinalidade máxima.

## Evidências no código
- `src-tauri/src/project_memory.rs::MAX_PROJECT_MEMORY_ENTRIES = 1000`.
- `set_project_memory` executa SELECT de existência, SELECT COUNT e INSERT/UPSERT em operações distintas.
- `src-tauri/src/db.rs::open` define `busy_timeout(5s)` e SQLite WAL.
- `project_memory` usa chave primária composta `(project_id,key)`.
- HEAD do produto consultado: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.

## Solução proposta
1. Tornar a conexão mutável e abrir `transaction_with_behavior(TransactionBehavior::Immediate)` antes de consultar existência.
2. Dentro da mesma transação: consultar existência da chave; se for nova, contar entradas do mesmo `project_id`; rejeitar quando count >= 1000; caso contrário, executar UPSERT.
3. Commit somente depois do UPSERT. Qualquer falha antes do commit faz rollback automático.
4. Preservar atualização de chave já existente mesmo quando a contagem estiver em 1.000.
5. Preservar o isolamento por projeto: toda consulta de existência/contagem deve filtrar `project_id`.
6. Mapear SQLITE_BUSY/LOCKED para erro estável e explícito de conflito temporário, sem transformar erro de banco em sucesso. O busy timeout existente pode ser mantido inicialmente.
7. Não introduzir uma contagem global nem alterar o schema; não é necessário novo índice para correção da atomicidade.

## Arquivos envolvidos
- `src-tauri/src/project_memory.rs`
- `src-tauri/src/tests.rs` e/ou módulo de testes em `project_memory.rs`
- `src-tauri/src/db.rs` apenas se a política de busy/error precisar ser centralizada

## Funções envolvidas
- `project_memory::set_project_memory`
- `valid_key` (sem mudança funcional esperada)
- helper novo para mapear erros SQLite busy/locked, se necessário
- testes de integração com duas conexões independentes

## Invariantes de segurança
- Para cada `project_id`, count <= 1000 após toda gravação confirmada.
- Atualização de chave existente não consome slot novo e continua permitida no limite.
- Duas chaves diferentes nunca podem ultrapassar o limite por corrida.
- Falha/timeout/rollback não deixa entrada parcialmente persistida.
- Nenhuma operação altera memória de outro projeto.

## Riscos de regressão
- Transação IMMEDIATE serializa escritores e pode aumentar espera sob gravações simultâneas.
- Com busy timeout de 5 segundos, concorrência intensa pode retornar erro temporário; a UI precisa tratar o erro sem retry infinito.
- Testes que usam apenas uma conexão não detectam a corrida.
- Se uma refatoração mover COUNT para fora da transação, o bug retorna.

## Dependências
- SQLite e `rusqlite::TransactionBehavior::Immediate`, já usados no projeto em migrações e restore.
- Nenhuma alteração de schema necessária.
- A aprovação explícita do GPT-6 integrador para modificar o produto principal.

## Testes necessários
### Unitários
- Projeto com 999 entradas: inserir nova chave -> sucesso e count 1000.
- Projeto com 1000 entradas: nova chave -> erro e count permanece 1000.
- Projeto com 1000 entradas: atualizar chave existente -> sucesso, count permanece 1000.
- Mesmo key em dois project IDs -> valores isolados.

### Integração/concorrência
- Abrir duas conexões independentes para o mesmo arquivo SQLite.
- Preparar 999 chaves; sincronizar duas threads com barrier para inserir chaves diferentes.
- Resultado obrigatório: exatamente uma inserção nova confirmada, outra rejeitada por limite ou conflito após retry limitado, count final exatamente 1000.
- Repetir com WAL e busy timeout configurado; validar ausência de deadlock.
- Concorrência de duas atualizações da mesma chave: sem duplicação e com uma versão final válida.

### Estresse
- N escritores simultâneos tentando preencher os últimos slots; count nunca excede 1000.
- Projetos diferentes recebendo writes em paralelo; sem bloqueio lógico entre projetos além do SQLite por arquivo.

## Critérios objetivos de aceite
1. O check de existência, COUNT e UPSERT ocorre dentro da mesma transação IMMEDIATE.
2. Teste de duas conexões em 999 entradas nunca produz count > 1000.
3. Update existente funciona quando count = 1000.
4. Projeto A não afeta cardinalidade ou conteúdo do projeto B.
5. Erro de busy/locked é estável, testado e não causa retry ilimitado.
6. Não há migração nem alteração de formato persistido.

## Limitações
- Inspeção estática apenas; a concorrência não foi executada nesta proposta.
- A garantia cobre escritores que usam o mesmo protocolo. Escritas diretas externas no SQLite que ignorem o contrato podem violar a cardinalidade; não há constraint SQL simples para impor esse teto sem trigger/contador transacional.

## Testes executados
**TESTE NÃO EXECUTADO.** Nenhum cargo test ou teste concorrente foi executado.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- arquivo: `src-tauri/src/project_memory.rs`; função: `set_project_memory`; mudança: mover existência, COUNT e UPSERT para uma transação IMMEDIATE; teste: 999 entradas e duas conexões; risco: maior serialização/SQLITE_BUSY.
- arquivo: `src-tauri/src/project_memory.rs`; função: tratamento de erro SQLite; mudança: distinguir busy/locked de falha genérica com código estável; teste: lock contention controlado; risco: compatibilidade com normalizador de erro frontend.
- arquivo: `src-tauri/src/tests.rs` ou `project_memory.rs`; função: testes de cardinalidade; mudança: fixtures de 999/1000 e writers concorrentes; teste: cargo test repetido; risco: flakiness se barreira/timeout forem mal configurados.
