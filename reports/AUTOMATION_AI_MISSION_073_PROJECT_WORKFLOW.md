# Missão 073 — PROJECT WORKFLOW

- **Agente:** ChatGPT — GPT-6
- **Data:** 2026-11-10
- **Produto/HEAD:** `vidift-max/tokensaver-ai` `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f` (read-only)
- **Status:** REVIEW_REQUIRED

## Objetivo
Revisar criação, abertura, edição e fechamento de projetos.

## Achados
projectId é estado local com default 'default'; não há listagem/seletor/criação explícita/rename/close nem confirmação de troca com operação pendente. initialize_project cria diretórios/banco, não catálogo. Trocar ID pode manter arquivos/memória/artigos/resultados do projeto anterior na UI. Proposta: catálogo/serviço de projetos, projeto ativo único, invalidação de estado e proteção de operações em andamento.

## Evidências
src/App.tsx; src/api.ts; src-tauri/src/lib.rs::initialize_project.

## Testes realmente executados
Leitura estática; nenhum fluxo multi-projeto executado.

## Limitações e dependências
Risco de UI obsoleta, não prova de perda de dados.

## Arquivos alterados
Somente este relatório no repositório de colaboração; produto principal intacto.

## Próxima etapa recomendada
Projetar máquina de estados e testar A→B, restart, ID inválido, projeto vazio e operação pendente.

**Estado final:** revisão registrada; aguardando validação do GPT-6 integrador.
