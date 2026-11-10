# Missão 049 — Controles contra Data Exfiltration

## Identificação
- IA: ChatGPT | Modelo: GPT-6 (OpenAI)
- Especialidade: proteção de dados, DLP e segurança de contexto LLM
- Função: controles de minimização, classificação e prevenção de vazamento
- Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo
Evitar que dados de projetos, arquivos, secrets, prompts, metadados e resultados sejam enviados a destinatários ou agentes não autorizados.

## O que esta IA fez
Política proposta:

### Classificação e egress
- Public: material aprovado para divulgação.
- Internal: documentos de projeto e metadados de operação.
- Confidential: conteúdo de clientes/projetos, drafts e bases privadas.
- Secret: tokens, API keys, cookies, webhook secrets, private keys e grants.
- Cada missão declara classificação máxima e destinos/providers autorizados.
- Provider com política de região/retention desconhecida não recebe Confidential/Secret.
- Secret nunca é enviado a LLM; Confidential exige minimização e política de provider aprovada.

### Controles
1. Retrieval apenas por path/trecho necessário, com limites de bytes/tokens.
2. Redaction de credenciais/PII antes de prompt, log, trace, issue e artifact.
3. Egress allowlist por provider, região, endpoint e missão.
4. Separação de contexto entre agentes; não compartilhar conversas/artefatos automaticamente.
5. Sanitizar outputs e erros; não ecoar headers, env, stack secrets ou raw payload.
6. Artifact allowlist, secret scan, hash, ACL e retenção.
7. Logs com IDs/hash/status, sem prompt completo, dados pessoais ou secrets.
8. Canary secrets sintéticos para detectar saída indevida; bloquear publicação em caso de match.
9. Retention/purge por classe/provider, com processo verificável.
10. Data lineage: source ID, classificação, transformação, provider/region, purpose e recipient.

## Arquivos examinados
contracts/v1/mission.schema.json, provider-registry.json, README do registry, src-tauri/src/lib.rs, src-tauri/src/advanced.rs, .github/workflows/ci.yml e AI_COLLABORATION.md.

## Relação com trabalhos anteriores
Aproveita untrusted_data dos contratos 003–005, matriz 010, artifact 026, security audit 030 e adapters/registry 031–040. Expande política para classificação e destinos, além de redaction.

## Problemas encontrados
- Crítico: não há evidência de enforcement de classificação/egress/DLP no runtime.
- Alto: CI gera ZIP source por inclusão ampla com exclusões; não há evidência de secret scan antes do upload.
- Alto: provider real não está habilitado, mas política de dados/retention ainda não foi verificada.
- Informação insuficiente: secrets settings, logs de produção e telemetria não foram inspecionados.

## Testes executados
Não executado. Nenhum DLP, canary secret, egress test ou artifact scan foi executado.

## Próximo passo
Definir classificação e policy matrix por provider; implementar DLP/egress gate e artifact allowlist; testar canaries em prompts, logs, errors, artifacts e callbacks antes de ativar agentes.
