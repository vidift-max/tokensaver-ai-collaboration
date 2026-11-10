# Missão 041 — Threat model da arquitetura TokenSaver + colaboração

- **IA/modelo:** ChatGPT — GPT-6; integração, automação e análise de segurança.
- **Data:** 2026-11-10 | **Branch:** v2-saas-alpha
- **Status:** REVIEW_REQUIRED — threat model documental baseado em evidência estática.

## Objetivo e escopo
Modelar ameaças do desktop TokenSaver (Tauri 2 + React + Rust + SQLite/arquivos), repositório de colaboração, futura automação GitHub e adapters multiagente. Não pressupõe que os componentes futuros estejam implantados.

## Ativos e fronteiras de confiança
1. Conteúdo dos projetos, arquivos importados, templates, artigos e memória.
2. Banco SQLite, blobs SHA-256, backups e histórico.
3. Configuração de provider (endpoint/model/enabled); credenciais futuras.
4. Contratos, missões, Issues, PRs, artifacts e logs GitHub.
5. Identidades de agentes, grants, leases, budget ledger e resultados.
6. Build, dependências, workflows, artefatos de release e updater futuro.

Fronteiras: usuário↔frontend; frontend↔Tauri IPC; backend↔filesystem/SQLite; importador↔conteúdo externo; agente↔orquestrador; orquestrador↔GitHub; backend↔provider; CI↔dependências/artifacts.

## Adversários e STRIDE
| Ameaça | Exemplo | Impacto | Mitigação prioritária |
|---|---|---|---|
| Spoofing | webhook/agent falso | execução não autorizada | assinatura, identidade autenticada, replay protection |
| Tampering | arquivo/Issue altera missão | decisão/código adulterado | hash, schema, provenance, revisão |
| Repudiation | ação sem vínculo a run/commit | auditoria impossível | correlation IDs, append-only events |
| Information disclosure | prompt inclui segredo/conteúdo de outro projeto | vazamento | classificação, minimização, redaction |
| DoS | arquivo enorme, loop de retry, provider 429 | indisponibilidade/custo | quotas, rate limits, circuit breaker |
| Elevation | prompt pede shell/GitHub write | alteração não autorizada | default-deny, tool broker, approval gate |

## Cenários de maior risco
- Conteúdo importado ou Issue contém prompt injection e agente o interpreta como instrução.
- Token de GitHub/API vaza por logs, frontend, artifact ou prompt.
- Endpoint configurável resolve para IP interno (SSRF/DNS rebinding).
- Workflow executa código de PR não confiável com token write.
- Dependência/action comprometida altera build ou exfiltra secrets.
- Replay/duplicação de webhook gera duas execuções ou gasto duplicado.
- Path/symlink/TOCTOU permite leitura ou escrita fora do projeto.
- Resposta tardia de agente antigo publica resultado após lease expirar.

## Evidência observada
- `src-tauri/tauri.conf.json`: CSP limita connect-src a self/IPC; script-src self; style-src contém unsafe-inline.
- `src-tauri/capabilities/default.json`: apenas `core:default` na capability consultada.
- `src-tauri/src/lib.rs`: comandos Tauri são registrados explicitamente em generate_handler.
- `src-tauri/src/advanced.rs`: ClaudeConfig persiste enabled/endpoint/model; há validação sintática do endpoint, sem execução de inferência observada.
- `.github/workflows/ci.yml`: Actions referenciadas por tags (@v4/@stable), npm install sem lockfile encontrado nos caminhos consultados, sem permissions/timeout/concurrency explícitos no trecho auditado.
- `package.json` e `src-tauri/Cargo.toml`: dependências diretas declaradas; lockfiles não encontrados nos paths consultados.
- README declara que provider real ainda exige camada segura de credenciais/HTTP.

## Priorização
**Crítico antes de provider real:** autenticação de webhook, secret manager, egress/SSRF, tool broker default-deny, isolamento de conteúdo não confiável, GitHub permissions mínimas e proteção de branches.
**Alto antes de produção:** pinning SHA de Actions, lockfiles, SBOM, provenance, replay/dedupe, redaction, limites de custo e audit trail.
**Médio:** CSP hardening, revisão periódica de grants, exercícios de incident response.

## Limitações
Auditoria estática de arquivos selecionados, não pentest. Não foram acessados settings administrativos, secrets, logs de auditoria, tráfego, runtime, binários ou ambiente Windows. Achados de ausência referem-se somente aos arquivos consultados.

## Testes executados
Leitura de arquivos GitHub e inspeção estática. Nenhum teste dinâmico, fuzzing, SAST/DAST, build ou CI executado.

## RECOMENDAÇÃO AO GPT-6
Adotar este threat model como baseline de revisão; tratar webhook, prompt/tool injection, egress, secrets e CI supply chain como gates bloqueadores antes de qualquer provider real ou automação com escrita.