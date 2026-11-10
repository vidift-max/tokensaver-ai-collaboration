# Missão 062 — Error handling: contrato e mensagens de fronteira

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: revisão de contratos de erro Rust/TypeScript
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — análise estática

## Objetivo
Padronizar códigos, mensagens e propagação de erros entre backend Tauri e frontend.

## O que esta IA fez
Inspecionou `src-tauri/src/error.rs`, `db.rs`, `advanced.rs`, `path_guard.rs`, `backup.rs`, `src/api.ts` e `src/App.tsx`.

## Evidência
- `AppError` tem shape consistente `{code,message,details}`; `AppResult<T>` padroniza retorno.
- Muitos erros SQLite são convertidos para códigos estáveis, porém mensagens distintas escondem a causa interna de propósito.
- `api.ts::normalizeAppError` reconhece o contrato e usa fallback `INTERNAL_ERROR`.
- `advanced.rs::get_claude_config` transforma qualquer erro de `query_row` em configuração vazia/desabilitada; não distingue ausência de linha de erro real de banco. Isso pode ocultar corrupção/indisponibilidade.
- Mensagens de UI usam helper de fallback e mostram códigos/mensagens normalizadas.

## Problema e gravidade
MÉDIO — erro real pode ser apresentado como estado default em pelo menos get_claude_config; falta taxonomia formal e testes de contrato para todas as fronteiras.

## Solução proposta
Manter mensagens públicas sanitizadas; mapear `QueryReturnedNoRows` para default, propagar outros erros como DATABASE_ERROR. Definir catálogo de códigos e política de detalhes sem paths/secrets/SQL sensível. Adicionar correlação de erro sem conteúdo privado e não expor stack trace ao renderer.

## Testes necessários
Snapshot/schema do AppError; erro SQLite versus ausência de linha; falha de filesystem; detalhes sanitizados; erro desconhecido no frontend; garantir que secrets/paths locais não vazem.

## Testes executados
Não executado.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Complementa CLAUDE-02 e TAI-02 em `AI_COLLABORATION.md`; confirma que o contrato básico AppError já existe, não propõe substituí-lo.

## Dependências e limitações
A revisão não executou app nem validou mensagens em runtime.

## RECOMENDAÇÃO AO GPT-6
Corrigir o mascaramento de erro no get_claude_config e congelar catálogo de códigos com testes de compatibilidade Rust/TypeScript.
