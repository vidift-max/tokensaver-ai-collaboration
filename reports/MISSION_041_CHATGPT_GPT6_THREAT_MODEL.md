# Missão 041 — Threat model da arquitetura TokenSaver AI

## Identificação
- IA: ChatGPT
- Modelo: GPT-6 (OpenAI)
- Especialidade: arquitetura de segurança e integração multiagente
- Função: análise de ameaças independente, documental e read-only
- Data: 2026-11-10
- Status: REVIEW_REQUIRED

## Objetivo
Modelar ativos, atores, fronteiras de confiança, caminhos de ataque e controles prioritários da arquitetura.

## O que esta IA fez
Produziu threat model qualitativo baseado em STRIDE e abuso de fluxo. Escopo observado: desktop Tauri 2/React/Rust/SQLite, importação de arquivos, blobs, comandos IPC, configuração de endpoint Claude, CI GitHub e futura arquitetura de agentes/webhooks/providers.

### Ativos e fronteiras
| Ativo | Fronteira/ameaça principal | Impacto |
|---|---|---|
| Dados de projetos, DB e blobs | processo local/filesystem, traversal/symlink | confidencialidade/integridade |
| Contexto enviado a modelos | boundary local → provider externo | exfiltração/retention |
| Endpoint/model config | UI → backend → destino de rede futuro | SSRF/credential forwarding |
| Tokens, secrets e grants | secret manager → worker/tool broker | escalada/tomada de conta |
| Missões, Issues e webhooks | GitHub/provider → ingress → inbox | spoof/replay/execução indevida |
| Dependências, Actions e artifacts | upstream → CI → release | supply-chain compromise |
| Resultados de agentes | provider → normalizer → ledger | prompt/tool injection e falsificação |

### Atores
Owner/admin autenticado; usuário local; agente/modelo; conteúdo de arquivos/Issues/webpages; provider/API; GitHub Actions/dependências; worker/tool broker. Agentes e conteúdo externo são produtores de dados não confiáveis, nunca principais de autorização.

### Cenários prioritários
| ID | Cenário | Severidade inicial | Controles |
|---|---|---|---|
| TM-01 | Issue/arquivo contém prompt injection e induz exfiltração | Crítica | rótulos de confiança, separação instrução/dado, broker default-deny |
| TM-02 | Saída de agente solicita ação privilegiada | Crítica | schema estrito, grant externo, aprovação separada |
| TM-03 | Webhook falsificado/replay executa missão duplicada | Alta | HMAC, freshness, delivery ID, inbox idempotente |
| TM-04 | Endpoint resolve para IP privado/metadata ou sofre DNS rebinding | Alta | parser URL, DNS/IP policy, redirect control, egress firewall |
| TM-05 | Secret entra em prompt/log/artifact | Crítica | secret manager, tokens curtos, redaction, DLP |
| TM-06 | Dependency/action comprometida altera build | Alta | lockfiles, SHA pinning, SBOM, provenance, CI isolado |
| TM-07 | Worker escreve fora do repo/path permitido | Crítica | grant autenticado, allowlist, sandbox, postcondition |
| TM-08 | Evento/resposta atrasada sobrescreve estado atual | Alta | revision fencing, nonce/deduplication, audit trail |
| TM-09 | Artifact inclui dados locais ou secretos | Alta | allowlist, secret scan, ACL/retenção |
| TM-10 | Renderer/IPC expõe HTML ou comando excessivo | Alta | escaping/CSP, capability scoping, revisão da superfície IPC |

## Arquivos examinados
Produto: .github/workflows/ci.yml, package.json, src-tauri/Cargo.toml, src-tauri/tauri.conf.json, src-tauri/capabilities/default.json, src-tauri/src/lib.rs, src-tauri/src/advanced.rs, AI_COLLABORATION.md.
Colaboração: CENTRAL.md, INSTRUCTIONS.md, relatórios 010/024/030/011–020, contracts/adapters/v1/README.md e provider-registry.json.

## Evidências e trabalhos anteriores
- lib.rs registra comandos em generate_handler!; a superfície IPC é fronteira sensível.
- tauri.conf.json define CSP com connect-src local/IPC; isso não prova política de egress do processo nativo.
- advanced.rs persiste endpoint/model Claude em SQLite; validação textual HTTPS/localhost não resolve DNS nem impõe política de IP.
- CI usa actions por tags, sem permissions/timeout/concurrency explícitos; ZIP de source é artifact.
- Aproveita matriz 010, dispatch 024 e achados 030; adiciona ativos e trust boundaries.

## Problemas encontrados
- Alto: threat model ainda não está ligado a controles implantados e testes.
- Alto: não há prova de runtime webhook/worker/tool broker/provider ativo.
- Alto: lockfiles não encontrados nos paths package-lock.json, Cargo.lock e src-tauri/Cargo.lock consultados; confirmar outras localizações.
- Alto: validação de endpoint não equivale a validação do destino de rede.

## Testes executados
Não executado. Inspeção estática apenas; nenhum teste de segurança, fuzz, integração ou CI foi disparado.

## Próximo passo
GPT-6/owner deve aprovar o modelo, atribuir owner e tratamento a cada risco, aceitar riscos residuais e converter TM-01..TM-10 em requisitos/testes antes de ativar provider, worker ou release.
