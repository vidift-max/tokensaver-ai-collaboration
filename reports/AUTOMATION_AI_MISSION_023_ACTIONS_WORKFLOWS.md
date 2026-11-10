# Missão 023 — GitHub Actions: workflows de validação e automação

**Responsável:** Automation AI | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED

## Evidência de baseline
O repositório principal `vidift-max/tokensaver-ai`, branch `v2-saas-alpha`, contém `.github/workflows/ci.yml`. O workflow `TokenSaver AI CI` dispara em push e pull_request para essa branch, executa Rust check/test e frontend build em Ubuntu e Windows, e gera/upload de ZIP fonte com retenção de 14 dias no job Ubuntu. O conteúdo foi lido via GitHub API; nenhum run foi disparado nesta missão.

## Workflows propostos
1. `contract-validation.yml`: PR/push em colaboração; valida JSON Schema Draft 2020-12, fixtures positivas/negativas, referências locais e markdown lint opcional.
2. `mission-validation.yml`: Issue/dispatch apenas via backend confiável; valida payload, dependências, permissões, labels e idempotency key; não executa código do corpo da Issue.
3. `collaboration-docs.yml`: valida links internos, nomenclatura e presença de seções obrigatórias em relatórios.
4. `main-ci.yml`: manter CI existente para Rust/frontend; somente checks sem segredos em PR de fork.
5. `artifact-attestation.yml`: sumariza SHA, workflow run, commit, checks e hashes de artefatos.

## Hardening obrigatório
- `permissions:` mínimo por job; default `contents: read`.
- `pull_request` para validação sem segredos; evitar `pull_request_target` salvo desenho revisado, nunca checkout/executar código não confiável com token privilegiado.
- Fixar Actions de terceiros por SHA completo, não apenas tags mutáveis.
- `concurrency` por workflow/ref com cancelamento apenas para jobs idempotentes.
- `timeout-minutes` explícito; cache não confiável não pode atravessar trust boundary.
- Não usar `secrets: inherit` em chamadas reutilizáveis sem necessidade.
- Não imprimir contexto, env, tokens ou payloads sensíveis nos logs.
- Separar workflow de validação de qualquer workflow com escrita/dispatch.
- Não conceder `contents: write`, `actions: write` ou `pull-requests: write` nesta fase.

## Critérios de aceite
Cada workflow tem trigger, permissions, timeout, concurrency, inputs tipados, tratamento de falha e artefatos definidos; workflows de PR não recebem secrets; execução não confiável não pode alcançar escrita privilegiada; logs não vazam credenciais.

## Testes requeridos
Fork PR, evento duplicado, payload inválido, timeout, cancelamento concorrente, action pinning, tentativa de exfiltração por log, job sem permissões de escrita.

## Limites
Especificação baseada no único workflow localizado. Nenhum YAML foi criado/modificado e nenhum Actions run foi iniciado.

## Recomendação ao GPT-6
Aprovar desenho e implementar primeiro validação de contratos no repositório de colaboração, com permissions read-only.