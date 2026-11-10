# WAVE 001 — Missão 051: Smart Context — orçamento global

## Identificação
- Nome da IA: ChatGPT
- Modelo: GPT-6 (OpenAI)
- Especialidade: Rust/Tauri, performance, orçamento de recursos e contratos frontend/backend
- Função: proposta técnica independente pós-auditoria; somente leitura
- Data: 2026-11-10
- Status: PROPOSTA PRONTA PARA APROVAÇÃO

## Objetivo
Definir um orçamento determinístico e agregado para leitura e processamento do Smart Context, não apenas para a quantidade de hits retornados.

## Análise do problema atual
O limite `max_files.clamp(1,20)` limita apenas o vetor final. A função percorre todas as versões mais recentes retornadas pelo SQLite, lê cada blob inteiro em uma String, cria outra String lowercase e calcula correspondências antes de truncar hits. O custo é proporcional à biblioteca inteira, não à saída solicitada. Um `byte_len` no banco é metadado e não pode ser tratado como prova do tamanho real do arquivo.

A resposta atual é `Vec<ContextHit>`; portanto, a UI não recebe indicação de orçamento esgotado ou resultados parciais. O frontend solicita oito hits, mas isso não reduz a leitura no backend.

## Evidências no código
- `src-tauri/src/smart_context.rs::smart_context`: consulta sem limite de arquivos examinados; `fs::read_to_string` por blob; lowercase completo; truncamento somente depois do ranking.
- `src-tauri/src/smart_context.rs::excerpt`: cria outra cópia lowercase do texto para localizar o trecho.
- `src-tauri/src/limits.rs`: há limites de arquivo/lote, mas nenhum budget específico de contexto.
- `src/api.ts`: `smartContext` declara retorno `ContextHit[]`.
- `src/App.tsx::runSmartContext`: guarda somente os hits e não apresenta estado de truncamento.
- HEAD do produto consultado: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`, branch `v2-saas-alpha`.

## Solução proposta
1. Criar um `ContextBudget` interno com contadores de arquivos examinados, bytes efetivamente lidos, bytes de saída e deadline monotônico.
2. Introduzir constantes próprias em `limits.rs`. Proposta inicial para benchmark/aprovação: 500 arquivos examinados, 10 MiB por blob, 50 MiB agregados lidos, 32 KiB agregados de excerpts/saída e deadline de 5 segundos. Esses valores são limites candidatos, não dados medidos; devem ser confirmados em hardware representativo antes de congelar.
3. Fazer a consulta SQLite em ordem determinística e iterar linhas sem materializar a coleção. Parar quando qualquer budget acabar.
4. Antes de abrir um blob, rejeitar metadado negativo/incoerente e tamanho declarado acima do limite por blob. Ainda assim, ler com limite efetivo `remaining + 1` e contar bytes reais; nunca confiar exclusivamente em `byte_len`.
5. Evitar `read_to_string` sem limite. Ler até o limite com `Read::take`, validar UTF-8 e calcular ocorrências sobre o conteúdo limitado. Não manter simultaneamente cópias desnecessárias; extrair excerpts somente para candidatos.
6. Manter o ranking atual (score decrescente, caminho como desempate) e `max_files` como máximo de hits. O orçamento de varredura é independente.
7. Alterar o retorno para `ContextResponse { hits, truncated, stop_reason, scanned_files, bytes_read } `. Atualizar o tipo TypeScript e a UI para mostrar que o resultado é parcial e por qual budget foi interrompido. Se compatibilidade IPC for prioritária, criar versão nova do comando em vez de mudar silenciosamente o shape.
8. Se deadline expirar, retornar resultados parciais com `truncated=true`; erros reais de I/O não devem ser convertidos em sucesso silencioso.

## Arquivos envolvidos
- `src-tauri/src/smart_context.rs`
- `src-tauri/src/limits.rs`
- `src/api.ts`
- `src/App.tsx`
- `src-tauri/src/tests.rs` e/ou testes unitários em `smart_context.rs`

## Funções/módulos envolvidos
- `smart_context::smart_context`
- `smart_context::excerpt` e helpers novos de leitura limitada/pontuação
- `limits.rs`: constantes do budget
- `api.smartContext`, tipo `ContextHit`/novo `ContextResponse`
- `App.tsx::runSmartContext` e componente que renderiza resultados

## Invariantes de segurança
- Bytes efetivamente lidos nunca excedem o budget agregado.
- Nenhum blob individual é lido além do limite por blob.
- O número de blobs examinados não excede o limite.
- O tempo é verificado entre operações; deadline não promete interromper uma chamada de sistema bloqueada.
- Nenhum caminho de blob fora da raiz verificada é lido; a proteção de project root da Missão 063 deve ser aplicada.
- Resultado parcial sempre é marcado como parcial; nunca apresentar orçamento esgotado como busca completa.
- Ranking e isolamento por `project_id` permanecem determinísticos.

## Riscos de regressão
- Bibliotecas grandes podem retornar menos hits do que antes; isso é comportamento intencional sob budget, mas exige indicação visual.
- Mudança de `Vec<ContextHit>` para envelope quebra tipos e componentes que esperam array.
- Leitura limitada pode rejeitar conteúdo UTF-8 truncado no meio de codepoint; a implementação deve descartar o blob incompleto ou decodificar incrementalmente sem substituir bytes silenciosamente.
- Um limite de tempo medido entre leituras não interrompe I/O de kernel; não prometer hard cancellation sem worker/cancel token.
- Valores iniciais inadequados podem reduzir recall ou permitir consumo excessivo; calibrar com benchmark.

## Dependências
- Missão 063: resolução segura do diretório do projeto e confinamento físico de blobs.
- Missão 058/059: catálogo central de budgets e deadline/cancelamento cooperativo, sem depender de timeout nominal não aplicado.
- Aprovação dos valores quantitativos pelo integrador/produto.
- Alteração coordenada do contrato IPC e UI.

## Testes necessários
### Unitários
- Budget de arquivos, bytes/blob, bytes totais, saída e deadline.
- Contagem de bytes reais diferente de `byte_len` persistido.
- Blob maior que limite, blob UTF-8 inválido e corte em codepoint.
- Query Unicode/case folding, zero hits e empate de score.
- `max_files` limita hits, não varredura; resultado estável em ordem de entrada equivalente.

### Integração
- Projeto temporário com N blobs conhecidos; verificar hits, `scanned_files`, `bytes_read` e `truncated/stop_reason`.
- Blob ausente/corrompido e referência de blob fora da raiz.
- Compatibilidade do tipo de resposta Rust ↔ TypeScript ↔ UI.

### Concorrência/estresse
- Milhares de blobs pequenos e combinação de blobs grandes; medir RSS/CPU/latência.
- Alteração concorrente do conjunto de blobs durante a varredura; resultado deve falhar/continuar sem ultrapassar budgets.
- Execução repetida em Windows e Linux.

## Critérios objetivos de aceite
1. Testes provam que arquivos examinados, bytes reais lidos e bytes de saída nunca excedem os limites aprovados.
2. Nenhum blob é integralmente carregado antes de verificar o budget efetivo.
3. A busca encerra deterministicamente ao atingir qualquer limite.
4. A UI identifica resultados parciais e motivo da interrupção.
5. O ranking permanece determinístico e o limite de hits continua respeitado.
6. Testes de integração e stress passam em Linux e Windows; métricas documentam valores de referência.
7. Não há regressão de isolamento de projeto/blob.

## Limitações
- Inspeção estática somente; não foi feito benchmark nem execução de testes.
- Os budgets propostos são candidatos de engenharia, não valores validados empiricamente.
- O limite de deadline não interrompe syscall bloqueada sem arquitetura cooperativa adicional.

## Testes executados
**TESTE NÃO EXECUTADO.** Nenhum build, cargo test, benchmark ou teste de integração foi executado nesta proposta. Evidências são leitura estática dos arquivos listados.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- arquivo: `src-tauri/src/limits.rs`; função/módulo: constantes de limite; mudança: definir budgets de scan, blob, bytes totais, saída e deadline após aprovação; teste: testes unitários de fronteira; risco: defaults muito baixos reduzem recall.
- arquivo: `src-tauri/src/smart_context.rs`; função: `smart_context`; mudança: iteração limitada, contagem de bytes reais, deadline e envelope parcial; teste: fixtures de orçamento e UTF-8; risco: alteração de contrato e ranking.
- arquivo: `src-tauri/src/smart_context.rs`; função: `excerpt`; mudança: extrair trechos sem lowercase/cópias completas repetidas; teste: Unicode/case folding; risco: deslocamento de offsets Unicode.
- arquivo: `src/api.ts`; função: `api.smartContext`; mudança: tipo de resposta envelope; teste: typecheck/build; risco: consumidores esperam array.
- arquivo: `src/App.tsx`; função: `runSmartContext` e renderizador; mudança: exibir status parcial/motivo; teste: UI integration; risco: estados obsoletos/UX.
- arquivo: `src-tauri/src/tests.rs` ou `smart_context.rs`; função: testes; mudança: adicionar unit/integration/stress fixtures; teste: cargo test Linux/Windows; risco: fixtures grandes e flakiness.
