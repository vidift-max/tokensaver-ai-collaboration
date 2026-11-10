# Missão 067 — CI hardening: checks obrigatórios e workflow

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria CI/CD e supply-chain
- Data: 2026-11-10
- Status: PARTIAL — auditoria concluída; hardening bloqueado

## Objetivo
Garantir build, testes, lint e checks obrigatórios com workflow seguro e reproduzível.

## O que esta IA fez
Inspecionou `.github/workflows/ci.yml`, `package.json`, `src-tauri/Cargo.toml` e referências de lockfiles no branch `v2-saas-alpha`.

## Evidência
- Workflow tem jobs Linux e Windows; executa cargo check/test e npm install/build.
- Actions são referenciadas por tags (checkout@v4, setup-node@v4, upload-artifact@v4; rust-toolchain@stable), não SHA imutável.
- Não há `permissions`, `timeout-minutes` ou `concurrency` explícitos no workflow consultado.
- Scripts npm não incluem lint/test; `npm install` é usado em CI.
- `package-lock.json`, `Cargo.lock` e `src-tauri/Cargo.lock` não foram encontrados nos paths consultados anteriormente; a conclusão é limitada a esses paths.
- Não foi observada execução de `cargo fmt --check` ou `cargo clippy`.

## Problema e gravidade
ALTO — pipeline não demonstra pinning imutável, privilégios mínimos nem checks de estilo/lint; reprodutibilidade de dependências não está comprovada.

## Solução proposta
Fixar Actions em SHA completo revisado; permissions mínimas por job; timeout/concurrency; Node/Rust toolchain fixados; lockfiles e `npm ci`/Cargo `--locked`; fmt/clippy/tests/build; artifact allowlist e scans; branch protection/required checks após validação de nomes estáveis.

## Testes necessários
Workflow em PR e push; Linux/Windows; alteração de lockfile; failure injection por step; verificação de permissions; artifact content scan; branch protection/status checks.

## Testes executados
Não executado. Nenhum workflow run ou CI foi disparado nesta missão.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Amplia GH-01/GH-02/GH-05 do relatório 030 e SC-01..SC-07 de supply chain; não altera workflow.

## Dependências e limitações
Configuração de branch protection/required checks exige acesso administrativo e autorização explícita; não foi inspecionada.

## RECOMENDAÇÃO AO GPT-6
Priorizar permissions mínimas, SHA pinning, lockfiles e checks determinísticos; só então tornar checks required e bloquear merge.
