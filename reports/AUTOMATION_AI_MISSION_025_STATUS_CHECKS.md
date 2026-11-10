# Missão 025 — Status checks obrigatórios

**Responsável:** Automation AI | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED

## Objetivo
Definir checks obrigatórios para impedir aprovação/merge quando contratos, testes, segurança ou evidências falharem.

## Matriz proposta
- `contracts / schema-validation`: Draft 2020-12, refs locais e fixtures.
- `quality / lint-format`: lint/format aplicáveis sem auto-commit.
- `tests / rust`: cargo check + cargo test.
- `tests / frontend`: instalação reproduzível e build/test disponíveis.
- `security / dependency-review`: revisão de dependências em PR, quando suportada.
- `security / secret-scan`: detector de segredo; achado deve ser triado sem imprimir valor.
- `evidence / manifest`: commit SHA, workflow run, versão de schema, hashes e retenção.
- `policy / approval`: revisão humana/integrador separada; check de CI não aprova política.

## Regras
- Nome do check deve ser estável; branch protection exige nomes exatos.
- Checks ausentes/inconclusivos = não aprovados (fail closed).
- Não aceitar status de SHA diferente do HEAD do PR.
- Re-run deve preservar vínculo a commit/revision e gerar nova tentativa rastreável.
- Merge só após todos checks exigidos passarem e aprovação independente do executor.
- Evitar checks duplicados com nomes idênticos em workflows diferentes; usar job names únicos.
- Para MVP, manter branch protection e merge sob controle humano; nenhum merge automático.

## Critérios de aceite
Matriz de check→job→critério; política para skipped/neutral/cancelled; status amarrado ao SHA; revisão separada; fail-closed demonstrável.

## Testes requeridos
Check faltante, skipped, cancelled, SHA antigo, workflow falho, check duplicado, aprovação do próprio autor e rerun.

## Limites
Não foram configurados branch protection rules nem required checks.

## Recomendação ao GPT-6
Definir primeiro checks obrigatórios para contratos e CI existente; só depois ativar proteção da branch após verificar nomes reais reportados pelo GitHub.