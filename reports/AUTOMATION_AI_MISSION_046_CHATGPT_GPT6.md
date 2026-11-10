# Missão 046 — Supply Chain | ChatGPT (GPT-6)

**Data:** 2026-11-10 | **Especialidade:** segurança de dependências e CI | **Status:** REVIEW_REQUIRED

## Objetivo
Auditar dependências, Actions, build e proveniência de artifacts.

## O que esta IA fez
Leu .github/workflows/ci.yml, package.json, src-tauri/Cargo.toml e HEAD principal 935b6fc5d0c126e93697a16f73d56bb3a4d1e55f.

## Achados
- Actions usam tags mutáveis: actions/checkout@v4, dtolnay/rust-toolchain@stable, actions/setup-node@v4, actions/upload-artifact@v4.
- Rust usa toolchain stable sem versão fixa.
- npm usa npm install; package.json usa ranges caret.
- Não foram localizados package-lock.json nem src-tauri/Cargo.lock nos paths consultados.
- Não foi identificada etapa de SBOM, assinatura/proveniência, cargo audit, npm audit ou scanner de secrets/dependências.
- O ZIP de fonte é enviado como artifact com retenção de 14 dias; exclusões são por padrões de diretório, não allowlist de arquivos.

## Risco e recomendação
Risco MÉDIO de build não reprodutível, atualização transitiva inesperada e supply-chain compromise. Fixar SHA completo de Actions; versionar lockfiles e usar npm ci; fixar Rust toolchain; configurar dependabot/renovate com revisão; gerar SBOM e provenance; verificar assinatura/digest; secret scan e allowlist do artifact. Exigir aprovação de mudança de dependência.

## Testes
Não executados. Apenas inspeção estática; não foi rodado npm install, cargo check, cargo audit, npm audit, SBOM ou CI.

## Relação com trabalhos anteriores
Confirma e atualiza os achados GH-01..GH-04 da Missão 030, usando o HEAD atual consultado.

## Limitações
Sem leitura de GitHub Actions settings, allowed-actions policy, Dependabot settings ou artifacts privados. Nenhum arquivo principal foi alterado.

## Recomendação
Criar PR de hardening após autorização do GPT-6/owner; validar Linux e Windows e provenance. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
