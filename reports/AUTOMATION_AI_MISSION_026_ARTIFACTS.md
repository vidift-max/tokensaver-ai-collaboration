# Missão 026 — Padronização de artefatos, relatórios e evidências

**Responsável:** Automation AI | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED

## Estrutura
Cada execução produz diretório lógico `mission/{mission_id}/revision/{revision}/run/{run_id}/` contendo:
- `result.json`: status, resumo, agente, timestamps, schema_version;
- `evidence.json`: evidências estruturadas e classificação de confiança;
- `manifest.json`: commit SHA, branch/ref, workflow run ID, job IDs, hashes SHA-256, nomes/tamanhos, versão de contrato, retenção;
- `logs/`: logs sanitizados, sem segredos e com retenção menor;
- `reports/`: relatório humano Markdown;
- anexos somente quando necessários e allowlisted.

## Manifesto mínimo
`artifact_id`, `mission_id`, `revision`, `run_id`, `repository_id`, `commit_sha`, `workflow_run_id`, `created_at`, `media_type`, `size_bytes`, `sha256`, `classification`, `retention_until`, `source`, `schema_version`.

## Integridade e armazenamento
- Hash SHA-256 calculado no upload e verificado no download.
- Artefato vinculado a commit imutável; não confiar em nome de arquivo.
- Artefatos de PR não confiável ficam isolados e não são consumidos por jobs privilegiados.
- Sanitizar logs e redigir tokens, cookies, authorization headers, dados pessoais e payloads secretos.
- Limite por arquivo, run, missão e retenção; compressão não pode contornar limite descompactado.
- Retenção GitHub Actions é limitada e configurável; evidência de longo prazo deve ser copiada para armazenamento controlado, com ACL e política própria.
- Relatórios Markdown não são fonte de autorização.

## Critérios de aceite
Manifesto validado; hash rechecado; tamanho/tipo allowlisted; política de retenção e acesso; vínculo commit/run; logs sanitizados; falha de upload não marca missão como concluída.

## Testes requeridos
Hash divergente, artefato adulterado, arquivo excessivo, zip bomb, tipo proibido, segredo em log, expiração, artefato de fork e commit inexistente.

## Limites
Nenhum artefato foi publicado ou baixado nesta missão; não houve execução Actions.

## Recomendação ao GPT-6
Adotar manifest + SHA-256 desde o primeiro worker mock e evitar usar artifacts de Actions como banco de estado.