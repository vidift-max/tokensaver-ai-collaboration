# Missão 046 — Supply Chain Security

**Identificação:** ChatGPT — GPT-6 | **Especialidade:** segurança de aplicações e arquitetura multiagente | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED — especificação documental, não controle implantado.

**Escopo:** análise estática/documental. Nenhum código do repositório principal foi alterado; nenhum secret foi acessado; nenhum teste dinâmico foi executado.

## Objetivo e contribuição própria
Inspecionei manifests e CI disponíveis e defini controles para dependências, Actions, artifacts e provenance. Não instalei pacotes nem alterei workflows.

## Evidência examinada
- src-tauri/Cargo.toml, SHA 0c78d0f18997156b32d95d8d6546a36000d56be7: dependências Rust por ranges (tauri 2, serde 1, serde_json 1, uuid 1, sha2 0.10, thiserror 2, rusqlite 0.32, tauri-build 2).
- package.json, SHA dae0fcab0335e68705b8514204fe015a3b21b254: dependências npm por ranges.
- .github/workflows/ci.yml, SHA 98a61527e42bcc960af2a80fa26b9456bb619f5d: checkout@v4, rust-toolchain@stable, setup-node@v4, upload-artifact@v4; sem permissions explícitas, SHA pinning, timeout-minutes ou concurrency.
- Fetch de Cargo.lock na raiz, package-lock.json e Cargo.toml na raiz retornou 404. Isso cobre somente os paths consultados.

## Achados e ações
| ID | Severidade | Evidência | Ação |
|---|---|---|---|
| SC-01 | Alta | Actions por tags móveis | pin SHA completo validado |
| SC-02 | Alta | lockfiles não localizados nos paths esperados | confirmar e versionar Cargo.lock e npm lockfile |
| SC-03 | Média | rust-toolchain@stable móvel | fixar versão |
| SC-04 | Alta | workflow sem permissions | contents: read mínimo por job |
| SC-05 | Média | ZIP de fonte por exclusões | allowlist, secret scan, manifest/hash, retenção |
| SC-06 | Média | timeout/concurrency ausentes | limites por job |
| SC-07 | Não avaliado | SBOM/provenance não demonstrados | SBOM, provenance e assinatura verificável |

## Controles propostos
Install frozen/locked; SHA pinning com atualização revisada; runner efêmero; secrets ausentes em PRs de fork; SBOM CycloneDX/SPDX; artifact por allowlist; SHA-256 e provenance ligados a commit/workflow; secret scan; release com tag protegida e revisão independente.

## Testes necessários
Action tag alterada; dependência adulterada; PR de fork; secret canary em artifact; hash mismatch; provenance ausente; build sem rede; dependência transitiva vulnerável; permissões excessivas.

## Testes executados
Não executado: cargo audit, npm audit, OSV, SBOM, secret scan, build, CI, reproducible build ou assinatura.

## Relação com trabalhos anteriores
Aproveita findings GH-01/GH-02/GH-04/GH-05 da Missão 030; adiciona leitura atual dos manifests e workflow.

## Limitações/status
Não foram consultados advisories nem resolvidas versões transitivas; nenhuma CVE específica é alegada. REVIEW_REQUIRED. Recomendo lockfiles, SHA pinning e permissions mínimas antes de adicionar secrets. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.