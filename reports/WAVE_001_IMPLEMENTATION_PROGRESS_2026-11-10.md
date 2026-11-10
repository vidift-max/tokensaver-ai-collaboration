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
