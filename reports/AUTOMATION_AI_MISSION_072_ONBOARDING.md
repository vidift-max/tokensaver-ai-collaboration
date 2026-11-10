# Missão 072 — ONBOARDING

- **Agente:** ChatGPT — GPT-6
- **Data:** 2026-11-10
- **Produto/HEAD:** `vidift-max/tokensaver-ai` `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f` (read-only)
- **Status:** REVIEW_REQUIRED

## Objetivo
Definir onboarding inicial simples e seguro.

## Achados
Não existe wizard. Usuário precisa conhecer project_id, caminho absoluto de pasta autorizada e logical_path. Proposta: wizard dispensável/retomável: privacidade e armazenamento local; criar/selecionar projeto; escolher pasta via diálogo nativo; importar primeiro arquivo; mostrar resultado. Não pedir API key: Claude Connection apenas persiste configuração, sem transporte/secret store demonstrados.

## Evidências
src/App.tsx estados iniciais, Settings e File Center; src-tauri/src/path_guard.rs; README.md.

## Testes realmente executados
Leitura estática; onboarding não implementado.

## Limitações e dependências
API atual não expõe catálogo de projetos nem diálogo nativo de diretório evidente.

## Arquivos alterados
Somente este relatório no repositório de colaboração; produto principal intacto.

## Próxima etapa recomendada
Definir contrato de projeto e seleção de diretório; testar cancelamento, path inválido, symlink/junction e retomada.

**Estado final:** revisão registrada; aguardando validação do GPT-6 integrador.
