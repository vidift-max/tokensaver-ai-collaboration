# Missão 046 — Auditoria de Supply Chain

## Identificação
- IA: ChatGPT | Modelo: GPT-6 (OpenAI)
- Especialidade: segurança de dependências, CI/CD e proveniência de artefatos
- Função: auditoria estática de manifests, lockfiles e workflows
- Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo
Avaliar riscos de dependências, GitHub Actions, instalação, build e publicação de artefatos.

## O que esta IA fez
Inspecionou manifests e CI do produto e definiu remediações priorizadas.

| ID | Severidade | Evidência observada | Recomendação |
|---|---|---|---|
| SC-01 | Alta | ci.yml usa checkout@v4, rust-toolchain@stable, setup-node@v4 e upload-artifact@v4 por tags/refs mutáveis | Fixar SHA completo revisado |
| SC-02 | Alta | Workflow usa npm install; package-lock.json não encontrado no root consultado | Commitar lockfile e usar npm ci com Node/npm fixados |
| SC-03 | Alta | Cargo.toml declara ranges; Cargo.lock e src-tauri/Cargo.lock não encontrados nos paths consultados | Confirmar workspace, versionar lockfile e usar cargo --locked |
| SC-04 | Média | Workflow sem permissions explícitas | contents: read por padrão; elevar por job justificado |
| SC-05 | Média | Sem timeout-minutes ou concurrency no workflow consultado | Definir timeout e grupo de concorrência |
| SC-06 | Alta | ZIP fonte criado por inclusão ampla com exclusões e retenção de 14 dias | Artifact allowlist, scan pré-upload, ACL/retenção explícitos |
| SC-07 | Alta | Nenhuma evidência de SBOM, provenance attestation, assinatura ou digest verification nos arquivos examinados | Gerar SBOM/attestation e verificar digest |
| SC-08 | Média | Sem evidência de SCA/Dependabot nos paths examinados | Ativar alertas/SCA e atualização revisada |

### Stack observada
package.json: React 19, Tauri API/CLI 2, Vite 6, TypeScript 5.6 e plugin React 4.3, com ranges.
src-tauri/Cargo.toml: Tauri 2, Serde 1, UUID 1, SHA-2 0.10, rusqlite 0.32, thiserror 2, tauri-build 2.
tauri.conf.json: build desktop Windows NSIS e CSP configurada.
Nenhuma versão transitive foi inferida sem lockfile.

## Arquivos examinados
Produto: .github/workflows/ci.yml, package.json, src-tauri/Cargo.toml, src-tauri/tauri.conf.json, src-tauri/build.rs. package-lock.json, Cargo.lock e src-tauri/Cargo.lock retornaram 404 nos paths consultados.

## Relação com trabalhos anteriores
Amplia GH-01..GH-04 da missão 030. Ausência de arquivo limitada aos paths consultados; confirmar outras pastas/branches antes de concluir inexistência global.

## Problemas encontrados
Não há evidência no escopo examinado de pinning por SHA, lockfiles reproduzíveis, SCA, SBOM ou artifact attestation.

## Testes executados
Não executado. Nenhum build, npm audit, cargo audit, dependency review, secret scan, SBOM ou artifact verification.

## Próximo passo
Corrigir lockfiles/reprodutibilidade e Actions pinning; depois implementar SCA, SBOM/provenance, artifact allowlist e digest verification. Não publicar release sem evidência.
