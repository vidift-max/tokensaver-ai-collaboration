# WAVE 001 — Missão 052: Project Memory — limite transacional

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** arquitetura Rust/SQLite, segurança de filesystem e confiabilidade
- **Função:** proposta técnica independente pós-auditoria; somente leitura
- **Data:** 2026-11-10
- **Status:** REVIEW_REQUIRED
- **Branch analisada:** `v2-saas-alpha`
- **HEAD/arquivos:** evidências obtidas por fetch dos arquivos indicados; hashes anotados abaixo. Nenhum teste de runtime foi executado.

## Análise do problema atual
`set_project_memory` faz SELECT para descobrir se a chave existe, SELECT COUNT e INSERT/UPSERT em autocommit separado. Duas conexões podem observar 999 chaves simultaneamente e ambas inserir uma chave diferente, ultrapassando 1000. A PK `(project_id,key)` evita duplicidade de chave, mas não impõe cardinalidade máxima.

## Evidências no código
- `src-tauri/src/project_memory.rs`, SHA `bfb33e442beb0f3ff94f6c80cefc201e36ca6f81`: `set_project_memory` executa os dois SELECTs e `conn.execute(INSERT ... ON CONFLICT)` sem transação.
- `src-tauri/src/db.rs`, SHA `7ca329e0e5ac926913d8d89d8602af9ca2e94839`: `open` define WAL e busy_timeout de 5s; schema v4 tem PK `(project_id,key)` e índice.
- A função valida project_id, chave e valor até 100.000 bytes. Atualização de chave existente não deve consumir slot adicional.

## Solução proposta
Mudança mínima e segura: executar check e UPSERT na mesma transação `TransactionBehavior::Immediate`. SQLite serializa escritores desde BEGIN IMMEDIATE; a segunda conexão aguarda via busy_timeout e reavalia COUNT após obter lock.

Algoritmo:
1. Validar inputs como hoje.
2. Abrir conexão.
3. Iniciar `transaction_with_behavior(Immediate)`; se busy/timeout, retornar erro DB claro, sem fallback.
4. Consultar existência da chave dentro da transação.
5. Se nova chave, contar entradas do projeto dentro da mesma transação; se count >= 1000, rollback e INVALID_REQUEST.
6. UPSERT, commit e retornar MemoryEntry somente após commit.
7. Manter a PK atual como defesa contra duplicidade.

Não é necessário adicionar contador materializado ou trigger na primeira correção. Trigger/contador acrescentaria migração e riscos de drift; considerar apenas se benchmark mostrar gargalo. A transação é a menor alteração coerente com SQLite WAL.

## Arquivos e funções envolvidos
- `src-tauri/src/project_memory.rs`: `set_project_memory`.
- `src-tauri/src/db.rs`: contrato de busy_timeout/connection; não requer mudança prevista.
- `src-tauri/src/tests.rs` ou módulo de teste local: fixtures de concorrência; helper puro para validar limite se extraído.

## Invariantes de segurança
- Nunca confirmar mais que 1000 chaves distintas por project_id.
- Update de chave já existente funciona mesmo quando count == 1000.
- Projetos diferentes têm limites independentes.
- Erro de lock/commit não reporta sucesso.
- Chave única segue garantida pelo banco.
- Não apagar/compactar entradas para abrir espaço automaticamente.

## Riscos e dependências
- Escritores simultâneos passam a serializar; aumenta contenção momentânea, mas a transação é curta.
- Busy timeout de 5s pode ser insuficiente em carga; não elevar sem teste, e não retry ilimitado.
- Não há dependência de migração/schema se a PK está presente em todos os bancos suportados; confirmar DBs legados antes do patch.
- A leitura de `list_project_memory` permanece limitada a 1000 linhas e não faz parte do write race.

## Testes necessários
- Unitário: chave nova sob count 999 aceita; chave nova sob count 1000 rejeitada; update no count 1000 aceito; limite independente por projeto.
- Integração: arquivo SQLite temporário, WAL habilitado, múltiplas conexões reais.
- Concorrência: pré-popular 999, lançar 20 threads com conexões distintas e barrier; exatamente uma nova chave aceita, total == 1000, restantes rejeitadas por limite (ou busy timeout com retry controlado no teste).
- Stress: repetição de corrida 100–1000 vezes, garantir count nunca >1000.
- Regressão: update simultâneo de mesma chave mantém UPSERT correto e não cria duplicatas.

## Critérios objetivos de aceite
- Invariante SQL `COUNT(*) <= 1000` sempre verdadeiro após cada operação confirmada.
- No teste de 999 + N inserções concorrentes, total final é 1000.
- Update de chave existente funciona no limite.
- Nenhum sucesso é retornado antes de commit.
- TESTE NÃO EXECUTADO: unit, integração, concorrência, stress e CI.

## Limitações
A prova depende do SQLite realmente usar as conexões no mesmo arquivo e iniciar todas as mutações via BEGIN IMMEDIATE. Escritas externas ao comando que ignorem o protocolo não são cobertas; para proteção absoluta de toda via futura, pode-se adicionar trigger SQLite com migração após aprovação.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- **arquivo:** `src-tauri/src/project_memory.rs` | **função:** `set_project_memory` | **mudança:** iniciar transação IMMEDIATE antes do SELECT exists/count e executar UPSERT/commit nela | **teste:** concorrência com 20 conexões em 999 entradas | **risco:** contenção/busy timeout.
- **arquivo:** `src-tauri/src/project_memory.rs` | **função:** `set_project_memory` | **mudança:** manter caminho de update existente sem consumir nova vaga | **teste:** update em count=1000 | **risco:** regressão se o check exists sair da transação.
- **arquivo:** `src-tauri/src/tests.rs` | **função:** novo teste de integração memory cap | **mudança:** fixture DB compartilhada e barrier concorrente | **teste:** count final <=1000 repetido | **risco:** teste flaky se conexão/thread não for sincronizada corretamente.

## Fontes consultadas e integridade
- Wave spec: `WAVE_001_IMPLEMENTATION_MISSIONS.md` SHA `6ac5f4213961fa991e272fd146708bf78d3570fd`.
- Protocolo: `CENTRAL.md` e `INSTRUCTIONS.md`.
- Relatórios anteriores individuais: `reports/AUTOMATION_AI_MISSION_052_CHATGPT_GPT6.md` (lido antes desta proposta); missões relacionadas consultadas conforme dependência: 054, 058, 064, 041 e 050.
- Código principal: hashes indicados nas seções de evidência. Nenhum arquivo do produto foi alterado.
- **TESTE NÃO EXECUTADO:** build, cargo test, CI, integração, stress e testes multi-plataforma.

**Decisão:** proposta técnica, não implementação. Depende de aprovação do GPT-6 integrador antes de qualquer patch.
