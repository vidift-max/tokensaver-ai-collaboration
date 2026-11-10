# WAVE 001 — Missão 051: Smart Context

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
O comando limita apenas o número de hits retornados, não o trabalho. `smart_context` percorre todas as rows mais recentes, faz `read_to_string` integral por blob, cria cópia `to_lowercase` e calcula excerpt com outra cópia lowercase. O `max_files.clamp(1,20)` só é aplicado em `hits.truncate`, depois de toda leitura e pontuação. Não há teto agregado de bytes, arquivos, CPU ou deadline, nem indicação de resultado parcial.

## Evidências no código
- `src-tauri/src/smart_context.rs::smart_context`: SELECT sem LIMIT; loop lê cada blob integralmente; pontua todos e trunca no final.
- `smart_context.rs::excerpt`: lowercase integral adicional.
- `src-tauri/src/limits.rs`: não define budgets Smart Context; timeout declarado não é usado neste módulo.
- `src/api.ts`: `api.smartContext` retorna `ContextHit[]`, sem metadado de truncamento.
- Relatórios correlatos lidos: missões 058, 059, 064 e 075.

## Solução proposta
Criar `ContextBudget` com máximos independentes para rows examinadas, bytes por blob, bytes agregados, caracteres processados e deadline monotônico. Definir os valores em `limits.rs` após aprovação. Consultar em páginas estáveis por `logical_path`; verificar budget antes de abrir cada blob e usar leitura limitada `take(remaining+1)` para detectar crescimento. Não usar byte_len do DB como única garantia. Remover lowercasing integral duplicado; fazer matching limitado/streaming e excerpt por janela. Ao esgotar budget, parar e retornar envelope `ContextResult { hits, examined_files, bytes_read, truncated, truncation_reason }`. Adaptar API e UI. Preservar score e ordenação determinísticos nos itens efetivamente examinados. Integrar abertura de blobs com o resolver seguro da Missão 063.

## Invariantes de segurança
- Bytes efetivamente lidos e arquivos examinados nunca excedem os tetos por chamada.
- Budget é cumulativo, monotônico e usa checked arithmetic.
- Nenhuma alocação cresce com o catálogo inteiro; excerpt possui janela fixa.
- Busca incompleta é explicitamente marcada como truncada.
- Nenhum blob fora da raiz validada é aberto.

## Riscos
Ranking parcial difere do ranking global; matching Unicode pode mudar com streaming; envelope IPC quebra consumidores que esperam array; budget muito conservador reduz recall. Deadline sem verificação frequente não impede bloqueio síncrono.

## Dependências
Missão 063 (abertura de blob sem TOCTOU), 058/064 (matriz de budgets), 059 (deadline/cancelamento), 075 (transparência na UI). GPT-6 deve aprovar valores e contrato IPC.

## Testes necessários
Unitários: budget 0/max/max+1, overflow, blob gigante, bytes agregados, deadline expirado, truncation reason, UTF-8/casefold/acento/excerpt. Integração: catálogo vazio, teto e teto+1, blob ausente/corrompido, IPC/UI parcial. Estresse: milhares de blobs e chamadas concorrentes; medir bytes, RSS, CPU e latência. **TESTE NÃO EXECUTADO:** todos os testes/build/benchmarks acima.

## Critérios objetivos de aceite
Instrumentação comprova tetos estritos; RSS bounded pelo design; truncamento explícito; ranking determinístico dentro do conjunto examinado; testes Linux/Windows passam; projeto principal permanece inalterado até grant.

## Limitações
Análise estática. Valores finais requerem perfil de dados. Byte budget não é limite exato de CPU/RSS. Defesa TOCTOU depende da Missão 063.

## Relação com trabalho anterior
O relatório 051 anterior identificou leitura integral e limite tardio. Esta proposta acrescenta envelope de parcialidade, contagem de bytes realmente lidos, consulta paginada, eliminação de cópias integrais e critérios mensuráveis.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
| arquivo | função | mudança | teste | risco |
|---|---|---|---|---|
| `src-tauri/src/limits.rs` | constantes | rows/bytes/blob/total/chars/deadline | max/max+1 | calibração |
| `src-tauri/src/smart_context.rs` | `smart_context` | paginação, budget cumulativo, deadline e envelope | integração 0/max/max+1 | ranking parcial |
| `src-tauri/src/smart_context.rs` | `excerpt` e matching | janela limitada, sem lowercase integral | Unicode/chunk | semântica Unicode |
| `src/api.ts` | `ContextHit`, `api.smartContext` | tipo `ContextResult` | typecheck/IPC | breaking change |
| `src/App.tsx` | consumidor Smart Context | aviso de truncamento | UI integration | UX de parcialidade |
