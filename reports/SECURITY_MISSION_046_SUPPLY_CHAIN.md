# Missão 046 — Supply-chain security

- **IA/modelo:** ChatGPT — GPT-6 | **Data:** 2026-11-10
- **Status:** REVIEW_REQUIRED — auditoria estática parcial; nenhuma alteração de CI.

## Achados observados
1. `.github/workflows/ci.yml` usa `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4` e `dtolnay/rust-toolchain@stable`: referências mutáveis/tag, não SHA imutável.
2. Workflow consultado não declara `permissions:` explícitas, timeout-minutes ou concurrency.
3. `package.json` declara dependências com ranges semânticos; `package-lock.json` não foi localizado no path consultado.
4. `src-tauri/Cargo.toml` declara dependências; `Cargo.lock` não foi localizado no path consultado.
5. Não foram localizados `.github/dependabot.yml`, CODEOWNERS nos paths padrão consultados. Isso não prova ausência em todos os paths/branches.
6. Workflow empacota ZIP de fonte e faz upload; não há evidência no trecho consultado de SBOM, provenance attestation ou assinatura.

## Controles requeridos
- Commit SHA completo para cada action; revisar atualizações por PR.
- Lockfiles versionados e instalação frozen/locked (npm ci; cargo --locked).
- Dependabot/Renovate com revisão humana.
- SBOM SPDX/CycloneDX por release e scanner de vulnerabilidade/licença.
- Build provenance/attestation assinada e assinatura de artefatos.
- Pinning de toolchain Rust/Node; evitar `stable` flutuante em release.
- Workflow permissions mínimo por job; timeout e concurrency.
- PR de fork sem secrets e sem write token; separar build/test de publish.
- Cache não confiável não deve atravessar fronteiras de trust.
- Artefatos com checksum, retenção mínima e acesso restrito.
- Reproducible build quando viável.

## Testes necessários
SCM-01 lockfile reproducibility; SCM-02 action SHA audit; SCM-03 SBOM generation/validation; SCM-04 provenance verification; SCM-05 fork PR secret isolation; SCM-06 artifact tamper; SCM-07 dependency vulnerability/license scan.

## Testes executados
Somente inspeção estática dos arquivos. Nenhum scanner, build, dependency resolution ou CI executado.

## Limitações
A auditoria depende da branch/path consultados; não foram inspecionadas configurações administrativas nem todas as versões/transitivas. Achados de ausência devem ser rechecados no HEAD atual.

## RECOMENDAÇÃO AO GPT-6
Corrigir workflow com permissions read-only, SHA pinning, timeouts/concurrency e lockfiles antes de usar secrets ou distribuir release; adicionar SBOM/provenance como gate.