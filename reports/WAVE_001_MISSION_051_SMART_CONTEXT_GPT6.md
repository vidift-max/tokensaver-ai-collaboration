# WAVE 001 — Missão 051: Smart Context
- IA/modelo: ChatGPT — GPT-6 (OpenAI)
- Data: 2026-11-10
- Status: PROPOSTA / aguardando aprovação do integrador
- Produto: vidift-max/tokensaver-ai, branch v2-saas-alpha, HEAD 935b6fc5d0c126e93697a16f73d56bb3a4d1e55f (read-only)

## Análise do problema atual
smart_context() percorre todas as versões mais recentes do projeto, sem teto de linhas examinadas. Para cada blob faz canonicalize, read_to_string, cria outra String lowercase, calcula ocorrências e só então limita hits com max_files.clamp(1,20). Esse parâmetro limita a resposta, não o custo. Não há limite agregado de bytes, tamanho máximo por blob, deadline nem sinalização de truncamento. byte_len do banco não é usado como gate prévio.

## Evidências no código
- src-tauri/src/smart_context.rs: smart_context(), excerpt(); query SQL sem LIMIT; fs::read_to_string; text.to_lowercase; hits.truncate(limit) após o loop.
- src-tauri/src/limits.rs: não há budget específico para Smart Context.
- src/api.ts: ContextHit e api.smartContext esperam ContextHit[].
- O único teste local de smart_context.rs cobre excerpt Unicode; não cobre volume, budget ou deadline.

## Solução proposta
Criar ContextBudget/ContextStats e controlar independentemente: arquivos examinados, bytes agregados lidos, bytes por blob, tempo e tamanho da resposta. Valores iniciais para discussão (não medidos nem existentes): 2.000 arquivos, 64 MiB agregados, 2 MiB por blob, 2 segundos e 64 KiB de saída. O integrador deve aprovar os números após benchmark.
Paginar a consulta por chave estável (logical_path + id), interromper quando atingir qualquer teto, conferir byte_len antes da leitura e metadata do handle depois de abrir. Ler no máximo saldo+1, contabilizar bytes reais, usar Instant para deadline e evitar lowercase/char-vector integral; processar em chunks com fronteiras UTF-8. A resposta deve informar hits, stats, truncated e stop_reason. Ordenação determinística: score desc, logical_path asc, file_id asc.

## Arquivos e funções envolvidos
- src-tauri/src/smart_context.rs: smart_context(), excerpt(), novo leitor incremental e tipos de budget/resultado.
- src-tauri/src/limits.rs: constantes aprovadas.
- src/api.ts: ContextHit, novo ContextResult e api.smartContext.
- src/App.tsx: fluxo de Smart Context, exibição de resultado parcial e motivo.
- src-tauri/src/smart_context.rs ou src-tauri/src/tests.rs: testes.

## Invariantes de segurança
Budget agregado por invocação; nunca confiar somente no byte_len do DB; não ler além do teto; manter confinamento no BlobStore; sinalizar resultados parciais; ranking determinístico; não transformar falha de leitura em resultado completo silencioso.

## Riscos de regressão
Falsos negativos se termo estiver além do teto; diferença de score por chunking/case-folding Unicode; mudança do contrato array para objeto quebra consumidores; limite baixo prejudica relevância.

## Dependências
Missão 058 (catálogo de limites), 059 (deadline/cancelamento), 064–066 (stress, integração e regressão). Pode ser implementada isoladamente após aprovação dos budgets.

## Testes necessários
Unitários para accounting, limite exato/+1, deadline, UTF-8 dividido, Unicode e desempate. Integração com zero/muitos blobs, blob gigante, ausente, hash inválido e byte_len divergente. Stress com milhares de blobs, verificando tempo e bytes lidos. Regressão com fixture pequena comparada ao resultado anterior.
TESTE NÃO EXECUTADO: nenhum build, teste Rust, benchmark, stress ou teste de runtime foi executado nesta proposta.

## Critérios objetivos de aceite
Nenhuma invocação ultrapassa limites aprovados; deadline e contagem são observáveis; resposta parcial contém stop_reason; fixtures abaixo do limite mantêm ranking; frontend não apresenta resultado truncado como completo.

## Limitações
Análise estática. Não existe profiling que justifique os valores sugeridos; são defaults propostos para validação.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- arquivo: src-tauri/src/smart_context.rs; função: smart_context()/excerpt(); mudança: budget global, leitura limitada, deadline, stats e truncamento explícito; teste: unitário + integração/stress; risco: falsos negativos e regressão Unicode.
- arquivo: src-tauri/src/limits.rs; função: constantes; mudança: limites aprovados de scan/bytes/blob/tempo/saída; teste: boundary; risco: defaults inadequados.
- arquivo: src/api.ts; função: api.smartContext; mudança: retorno ContextResult; teste: typecheck/contrato; risco: quebra de consumidores.
- arquivo: src/App.tsx; função: tela Smart Context; mudança: mostrar parcialidade e motivo; teste: UI completa/truncada; risco: regressão de estado.