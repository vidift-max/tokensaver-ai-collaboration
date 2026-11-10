# WAVE 001 — Missão 052: Project Memory

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
`set_project_memory` faz SELECT de existência, SELECT de count e UPSERT sem transação. Duas conexões podem observar 999 e inserir chaves distintas, ultrapassando 1.000. `busy_timeout(5s)` não torna a sequência atômica. Valor individual permite 100.000 bytes; 1.000 valores podem ocupar aproximadamente 100 MB. `list_project_memory` materializa até 1.000 valores sem budget agregado.

## Evidências no código
- `src-tauri/src/project_memory.rs::set_project_memory`: check-then-write em operações separadas.
- `project_memory.rs::list_project_memory`: SELECT LIMIT 1000 seguido de collect Vec.
- `src-tauri/src/db.rs::open`: WAL e busy_timeout; nenhuma transação para o fluxo da memória.
- Schema em `db.rs::migrate`: PK composta (project_id,key), sem constraint de quantidade/bytes.
- Correlatos lidos: missões 058, 061, 064 e 077.

## Solução proposta
Abrir `transaction_with_behavior(TransactionBehavior::Immediate)` antes do SELECT de existência/count; fazer validação e UPSERT dentro da mesma transação e commit explícito. Update de chave existente deve ser permitido mesmo quando count=1000; insert de chave nova deve falhar nesse teto. Definir teto agregado em bytes UTF-8 por projeto e por resposta; calcular com `SUM(length(CAST(value AS BLOB)))` e descontar valor anterior em update, com aritmética segura. Limitar o valor individual e agregado antes do write. Para listagem, introduzir paginação keyset ou limite agregado explícito; não coletar 100 MB silenciosamente. Trigger SQLite pode ser defesa adicional, mas somente após prova de compatibilidade com UPSERT e migração versionada; não é requisito para o patch mínimo.

## Invariantes de segurança
- Nenhum commit deixa mais de 1.000 chaves distintas por projeto.
- Update no teto não consome slot; insert novo no teto é rejeitado.
- Soma dos bytes UTF-8 nunca excede budget aprovado.
- Isolamento sempre inclui project_id.
- Erro/rollback não deixa gravação parcial; transação não envolve I/O externo.

## Riscos
IMMEDIATE aumenta contenção; budgets podem rejeitar usos antes permitidos; paginação/envelope quebra contrato array; trigger incorreto pode bloquear UPSERT. Manter transação curta.

## Dependências
Missão 063 para resolver caminho de DB; 058/064 para budget coerente; 061 para migração; GPT-6 define teto agregado e contrato de listagem.

## Testes necessários
Unitários: valor max/max+1, total max/max+1, update no teto, insert no teto, dois projetos. Integração SQLite: múltiplas conexões para o mesmo arquivo, 100+ inserts concorrentes em 999 slots e assert count<=1000; mesmo key concorrente; busy timeout e retry. Migração v1-v4 se houver schema change. **TESTE NÃO EXECUTADO:** cargo test/build/migração/concorrência.

## Critérios objetivos de aceite
Teto inviolável sob multi-connection; update no limite funciona; insert excedente falha; bytes agregados respeitam teto; rollback e isolamento comprovados; testes multiplataforma.

## Limitações
Valores de budget não foram definidos. A leitura atual limita número, não bytes. Proposta estática sem teste dinâmico.

## Relação com trabalho anterior
O relatório 052 já indicava race e valor máximo. Esta proposta detalha a transação IMMEDIATE, semântica de UPSERT no limite, soma de bytes BLOB e teste real com conexões independentes.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
| arquivo | função | mudança | teste | risco |
|---|---|---|---|---|
| `src-tauri/src/project_memory.rs` | `set_project_memory` | IMMEDIATE envolvendo check/count/UPSERT | 999/1000 + concorrência | contenção |
| `src-tauri/src/project_memory.rs` | `list_project_memory` | paginação ou budget agregado | dataset 1000 x valor grande | IPC breaking |
| `src-tauri/src/limits.rs` | constantes | bytes agregados por projeto/resposta | boundary/overflow | valor inadequado |
| `src-tauri/src/db.rs` | `migrate` (opcional) | trigger de defesa, se UPSERT comprovado | migrações v1-v4 | trigger incompatível |
| `src/api.ts`, `src/App.tsx` | memory API/UI | paginação/estado de limite | typecheck/UI | regressão visual |
