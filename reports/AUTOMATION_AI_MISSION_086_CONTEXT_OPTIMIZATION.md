# Missão 086 — Context Optimization

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: engenharia de contexto, eficiência de tokens e preservação semântica
- Data: 2026-11-10 | Status: REVIEW_REQUIRED
- Produto de referência: `vidift-max/tokensaver-ai`, branch `v2-saas-alpha`, HEAD `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f` (read-only)

## Objetivo
Definir estratégias para reduzir tokens sem perder informação necessária à tarefa, com critérios verificáveis de qualidade.

## Base observada
`src-tauri/src/smart_context.rs` lê os blobs completos, converte o texto para lowercase, pontua termos lexicalmente e só limita o número final de hits; não há budget global de arquivos/bytes/deadline demonstrado. `src-tauri/src/lib.rs` estima tokens localmente por caracteres (~4 chars/token) e declara a estimativa aproximada. `src/api.ts` expõe `smartContext(projectId, query, maxFiles)` e metadados de estimativa. Isso não equivale a tokenizer específico do provider.

## Estratégia proposta (ordem de menor perda)
1. **Normalização semântica conservadora:** remover apenas whitespace redundante e duplicações byte-idênticas; preservar código, tabelas, números, unidades, datas, negações, citações e estrutura.
2. **Seleção antes de compressão:** filtros por projeto/tipo/data, lexical BM25/TF-IDF ou ranking híbrido com campos estruturados; nunca ler blobs sem budget. Aplicar limites de arquivos, bytes totais, bytes por arquivo, tempo e tokens de saída.
3. **Deduplicação com proveniência:** detectar hashes iguais e trechos repetidos; preservar um exemplar e registrar origem/versão dos demais.
4. **Chunking com overlap controlado:** segmentar por headings/parágrafos/AST quando aplicável; preservar hierarquia e metadados. Evitar cortar tabelas, listas, blocos de código ou unidades lógicas.
5. **Compressão extrativa primeiro:** selecionar sentenças/trechos que sustentam a consulta; anexar caminho, versão, offsets/hash e motivo de seleção.
6. **Sumarização abstrativa opcional:** somente após aprovação de provider/privacy; resumo deve ter fonte por afirmação, cobertura mensurável e link para texto original. Nunca substituir a fonte canônica.
7. **Contexto progressivo:** enviar primeiro um mapa curto, depois trechos sob demanda; limite explícito por etapa e parada quando a evidência for suficiente.

## Invariantes de preservação
- Não remover negações, qualificadores, exceções, ressalvas, datas, valores, moeda, unidades, identificadores, nomes próprios ou citações.
- Não fundir fontes conflitantes; manter divergências visíveis.
- Distinguir fato da fonte, inferência e resumo do sistema.
- Conteúdo importado permanece dado não confiável, nunca instrução de sistema/tool.
- Todo contexto deve carregar projeto, arquivo, versão, SHA-256 e offsets quando disponíveis.
- Se budget for excedido, retornar PARTIAL com motivo e contagem; nunca truncar silenciosamente.

## Métricas e critérios de aceite
- Compression ratio = tokens_out/tokens_in; medir por tipo de documento e tarefa.
- Claim coverage e entity/number/date recall em conjunto de referência anotado.
- Exact match de números, sinais, unidades e negações; taxa de contradição; taxa de citações rastreáveis.
- Task success avaliado por revisores cegos; custo/latência p50/p95.
- Aceitar otimização apenas se qualidade superar um piso definido por tarefa; ratio sozinho não é métrica de sucesso.
- Testes adversariais com instruções maliciosas em arquivos, texto multilíngue, tabelas, código, documentos longos e conflitos entre versões.

## Arquitetura recomendada
Criar contrato `ContextManifest v1`: query, budget, candidate_count, selected_count, excluded[{file_id,reason}], chunks[{sha256,version,offset,length,token_estimate,score,reason}], total_estimated_tokens, truncated, warnings, algorithm_version. Separar seleção determinística de eventual sumarização por modelo.

## Relação com trabalhos anteriores
Complementa Missões 051/058 (budget e resource exhaustion), 075 (transparência UX) e 086 é pré-requisito para um futuro context broker. Não repete a auditoria; transforma os achados em política de otimização.

## Testes executados e limites
Leitura estática dos arquivos listados; nenhum benchmark, tokenizer provider, corpus de qualidade, teste de carga ou avaliação humana executado. Não se afirma perda zero comprovada. Nenhum código do produto principal alterado.

## Próximo passo
GPT-6 deve aprovar budget global e schema de manifesto antes de implementação. Kimi deve preparar corpus adversarial/ground truth; Automation pode implementar benchmark harness somente após grant.
