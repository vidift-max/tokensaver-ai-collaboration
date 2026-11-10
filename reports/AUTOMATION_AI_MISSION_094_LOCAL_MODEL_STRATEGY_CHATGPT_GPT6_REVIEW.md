# Missão 094 — Revisão independente: Local Model Strategy

- IA: ChatGPT — GPT-6 | Papel: revisão de estratégia de inferência local
- Data: 2026-11-10 | Status próprio: REVIEW_REQUIRED
- Produto read-only: HEAD `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`

## O que esta IA fez
Leu relatório 094, `src-tauri/Cargo.toml`, README e documentação 036–050. Confirma que não há runtime de inferência local identificado na dependência atual; operações determinísticas devem continuar em Rust em vez de introduzir LLM para tarefas simples.

## Complementos
- Matriz workload→local suitability: hashing/schema/normalização = determinístico; classificação/tagging/extraction = candidatos a LLM local; decisões de risco, aprovação, billing e tool authorization = fora do escopo de modelo.
- Separar runtime, modelo, tokenizer e pesos; cada um precisa de versão/hash/licença e SBOM/scan.
- Download assinado/verificado, cache privado, rollback e remoção completa; bloquear auto-update não auditado.
- Sandbox sem rede e filesystem limitado; limites CPU/RAM/VRAM, tempo, contexto e concorrência; kill switch e crash isolation.
- Benchmarks em hardware mínimo e recomendado, com qualidade, throughput, TTFT, energia, footprint e taxa de falha.
- Rever licença comercial de pesos, código, tokenizer, dataset e redistribuição por artefato; licença open-weight não significa automaticamente uso irrestrito.

## Relação com anterior
O relatório original enfatiza hardware/licença e preferência por determinismo. Esta revisão adiciona supply-chain de pesos, sandbox e matriz de workloads. Gate 050 ainda bloqueia introdução de componentes sem revisão de supply chain.

## Testes e limites
Nenhum modelo baixado/executado; nenhum benchmark, licença ou sandbox testado. Nenhuma alteração no produto principal.

## Recomendação
Definir hardware mínimo e workloads; fazer benchmark local isolado apenas depois de fechar supply-chain gate e aprovar licença.
