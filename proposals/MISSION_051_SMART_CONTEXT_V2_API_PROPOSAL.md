# Missão 051 — proposta de contrato compatível para Smart Context v2

Status: PROPOSTA PARA RECONCILIAÇÃO — NÃO IMPLEMENTAR SEM APROVAÇÃO DO INTEGRADOR  
Branch de referência do produto: `v2-saas-alpha`  
HEAD observado: `734816efbc8ff8d5c1346a1b269388166854328f`

## 1. Evidência do contrato atual

- Backend: `smart_context` retorna `AppResult<Vec<ContextHit>>`.
- Frontend: `api.smartContext(projectId, query, maxFiles)` tipa e invoca `ContextHit[]`.
- A UI consome `file_id`, `logical_path`, `version_no`, `byte_len`, `token_estimate`, `score`, `excerpt`.
- Os limites de candidatos e bytes agregados já existem, mas não há sinalização explícita de truncamento, motivo de parada, tempo decorrido ou orçamento consumido.
- A busca tem parada por limites, mas não deadline cooperativo. O contrato atual não permite distinguir resultado completo de resultado parcial.

## 2. Decisão proposta: adicionar comando versionado

Não alterar o retorno do comando existente. Introduzir:

- `smart_context_v2(project_id, query, max_files) -> AppResult<ContextResult>`
- Manter `smart_context` com o retorno `Vec<ContextHit>` durante a janela de compatibilidade, implementado como adaptador que chama a mesma rotina interna.

Contrato serializado proposto:

```ts
type ContextStopReason =
  | "completed"
  | "max_files"
  | "max_bytes"
  | "deadline"
  | "output_budget";

type ContextResult = {
  hits: ContextHit[];
  truncated: boolean;
  stop_reason: ContextStopReason;
  files_examined: number;
  bytes_read: number;
  elapsed_ms: number;
  limits: {
    max_files: number;
    max_bytes: number;
    max_file_bytes: number;
    max_output_bytes: number;
    deadline_ms: number;
  };
};
```

Sem conteúdo de arquivo ou caminhos adicionais nos metadados. Não retornar dados sensíveis além dos campos já presentes nos hits.

## 3. Regras de execução propostas

1. Usar uma única rotina interna com orçamento explícito e relógio monotônico (`Instant`).
2. Verificar deadline antes de avançar para cada candidato e entre operações de leitura; não alegar cancelamento instantâneo de chamadas de filesystem/SQLite já bloqueadas.
3. Contabilizar cada linha candidata assim que obtida, inclusive SHA/path inválidos.
4. Contabilizar bytes efetivamente lidos, não apenas `byte_len` do banco.
5. Impor limite individual, agregado e de saída serializável. O tamanho de saída deve considerar UTF-8 em bytes, não caracteres.
6. Definir `truncated=true` somente quando uma condição de orçamento interromper a busca antes de completar o conjunto elegível; `stop_reason` informa a primeira condição de parada.
7. Se o limite de hits `max_files` for atingido, distinguir entre “resultado completo” e “há candidatos ainda não examinados” somente se a implementação puder provar essa condição sem ultrapassar o orçamento.
8. Ordenar hits da mesma forma atual para preservar estabilidade e relevância.
9. Não elevar limites atuais sem benchmark e análise de memória.

## 4. Migração frontend proposta

- Adicionar tipos `ContextResult` e `ContextStopReason` em `src/api.ts`.
- Adicionar `api.smartContextV2`, sem remover `api.smartContext`.
- Migrar a tela Smart Context para mostrar um aviso discreto quando `truncated=true`, com motivo e contagens de arquivos/bytes.
- Manter renderização atual de hits; evitar exibir telemetria como se fosse precisão de busca.
- Remover o comando legado somente em versão futura com migração deliberada e sem consumidores antigos.

## 5. Testes de aceitação necessários

- Busca completa: `truncated=false`, `stop_reason=completed`.
- Limite de candidatos, bytes agregados e bytes por arquivo: parada correta e contadores exatos.
- Deadline: parada cooperativa determinística usando relógio injetável/função de teste, sem sleeps frágeis.
- Output budget: nunca serializar acima do teto; UTF-8 multibyte coberto.
- SHA/path inválido conta como candidato, mas não como bytes lidos.
- Consulta sem hits, múltiplos termos, Unicode e ordenação empatada.
- Compatibilidade: comando legado continua retornando exatamente `Vec<ContextHit>`.
- Testes frontend para aviso de truncamento e ausência de aviso em resultado completo.
- CI Linux/Windows: `cargo check`, `cargo test`, `npm run build`.

## 6. Pontos que exigem reconciliação antes da implementação

- Escolher e justificar `deadline_ms` e `max_output_bytes` com medições, não por palpite.
- Definir se `max_files` significa máximo de hits retornados ou máximo de candidatos examinados; hoje o parâmetro limita hits, enquanto o orçamento de candidatos é independente.
- Definir semântica precisa de `stop_reason=max_files` quando a busca poderia ter mais hits.
- Verificar compatibilidade de serialização Tauri/Rust/TypeScript e limites de payload IPC.
- Confirmar se o comando legado deve continuar indefinidamente ou por uma versão de migração.

## 7. Não objetivos

- Não alterar ranking/algoritmo de relevância nesta missão.
- Não adicionar embeddings, chamadas de IA, rede ou OCR.
- Não aumentar budgets atuais sem benchmark.
- Não alterar schema SQLite.
- Não quebrar o retorno frontend existente.

## 8. Critério de conclusão

A missão 051 só poderá ser marcada como concluída após contrato reconciliado, implementação backend/frontend, testes de orçamento/deadline/compatibilidade e CI verde no mesmo HEAD. Esta proposta isolada não representa implementação.
